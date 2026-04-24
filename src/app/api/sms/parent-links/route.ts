import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export const runtime = 'nodejs';

console.log('[parent-links] Route module loaded');

export async function PATCH(request: NextRequest) {
  const logs: string[] = [];
  
  logs.push('PATCH starting');
  
  try {
    logs.push('Getting auth user...');
    const authUser = await getAuthUser();
    logs.push('Auth result: ' + JSON.stringify(authUser));
    
    if (!authUser || !authUser.tenantId) {
      console.log('[parent-links PATCH] Unauthorized - no auth or no tenantId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'ACADEMIC_ADMIN'];
    if (!allowedRoles.includes(authUser.role)) {
      console.log('[parent-links PATCH] Forbidden - role:', authUser.role);
      return NextResponse.json({ error: 'Forbidden - Role: ' + authUser.role }, { status: 403 });
    }

    console.log('[parent-links PATCH] Parsing body...');
    const body = await request.json();
    const { requestId, action, isPrimaryContact } = body;

    console.log('[parent-links PATCH] Body:', { requestId, action });

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

    console.log('[parent-links PATCH] Finding request:', requestId);
    const existingRequest = await prisma.parentStudent.findUnique({
      where: { id: requestId },
      include: { student: true, parent: true }
    });

    console.log('[parent-links PATCH] Found request:', existingRequest ? 'yes' : 'no');

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
      console.log('[parent-links PATCH] Approving request...');
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

      console.log('[parent-links PATCH] Approved successfully');
      return NextResponse.json({
        message: 'Request approved',
        request: updated
      });
    } else {
      console.log('[parent-links PATCH] Rejecting request...');
      const updated = await prisma.parentStudent.update({
        where: { id: requestId },
        data: {
          approvalStatus: 'REJECTED',
          approvedBy: authUser.userId,
          approvedAt: new Date()
        }
      });

      console.log('[parent-links PATCH] Rejected successfully');
      return NextResponse.json({
        message: 'Request rejected',
        request: updated
      });
    }
  } catch (error) {
    logs.push('ERROR: ' + (error as Error).message);
    logs.push('Stack: ' + (error as Error).stack);
    console.log('[parent-links PATCH] Logs:', logs.join(' | '));
    console.error('[parent-links PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', logs },
      { status: 500 }
    );
  }
  
  console.log('[parent-links PATCH] Logs:', logs.join(' | '));
}

export async function GET(request: NextRequest) {
  console.log('[parent-links GET] Starting');
  
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'ACADEMIC_ADMIN'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    const requests = await prisma.parentStudent.findMany({
      where,
      include: {
        parent: true,
        student: true
      },
      orderBy: { createdAt: 'desc' }
    });

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
    console.error('[parent-links GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}