import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    const event = JSON.parse(body);
    
    const { status, message, transactionRef, amount, destinationAccount } = event;

    console.log('Remita webhook received:', { transactionRef, status, message });

    if (transactionRef) {
      const payroll = await prisma.payroll.findFirst({
        where: { paymentReference: transactionRef },
      });

      if (payroll) {
        let newStatus = payroll.status;
        
        if (status === 'SUCCESS' || status === 'successful' || status === 'Completed') {
          newStatus = 'PAID';
          await prisma.payroll.update({
            where: { id: payroll.id },
            data: {
              status: 'PAID',
              paymentDate: new Date(),
            },
          });
          
          await prisma.platformAuditLog.create({
            data: {
              actorType: 'SYSTEM',
              actorEmail: 'remita@system.com',
              action: 'SALARY_PAID_VIA_REMITA',
              actionType: 'UPDATE',
              category: 'PAYROLL',
              targetType: 'payroll',
              targetId: payroll.id,
              targetName: `Salary ${payroll.month}/${payroll.year}`,
              description: `Salary payment completed via Remita for ${transactionRef}`,
              metadata: { transactionRef, amount, status },
            },
          });
        } else if (status === 'FAILED' || status === 'failed' || status === 'Failed') {
          newStatus = 'APPROVED';
          await prisma.payroll.update({
            where: { id: payroll.id },
            data: {
              status: 'APPROVED',
            },
          });
        }

        console.log(`Updated payroll ${payroll.id} status to ${newStatus}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Remita webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Remita webhook endpoint' });
}
