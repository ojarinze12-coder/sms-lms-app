import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { URLSearchParams } from 'url';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const whereClause: any = { tenantId: authUser.tenantId };

    if (branchId && branchId !== 'all') {
      whereClause.branchId = branchId;
    } else if (authUser.branchId && authUser.role !== 'SUPER_ADMIN' && branchId !== 'all') {
      whereClause.branchId = authUser.branchId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const usersWithBranch = await Promise.all(
      users.map(async (user) => {
        let branch = null;
        if (user.branchId) {
          branch = await prisma.branch.findUnique({
            where: { id: user.branchId },
            select: { id: true, name: true },
          });
        }
        return {
          ...user,
          branchId: user.branchId,
          branch,
        };
      })
    );

    return NextResponse.json({ users: usersWithBranch });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId || !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, role, branchId } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    let userBranchId: string | null = null;
    if (branchId && branchId !== 'none') {
      userBranchId = branchId;
    } else if (!branchId && authUser.branchId) {
      userBranchId = authUser.branchId;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        tenantId: authUser.tenantId,
        branchId: userBranchId,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
