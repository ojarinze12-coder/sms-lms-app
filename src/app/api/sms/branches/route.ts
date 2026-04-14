import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = authUser.tenantId || authUser.originalUserId;
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
  }

  try {
    const branches = await prisma.branch.findMany({
      where: { tenantId },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('[branches GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  console.log('[branches POST] authUser:', JSON.stringify(authUser));
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log('[branches POST] body:', body);
    const { name, code, address, phone, email, isMain } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const tenantId = authUser.tenantId || authUser.originalUserId;
    console.log('[branches POST] tenantId:', tenantId);
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found. Please login again.' }, { status: 400 });
    }

    // Create branch directly
    const branch = await prisma.branch.create({
      data: {
        name: name,
        code: code.toUpperCase(),
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        isMain: isMain || false,
        tenantId: tenantId,
      },
    });

    console.log('[branches POST] Created:', branch);
    return NextResponse.json({ branch });
  } catch (error: any) {
    console.error('[branches POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create branch' }, { status: 500 });
  }
}