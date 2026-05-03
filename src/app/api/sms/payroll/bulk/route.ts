import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { calculatePAYETax } from '@/lib/nigeria-tax';

const bulkPayrollSchema = z.object({
  employeeType: z.enum(['TEACHER', 'STAFF']),
  branchId: z.string().uuid().optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  overrideBasicSalary: z.number().optional(),
  overrideHousingAllowance: z.number().optional(),
  overrideTransportAllowance: z.number().optional(),
  overrideOtherAllowances: z.number().optional(),
  overridePensionRate: z.number().optional(),
  overrideTaxRate: z.number().optional(),
  overrideNhfRate: z.number().optional(),
});

import { z } from 'zod';

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
    const { employeeType, branchId, employeeIds, month, year, overrideBasicSalary, overrideHousingAllowance, overrideTransportAllowance, overrideOtherAllowances, overridePensionRate, overrideTaxRate, overrideNhfRate } = body;

    let employees: any[] = [];

    if (employeeType === 'TEACHER') {
      const where: any = { 
        tenantId: authUser.tenantId, 
        status: 'ACTIVE' 
      };
      
      if (branchId) {
        where.branchId = branchId;
      }
      
      if (employeeIds && employeeIds.length > 0) {
        where.id = { in: employeeIds };
      }

      employees = await prisma.teacher.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          basicSalary: true,
        },
      });
    } else {
      const where: any = { 
        tenantId: authUser.tenantId, 
        status: 'ACTIVE' 
      };
      
      if (branchId) {
        where.branchId = branchId;
      }
      
      if (employeeIds && employeeIds.length > 0) {
        where.id = { in: employeeIds };
      }

      employees = await prisma.staff.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          basicSalary: true,
        },
      });
    }

    if (employees.length === 0) {
      return NextResponse.json({ error: 'No employees found' }, { status: 400 });
    }

    const pensionRate = overridePensionRate || 8;
    const nhfRate = overrideNhfRate || 2.5;

    const results = [];
    const errors = [];

    for (const employee of employees) {
      try {
        const basicSalary = overrideBasicSalary ?? employee.basicSalary ?? 0;
        const housingAllowance = overrideHousingAllowance ?? 10000;
        const transportAllowance = overrideTransportAllowance ?? 5000;
        const otherAllowances = overrideOtherAllowances ?? 0;

        const grossEarnings = basicSalary + housingAllowance + transportAllowance + otherAllowances;
        
        const pensionDeduction = Math.round((basicSalary * (pensionRate / 100)) * 100) / 100;
        const nhfDeduction = Math.round((basicSalary * (nhfRate / 100)) * 100) / 100;
        
        const taxDetails = calculatePAYETax(grossEarnings);
        const taxDeduction = taxDetails.monthlyTax;

        const totalDeductions = pensionDeduction + taxDeduction + nhfDeduction;
        const netPay = grossEarnings - totalDeductions;

        const existing = await prisma.payroll.findFirst({
          where: {
            employeeType,
            teacherId: employeeType === 'TEACHER' ? employee.id : null,
            staffId: employeeType === 'STAFF' ? employee.id : null,
            month,
            year,
          },
        });

        if (existing) {
          errors.push({ employeeId: employee.employeeId, error: 'Payroll already exists' });
          continue;
        }

        const payroll = await prisma.payroll.create({
          data: {
            employeeType,
            teacherId: employeeType === 'TEACHER' ? employee.id : null,
            staffId: employeeType === 'STAFF' ? employee.id : null,
            month,
            year,
            basicSalary,
            housingAllowance,
            transportAllowance,
            otherAllowances,
            totalEarnings: grossEarnings,
            pensionDeduction,
            taxDeduction,
            nhfDeduction,
            otherDeductions: 0,
            totalDeductions,
            netPay,
            status: 'DRAFT',
            tenantId: authUser.tenantId,
          },
        });

        results.push({
          id: payroll.id,
          employeeId: employee.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          netPay,
          status: 'created',
        });
      } catch (err: any) {
        errors.push({ employeeId: employee.employeeId, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Bulk Payroll POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}