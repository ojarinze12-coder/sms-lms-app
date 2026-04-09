import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';
import { generateStaffId } from '@/lib/generate-id';

const createStaffSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  category: z.enum(['TEACHING', 'CAREGIVER', 'ADMINISTRATIVE', 'BURSAR', 'LIBRARIAN', 'SECURITY', 'CLEANER', 'DRIVER', 'COOK', 'MAINTENANCE', 'IT_SUPPORT', 'COUNSELOR', 'NURSE', 'OTHER']).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  lgaOfOrigin: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional(),
  joinDate: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CASUAL']).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().optional(),
  pensionPin: z.string().optional(),
  nhfNumber: z.string().optional(),
  bvn: z.string().optional(),
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'generate-id') {
      const nextId = await generateStaffId(authUser.tenantId);
      return NextResponse.json({ employeeId: nextId });
    }

    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    const where: any = {};

    if (authUser.role === 'SUPER_ADMIN') {
      // Super admin can see all
    } else if (authUser.tenantId) {
      where.tenantId = authUser.tenantId;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (status) where.status = status;
    if (department) where.department = department;

    const staff = await prisma.staff.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return NextResponse.json(staff || []);
  } catch (error) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createStaffSchema.parse(body);

    const existingStaff = await prisma.staff.findUnique({
      where: {
        tenantId_employeeId: {
          tenantId: authUser.tenantId,
          employeeId: data.employeeId,
        },
      },
    });

    if (existingStaff) {
      return NextResponse.json({ error: 'Staff with this employee ID already exists' }, { status: 400 });
    }

    const staff = await prisma.staff.create({
      data: {
        employeeId: data.employeeId,
        email: data.email || '',
        firstName: data.firstName,
        lastName: data.lastName,
        category: data.category || 'OTHER',
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        address: data.address,
        stateOfOrigin: data.stateOfOrigin,
        lgaOfOrigin: data.lgaOfOrigin,
        qualification: data.qualification,
        experience: data.experience,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        employmentType: data.employmentType || 'FULL_TIME',
        department: data.department,
        position: data.position,
        salary: data.salary,
        pensionPin: data.pensionPin,
        nhfNumber: data.nhfNumber,
        bvn: data.bvn,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankSortCode: data.bankSortCode,
        tenant: {
          connect: { id: authUser.tenantId },
        },
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && authUser.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    if (staff.tenantId !== authUser.tenantId && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const processedData: any = { ...updateData };
    if (updateData.dateOfBirth) {
      processedData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.joinDate) {
      processedData.joinDate = new Date(updateData.joinDate);
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: processedData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Staff PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    if (staff.tenantId !== authUser.tenantId && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
