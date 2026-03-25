import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { paystack, formatAmountToKobo } from '@/lib/paystack';
import { flutterwave } from '@/lib/flutterwave';
import { sendFeeReminder } from '@/lib/notifications';

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

    const where: any = { tenantId: user.tenantId };
    
    if (studentId) where.studentId = studentId;
    if (feeId) where.feeId = feeId;
    if (status) where.status = status;

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        feeStructure: true,
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
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, studentId, feeId, amount, method, gateway } = body;

    if (action === 'initialize') {
      return initializePayment(user, studentId, feeId, amount, gateway);
    }

    if (action === 'record') {
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
  feeId: string,
  amount: number,
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

  const feeStructure = await prisma.feeStructure.findFirst({
    where: { id: feeId, tenantId: user.tenantId },
  });

  if (!feeStructure) {
    return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
  }

  const parent = student.parents[0];
  const email = parent?.email || student.email || user.email;
  const phone = parent?.phone || student.phone;

  if (!email) {
    return NextResponse.json({ error: 'No email found for payment' }, { status: 400 });
  }

  const referenceNo = `FEE_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const metadata = {
    tenantId: user.tenantId,
    studentId,
    feeId,
    referenceNo,
    studentName: `${student.firstName} ${student.lastName}`,
    feeName: feeStructure.name,
  };

  let paymentLink;
  let paymentGateway: string = gateway;

  // Check if payment gateway is configured
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!paystackKey && gateway === 'PAYSTACK') {
    // Demo mode - create mock payment link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    paymentLink = `${baseUrl}/pay/demo?ref=${referenceNo}&amount=${amount}`;
    paymentGateway = 'DEMO';
  } else if (!flutterwaveKey && gateway === 'FLUTTERWAVE') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    paymentLink = `${baseUrl}/pay/demo?ref=${referenceNo}&amount=${amount}`;
    paymentGateway = 'DEMO';
  } else if (gateway === 'PAYSTACK') {
    const response = await paystack.initializePayment({
      email,
      amount: formatAmountToKobo(amount),
      currency: 'NGN',
      reference: referenceNo,
      metadata,
    });

    if (!response.status) {
      return NextResponse.json({ error: response.message }, { status: 400 });
    }

    paymentLink = response.data.authorization_url;
  } else {
    const response = await flutterwave.initializePayment({
      email,
      name: `${student.firstName} ${student.lastName}`,
      amount,
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
      amount,
      method: 'ONLINE',
      status: 'PENDING',
      referenceNo,
      paymentGateway,
      studentId,
      feeId,
      tenantId: user.tenantId,
    },
  });

  return NextResponse.json({
    paymentLink,
    reference: referenceNo,
    paymentId: pendingPayment.id,
  });
}

async function recordPayment(user: any, body: any) {
  const { studentId, feeId, amount, method, transactionId, gatewayResponse, status } = body;

  const payment = await prisma.feePayment.create({
    data: {
      amount: parseFloat(amount),
      method: method || 'ONLINE',
      status: status || 'COMPLETED',
      transactionId,
      gatewayResponse,
      studentId,
      feeId,
      tenantId: user.tenantId,
      paidAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, paymentId, status, amount, transactionId, gatewayResponse } = body;

    if (action === 'verify') {
      const payment = await prisma.feePayment.findFirst({
        where: { id: paymentId, tenantId: user.tenantId },
        include: {
          student: {
            include: { parents: true },
          },
          feeStructure: true,
        },
      });

      if (!payment || !payment.referenceNo) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      const reference = payment.referenceNo;

      let verified = false;
      let gatewayData: any = null;

      if (payment.paymentGateway === 'PAYSTACK') {
        const response = await paystack.verifyPayment(reference);
        verified = response.data.status === 'success';
        gatewayData = response.data;
      } else if (payment.paymentGateway === 'FLUTTERWAVE') {
        const response = await flutterwave.verifyTransaction(reference);
        verified = response.data.status === 'successful';
        gatewayData = response.data;
      }

      if (verified) {
        await prisma.feePayment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            transactionId: gatewayData?.id?.toString() || transactionId,
            gatewayResponse: gatewayData,
            paidAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, message: 'Payment verified successfully' });
      }

      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
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
