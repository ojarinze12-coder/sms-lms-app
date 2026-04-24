import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  console.log('[parent-links GET] Auth:', authUser);
  
  if (!authUser || !authUser.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'ACADEMIC_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const where: any = {
      parent: { tenantId: authUser.tenantId }
    };

    if (status && status !== 'all') {
      where.approvalStatus = status;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    console.log('[parent-links GET] Query where:', where);

    const requests = await prisma.parentStudent.findMany({
      where,
      include: {
        parent: true,
        student: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('[parent-links GET] Found requests:', requests.length);

    const formatted = requests.map(r => ({
      id: r.id,
      student: {
        id: r.student.id,
        studentId: r.student.studentId,
        firstName: r.student.firstName,
        lastName: r.student.lastName,
        gender: r.student.gender,
        class: r.student.currentClassId
      },
      parent: {
        id: r.parent.id,
        firstName: r.parent.firstName,
        lastName: r.parent.lastName,
        email: r.parent.email,
        phone: r.parent.phone,
        relationship: r.relationship
      },
      isPrimaryContact: r.isPrimaryContact,
      approvalStatus: r.approvalStatus,
      createdAt: r.createdAt,
      approvedAt: r.approvedAt
    }));

    return NextResponse.json({ requests: formatted });
  } catch (error) {
    console.error('Get linking requests error:', error);
    console.error('Error details:', (error as Error).message, (error as Error).stack);
    return NextResponse.json({ error: 'Failed to fetch requests: ' + (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authUser = await getAuthUser();
  console.log('[parent-links PATCH] Auth:', authUser);
  console.log('[parent-links PATCH] Role:', authUser?.role, 'TenantId:', authUser?.tenantId);
  
  if (!authUser || !authUser.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'ACADEMIC_ADMIN'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden - Role: ' + authUser.role }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { requestId, action, isPrimaryContact } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.parentStudent.findUnique({
      where: { id: requestId },
      include: { student: true }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (existingRequest.parent.tenantId !== authUser.tenantId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      if (isPrimaryContact) {
        await prisma.parentStudent.updateMany({
          where: {
            studentId: existingRequest.studentId,
            id: { not: requestId },
            approvalStatus: 'APPROVED'
          },
          data: { isPrimaryContact: false }
        });
      }

      const updated = await prisma.parentStudent.update({
        where: { id: requestId },
        data: {
          approvalStatus: 'APPROVED',
          approvedBy: authUser.userId,
          approvedAt: new Date(),
          isPrimaryContact: isPrimaryContact ?? existingRequest.isPrimaryContact
        }
      });

      return NextResponse.json({
        message: 'Request approved',
        request: updated
      });
    } else {
      const updated = await prisma.parentStudent.update({
        where: { id: requestId },
        data: {
          approvalStatus: 'REJECTED',
          approvedBy: authUser.userId,
          approvedAt: new Date()
        }
      });

      return NextResponse.json({
        message: 'Request rejected',
        request: updated
      });
    }
  } catch (error) {
    console.error('Process request error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
