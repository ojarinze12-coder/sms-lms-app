import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import { flutterwave } from '@/lib/flutterwave';
import { sendFeeReminder } from '@/lib/notifications';
import { decrypt } from '@/lib/security';

async function processBillPayment(payment: any, amount: number, gatewayData: any) {
  const billId = payment.studentFeeBillId;
  if (!billId) return;

  const bill = await prisma.studentFeeBill.findUnique({
    where: { id: billId },
    include: { items: true },
  });

  if (!bill) return;

  const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  await prisma.$transaction(async (tx) => {
    const receipt = await tx.feeReceipt.create({
      data: {
        receiptNo,
        billId: bill.id,
        studentId: bill.studentId,
        academicYearId: bill.academicYearId,
        termId: bill.termId,
        totalPaid: amount,
        paymentBreakdown: [],
        tenantId: bill.tenantId,
        generatedAt: new Date(),
      },
    });

    const paymentBreakdown: any[] = [];
    let remainingAmount = amount;

    for (const item of bill.items) {
      if (remainingAmount <= 0) break;

      const maxApplicable = item.outstanding;
      if (maxApplicable <= 0) continue;

      const amountToApply = Math.min(remainingAmount, maxApplicable);
      if (amountToApply <= 0) continue;

      const newAmountPaid = item.amountPaid + amountToApply;
      const newOutstanding = Math.max(0, item.amountDue - newAmountPaid);

      await tx.feeBillItem.update({
        where: { id: item.id },
        data: {
          amountPaid: newAmountPaid,
          outstanding: newOutstanding,
          status: newOutstanding <= 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        },
      });

      paymentBreakdown.push({
        itemId: item.id,
        componentName: item.componentName,
        amountPaid: amountToApply,
        outstanding: newOutstanding,
      });

      remainingAmount -= amountToApply;
    }

    await tx.feeReceipt.update({
      where: { id: receipt.id },
      data: { paymentBreakdown },
    });

    const updatedItems = await tx.feeBillItem.findMany({ where: { billId: bill.id } });
    const totalAmountPaid = updatedItems.reduce((sum, i) => sum + i.amountPaid, 0);
    const totalOutstanding = updatedItems.reduce((sum, i) => sum + i.outstanding, 0);
    const allPaid = updatedItems.every(i => i.outstanding <= 0);

    await tx.studentFeeBill.update({
      where: { id: bill.id },
      data: {
        amountPaid: totalAmountPaid,
        balance: totalOutstanding,
        status: allPaid ? 'FULLY_PAID' : totalAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
      },
    });

    await tx.feePayment.update({
      where: { id: payment.id },
      data: {
        feeReceiptId: receipt.id,
        partialAmounts: bill.items.reduce((acc: any, item) => {
          const paymentItem = paymentBreakdown.find(p => p.itemId === item.id);
          if (paymentItem) {
            acc[item.id] = paymentItem.amountPaid;
          }
          return acc;
        }, {}),
      },
    });
  });

  console.log(`Bill payment processed for bill ${billId}, amount: ${amount}, receipt: ${receiptNo}`);
}

async function getTenantPaymentConfig(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: {
      paymentGatewayEnabled: true,
      paymentGateway: true,
      paymentGatewaySecretKey: true,
      paymentGatewayPublicKey: true,
      paymentDemoMode: true,
    }
  });
  return settings;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const feeId = searchParams.get('feeId');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const userBranchId = user?.branchId;
    const where: any = { tenantId: user.tenantId };
    
    if (userBranchId) where.branchId = userBranchId;
    if (studentId) where.studentId = studentId;
    if (feeId) where.feeId = feeId;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            branchId: true,
          },
        },
        feeStructure: true,
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, studentId, feeId, billId, amount, method, gateway } = body;

    if (action === 'initialize') {
      const user = await requireAuth(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return initializePayment(user, studentId, feeId, billId, amount, gateway);
    }

    if (action === 'record') {
      const user = await requireAuth(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return recordPayment(user, body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function initializePayment(
  user: any,
  studentId: string,
  feeId: string | undefined,
  billId: string | undefined,
  amount: number | undefined,
  gateway: 'PAYSTACK' | 'FLUTTERWAVE' = 'PAYSTACK'
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId: user.tenantId },
    include: {
      parents: true,
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  let paymentAmount = amount;
  let feeName = '';
  let studentFeeBillId: string | null = null;

  if (billId) {
    const bill = await prisma.studentFeeBill.findFirst({
      where: { id: billId, studentId, tenantId: user.tenantId },
      include: {
        items: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    studentFeeBillId = bill.id;
    paymentAmount = bill.balance;
    feeName = `School Fees - ${bill.term?.name || 'Current Term'}`;
  } else if (feeId) {
    const feeStructure = await prisma.feeStructure.findFirst({
      where: { id: feeId, tenantId: user.tenantId },
    });

    if (!feeStructure) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    feeName = feeStructure.name;
  } else {
    return NextResponse.json({ error: 'Either feeId or billId must be provided' }, { status: 400 });
  }

  if (!paymentAmount || paymentAmount <= 0) {
    return NextResponse.json({ error: 'No outstanding balance to pay' }, { status: 400 });
  }

  const parent = student.parents[0];
  const email = parent?.email || student.email || user.email;

  if (!email) {
    return NextResponse.json({ error: 'No email found for payment' }, { status: 400 });
  }

  const tenantConfig = await getTenantPaymentConfig(user.tenantId);
  
  if (!tenantConfig?.paymentGatewayEnabled) {
    return NextResponse.json({ 
      error: 'Payment gateway not configured. Please configure payment settings in School Settings.' 
    }, { status: 400 });
  }

  const effectiveGateway = tenantConfig.paymentGateway || gateway;
  let decryptedSecretKey = null;
  
  if (tenantConfig.paymentGatewaySecretKey) {
    try {
      decryptedSecretKey = decrypt(tenantConfig.paymentGatewaySecretKey);
    } catch (e) {
      console.error('Failed to decrypt payment gateway key:', e);
    }
  }

  const referenceNo = billId ? `BILL_${Date.now()}_${Math.random().toString(36).substring(7)}` : `FEE_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const metadata: any = {
    tenantId: user.tenantId,
    studentId,
    referenceNo,
    studentName: `${student.firstName} ${student.lastName}`,
    feeName,
  };

  if (billId) {
    metadata.billId = billId;
  }
  if (feeId) {
    metadata.feeId = feeId;
  }

  let paymentLink;
  let paymentGateway: string = effectiveGateway;

  const tenantDemoMode = tenantConfig.paymentDemoMode || false;
  const isDemoMode = tenantDemoMode || (!decryptedSecretKey && (effectiveGateway === 'PAYSTACK' || effectiveGateway === 'FLUTTERWAVE'));
  
  if (isDemoMode) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    paymentLink = `${baseUrl}/pay/demo?ref=${referenceNo}&amount=${paymentAmount}&gateway=${effectiveGateway}`;
    paymentGateway = 'DEMO';
  } else if (effectiveGateway === 'PAYSTACK') {
    if (!decryptedSecretKey) {
      return NextResponse.json({ error: 'Paystack secret key not configured. Please configure in Settings.' }, { status: 400 });
    }
    
    process.env.PAYSTACK_SECRET_KEY = decryptedSecretKey;
    const response = await paystack.initializePayment({
      email,
      amount: formatAmountToKobo(paymentAmount),
      currency: 'NGN',
      reference: referenceNo,
      metadata,
    });

    if (!response.status) {
      return NextResponse.json({ error: response.message }, { status: 400 });
    }

    paymentLink = response.data.authorization_url;
  } else if (effectiveGateway === 'FLUTTERWAVE') {
    if (!decryptedSecretKey) {
      return NextResponse.json({ error: 'Flutterwave secret key not configured. Please configure in Settings.' }, { status: 400 });
    }
    
    process.env.FLUTTERWAVE_SECRET_KEY = decryptedSecretKey;
    const response = await flutterwave.initializePayment({
      email,
      name: `${student.firstName} ${student.lastName}`,
      amount: paymentAmount,
      currency: 'NGN',
      txRef: referenceNo,
      meta: metadata,
    });

    if (response.status !== 'success') {
      return NextResponse.json({ error: response.message }, { status: 400 });
    }

    paymentLink = response.data.link;
  }

  const pendingPayment = await prisma.feePayment.create({
    data: {
      amount: paymentAmount,
      method: 'ONLINE',
      status: 'PENDING',
      referenceNo,
      paymentGateway,
      studentId,
      feeId: feeId || '',
      studentFeeBillId,
      tenantId: user.tenantId,
      branchId: student.branchId,
    },
  });

  return NextResponse.json({
    paymentLink,
    reference: referenceNo,
    paymentId: pendingPayment.id,
    amount: paymentAmount,
  });
}

async function recordPayment(user: any, body: any) {
  const { studentId, feeId, feeType, amount, method, transactionId, gatewayResponse, status, branchId, paidAt } = body;

  let paymentBranchId = branchId || null;

  if (!paymentBranchId && studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { branchId: true }
    });
    paymentBranchId = student?.branchId || null;
  }

  let feeStructureId = feeId || null;

  if (!feeStructureId && studentId && feeType) {
    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        type: feeType,
        tenantId: user.tenantId,
        OR: [
          { branchId: paymentBranchId },
          { branchId: null }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    feeStructureId = feeStructure?.id || null;
  }

  const payment = await prisma.feePayment.create({
    data: {
      amount: parseFloat(amount),
      method: method || 'CASH',
      status: status || 'COMPLETED',
      transactionId,
      gatewayResponse,
      studentId,
      feeId: feeStructureId,
      tenantId: user.tenantId,
      branchId: paymentBranchId,
      paidAt: paidAt ? new Date(paidAt) : (status === 'COMPLETED' ? new Date() : null),
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, paymentId, status, amount, transactionId, gatewayResponse, referenceNo } = body;

    if (action === 'verify') {
      const user = await requireAuth(request);
      
      let payment;
      
      if (paymentId) {
        payment = await prisma.feePayment.findFirst({
          where: { id: paymentId, tenantId: user?.tenantId },
          include: {
            student: {
              include: { parents: true },
            },
            feeStructure: true,
          },
        });
      } else if (referenceNo) {
        payment = await prisma.feePayment.findFirst({
          where: { referenceNo },
          include: {
            student: {
              include: { parents: true },
            },
            feeStructure: true,
          },
        });
      }

      if (!payment || !payment.referenceNo) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      const reference = payment.referenceNo;
      let verified = false;
      let gatewayData: any = null;

      if (payment.paymentGateway === 'DEMO') {
        verified = true;
        gatewayData = { demo: true, message: 'Demo payment verified' };
      } else if (payment.paymentGateway === 'PAYSTACK') {
        const response = await paystack.verifyPayment(reference);
        verified = response.data.status === 'success';
        gatewayData = response.data;
      } else if (payment.paymentGateway === 'FLUTTERWAVE') {
        const response = await flutterwave.verifyTransaction(reference);
        verified = response.data.status === 'successful';
        gatewayData = response.data;
      }

      if (verified) {
        const amount = gatewayData?.amount ? gatewayData.amount / 100 : parseFloat(gatewayData?.amount || '0');
        
        const paymentData: any = {
          status: 'COMPLETED',
          transactionId: gatewayData?.id?.toString() || transactionId || 'DEMO-' + Date.now(),
          gatewayResponse: gatewayData,
          paidAt: new Date(),
        };

        if (payment.studentFeeBillId) {
          await processBillPayment(payment, amount, gatewayData);
          paymentData.studentFeeBillId = payment.studentFeeBillId;
        }

        await prisma.feePayment.update({
          where: { id: payment.id },
          data: paymentData,
        });

        return NextResponse.json({ success: true, message: 'Payment verified successfully' });
      }

      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'update') {
      const payment = await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          status,
          amount: amount ? parseFloat(amount) : undefined,
          transactionId: transactionId || undefined,
          gatewayResponse: gatewayResponse || undefined,
          paidAt: status === 'COMPLETED' ? new Date() : undefined,
        },
      });

      return NextResponse.json({ payment });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
