import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { generateTeacherId } from '@/lib/generate-id';
import { z } from 'zod';

const createTeacherSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional(),
  salary: z.number().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  lgaOfOrigin: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  branchId: z.string().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional(),
  employmentType: z.string().optional(),
  pensionPin: z.string().optional(),
  nhfNumber: z.string().optional(),
  bvn: z.string().optional(),
  nin: z.string().optional(),
  payeTin: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankSortCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'generate-id') {
      const nextId = await generateTeacherId(authUser.tenantId);
      return NextResponse.json({ employeeId: nextId });
    }

    const position = searchParams.get('position');
    const departmentId = searchParams.get('departmentId');
    const branchId = searchParams.get('branchId');

    const where: any = { tenantId: authUser.tenantId };
    
    if (position) {
      where.position = position;
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        departmentRelation: {
          select: { id: true, name: true, code: true }
        },
        branch: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return NextResponse.json({ data: teachers || [] });
  } catch (error: any) {
    console.error('[TEACHERS GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTeacherSchema.parse(body);

    const existing = await prisma.teacher.findFirst({
      where: {
        tenantId: authUser.tenantId,
        employeeId: data.employeeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        qualification: data.qualification,
        experience: data.experience,
        basicSalary: data.salary,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        address: data.address,
        stateOfOrigin: data.stateOfOrigin,
        lgaOfOrigin: data.lgaOfOrigin,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        position: data.position,
        departmentId: data.departmentId || null,
        employmentType: data.employmentType,
        pensionPin: data.pensionPin,
        nhfNumber: data.nhfNumber,
        bvn: data.bvn,
        nin: data.nin,
        payeTin: data.payeTin,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankSortCode: data.bankSortCode,
        branchId: data.branchId || null,
        tenantId: authUser.tenantId,
      },
      include: {
        branch: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[TEACHERS POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
