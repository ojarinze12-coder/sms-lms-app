import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';
import { calculatePAYETax } from '@/lib/nigeria-tax';

const createPayrollSchema = z.object({
  employeeType: z.enum(['TEACHER', 'STAFF']),
  teacherId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
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
    const employeeType = searchParams.get('employeeType');
    const teacherId = searchParams.get('teacherId');
    const staffId = searchParams.get('staffId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    const where: any = { tenantId: authUser.tenantId };
    
    if (employeeType) where.employeeType = employeeType;
    if (teacherId) where.teacherId = teacherId;
    if (staffId) where.staffId = staffId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        staff: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
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

    const existing = await prisma.payroll.findFirst({
      where: {
        employeeType: data.employeeType,
        teacherId: data.teacherId || null,
        staffId: data.staffId || null,
        month: data.month,
        year: data.year,
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Payroll already exists for this period' }, { status: 400 });
    }

    const payroll = await prisma.payroll.create({
      data: {
        employeeType: data.employeeType,
        teacherId: data.employeeType === 'TEACHER' ? data.teacherId : null,
        staffId: data.employeeType === 'STAFF' ? data.staffId : null,
        month: data.month,
        year: data.year,
        basicSalary: data.basicSalary,
        housingAllowance: data.housingAllowance || 0,
        transportAllowance: data.transportAllowance || 0,
        otherAllowances: data.otherAllowances || 0,
        pensionDeduction: data.pensionDeduction || 0,
        taxDeduction: data.taxDeduction || 0,
        nhfDeduction: data.nhfDeduction || 0,
        otherDeductions: data.otherDeductions || 0,
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
