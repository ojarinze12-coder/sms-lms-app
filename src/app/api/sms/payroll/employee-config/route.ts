import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const teacherAllowanceSchema = z.object({
  teacherId: z.string().uuid(),
  configId: z.string().uuid(),
  value: z.number().optional(),
  isCustom: z.boolean().optional(),
});

const teacherDeductionSchema = z.object({
  teacherId: z.string().uuid(),
  configId: z.string().uuid(),
  value: z.number().optional(),
});

const staffAllowanceSchema = z.object({
  staffId: z.string().uuid(),
  configId: z.string().uuid(),
  value: z.number().optional(),
  isCustom: z.boolean().optional(),
});

const staffDeductionSchema = z.object({
  staffId: z.string().uuid(),
  configId: z.string().uuid(),
  value: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const staffId = searchParams.get('staffId');
    const type = searchParams.get('type');

    const where: any = { tenantId: authUser.tenantId };

    if (teacherId) {
      where.teacherId = teacherId;
    }
    if (staffId) {
      where.staffId = staffId;
    }

    let result: any = {};

    if (!type || type === 'allowances') {
      const teacherAllowances = teacherId 
        ? await prisma.teacherAllowance.findMany({ where: { teacherId }, include: { config: true } })
        : await prisma.teacherAllowance.findMany({ 
            where: { tenantId: authUser.tenantId }, 
            include: { config: true, teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } } } 
          });
      const staffAllowances = staffId
        ? await prisma.staffAllowance.findMany({ where: { staffId }, include: { config: true } })
        : await prisma.staffAllowance.findMany({ 
            where: { tenantId: authUser.tenantId }, 
            include: { config: true, staff: { select: { id: true, firstName: true, lastName: true, employeeId: true } } } 
          });
      result.teacherAllowances = teacherAllowances;
      result.staffAllowances = staffAllowances;
    }

    if (!type || type === 'deductions') {
      const teacherDeductions = teacherId
        ? await prisma.teacherDeduction.findMany({ where: { teacherId }, include: { config: true } })
        : await prisma.teacherDeduction.findMany({ 
            where: { tenantId: authUser.tenantId }, 
            include: { config: true, teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } } } 
          });
      const staffDeductions = staffId
        ? await prisma.staffDeduction.findMany({ where: { staffId }, include: { config: true } })
        : await prisma.staffDeduction.findMany({ 
            where: { tenantId: authUser.tenantId }, 
            include: { config: true, staff: { select: { id: true, firstName: true, lastName: true, employeeId: true } } } 
          });
      result.teacherDeductions = teacherDeductions;
      result.staffDeductions = staffDeductions;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('EmployeeConfig GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'FINANCE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { employeeType, ...data } = body;

    let result;

    if (employeeType === 'TEACHER') {
      if (data.value !== undefined) {
        result = await prisma.teacherAllowance.upsert({
          where: {
            teacherId_configId: {
              teacherId: data.teacherId,
              configId: data.configId,
            },
          },
          update: { value: data.value, isCustom: data.isCustom || false },
          create: {
            teacherId: data.teacherId,
            configId: data.configId,
            value: data.value,
            isCustom: data.isCustom || false,
            tenantId: authUser.tenantId,
          },
        });
      } else {
        result = await prisma.teacherDeduction.upsert({
          where: {
            teacherId_configId: {
              teacherId: data.teacherId,
              configId: data.configId,
            },
          },
          update: { value: data.value },
          create: {
            teacherId: data.teacherId,
            configId: data.configId,
            value: data.value,
            tenantId: authUser.tenantId,
          },
        });
      }
    } else if (employeeType === 'STAFF') {
      if (data.value !== undefined) {
        result = await prisma.staffAllowance.upsert({
          where: {
            staffId_configId: {
              staffId: data.staffId,
              configId: data.configId,
            },
          },
          update: { value: data.value, isCustom: data.isCustom || false },
          create: {
            staffId: data.staffId,
            configId: data.configId,
            value: data.value,
            isCustom: data.isCustom || false,
            tenantId: authUser.tenantId,
          },
        });
      } else {
        result = await prisma.staffDeduction.upsert({
          where: {
            staffId_configId: {
              staffId: data.staffId,
              configId: data.configId,
            },
          },
          update: { value: data.value },
          create: {
            staffId: data.staffId,
            configId: data.configId,
            value: data.value,
            tenantId: authUser.tenantId,
          },
        });
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('EmployeeConfig POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'FINANCE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type required' }, { status: 400 });
    }

    if (type === 'teacherAllowance') {
      await prisma.teacherAllowance.delete({ where: { id } });
    } else if (type === 'teacherDeduction') {
      await prisma.teacherDeduction.delete({ where: { id } });
    } else if (type === 'staffAllowance') {
      await prisma.staffAllowance.delete({ where: { id } });
    } else if (type === 'staffDeduction') {
      await prisma.staffDeduction.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('EmployeeConfig DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}