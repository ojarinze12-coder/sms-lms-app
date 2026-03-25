import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createPayrollSchema = z.object({
  teacherId: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  basicSalary: z.number().min(0),
  housingAllowance: z.number().optional(),
  transportAllowance: z.number().optional(),
  otherAllowances: z.number().optional(),
  pensionDeduction: z.number().optional(),
  taxDeduction: z.number().optional(),
  nhfDeduction: z.number().optional(),
  otherDeductions: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json(payrolls || []);
  } catch (error) {
    console.error('Payroll GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const data = createPayrollSchema.parse(body);

    const totalEarnings = (data.basicSalary || 0) + 
      (data.housingAllowance || 0) + 
      (data.transportAllowance || 0) + 
      (data.otherAllowances || 0);

    const totalDeductions = (data.pensionDeduction || 0) + 
      (data.taxDeduction || 0) + 
      (data.nhfDeduction || 0) + 
      (data.otherDeductions || 0);

    const netPay = totalEarnings - totalDeductions;

    const existing = await prisma.payroll.findUnique({
      where: {
        teacherId_month_year: {
          teacherId: data.teacherId,
          month: data.month,
          year: data.year,
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Payroll already exists for this period' }, { status: 400 });
    }

    const payroll = await prisma.payroll.create({
      data: {
        ...data,
        totalEarnings,
        totalDeductions,
        netPay,
        status: 'DRAFT',
        tenantId: authUser.tenantId,
      },
    });

    return NextResponse.json(payroll, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Payroll POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { payrollId, action, paymentReference } = body;

    if (!payrollId || !action) {
      return NextResponse.json({ error: 'Payroll ID and action required' }, { status: 400 });
    }

    const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    let status = payroll.status;
    if (action === 'approve') {
      status = 'APPROVED';
    } else if (action === 'markPaid') {
      status = 'PAID';
    } else if (action === 'revert') {
      status = 'DRAFT';
    }

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status,
        paymentDate: action === 'markPaid' ? new Date() : undefined,
        paymentReference: paymentReference || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Payroll PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
