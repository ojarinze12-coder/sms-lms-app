import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { remita } from '@/lib/remita';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, payrollIds, bankCode, accountNumber, paymentDate } = body;

    if (action === 'validate_account') {
      if (!bankCode || !accountNumber) {
        return NextResponse.json({ error: 'Bank code and account number required' }, { status: 400 });
      }

      const result = await remita.validateAccount(accountNumber, bankCode);
      return NextResponse.json(result);
    }

    if (action === 'disburse') {
      if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
        return NextResponse.json({ error: 'Payroll IDs required' }, { status: 400 });
      }

      const payrolls = await prisma.payroll.findMany({
        where: {
          id: { in: payrollIds },
          status: 'APPROVED',
          tenantId: authUser.tenantId,
        },
        include: {
          teacher: {
            include: {
              user: { select: { email: true } }
            }
          },
        },
      });

      if (payrolls.length === 0) {
        return NextResponse.json({ error: 'No approved payrolls found' }, { status: 400 });
      }

      const results = [];
      const salaryBatchId = `BATCH_${Date.now()}`;

      for (const payroll of payrolls) {
        try {
          const employeeId = payroll.teacher.employeeId || payroll.teacherId;
          
          const paymentRequest = {
            employeeName: `${payroll.teacher.firstName} ${payroll.teacher.lastName}`,
            employeeId: employeeId,
            bankCode: bankCode,
            accountNumber: accountNumber || payroll.teacher.bankAccount || '',
            amount: Math.round(payroll.netPay || 0),
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            description: `Salary payment for ${payroll.month}/${payroll.year}`,
          };

          const remitaResponse = await remita.initiateSalaryPayment(paymentRequest);

          await prisma.payroll.update({
            where: { id: payroll.id },
            data: {
              status: 'PROCESSING',
              paymentReference: remitaResponse?.reference || `REF_${Date.now()}`,
            },
          });

          results.push({
            payrollId: payroll.id,
            employeeName: paymentRequest.employeeName,
            amount: paymentRequest.amount,
            status: 'PROCESSING',
            reference: remitaResponse?.reference,
          });
        } catch (error: any) {
          console.error(`Error processing payroll ${payroll.id}:`, error);
          results.push({
            payrollId: payroll.id,
            employeeName: `${payroll.teacher.firstName} ${payroll.teacher.lastName}`,
            status: 'FAILED',
            error: error.message,
          });
        }
      }

      return NextResponse.json({
        batchId: salaryBatchId,
        processed: results.filter((r: any) => r.status === 'PROCESSING').length,
        failed: results.filter((r: any) => r.status === 'FAILED').length,
        results,
      });
    }

    if (action === 'get_banks') {
      const banks = await remita.getBanks();
      return NextResponse.json(banks);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Remita salary payment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process payment' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (reference) {
      const status = await remita.getSalaryPaymentStatus(reference);
      return NextResponse.json(status);
    }

    return NextResponse.json({ message: 'Use POST to initiate payments. Add ?reference=xxx to check status.' });
  } catch (error: any) {
    console.error('Remita status check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
