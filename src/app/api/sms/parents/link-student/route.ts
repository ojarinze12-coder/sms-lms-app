import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  console.log('[link-student] Auth user:', authUser);
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[link-student] User role:', authUser.role);
  
  if (authUser.role !== 'PARENT') {
    return NextResponse.json({ error: 'Forbidden - Parent access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { studentId, relationship, isPrimaryContact } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const parent = await prisma.parent.findFirst({
      where: { userId: authUser.userId }
    });

    if (!parent || !parent.tenantId) {
      console.log('[link-student] No parent record found, creating one...');
      console.log('[link-student] Auth user details:', {
        userId: authUser.userId,
        email: authUser.email,
        tenantId: authUser.tenantId,
        role: authUser.role
      });
      
      // Create parent record if it doesn't exist
      let tenantId = authUser.tenantId || null;
      
      if (!tenantId) {
        // Try to find a default tenant
        const defaultTenant = await prisma.tenant.findFirst();
        if (!defaultTenant) {
          return NextResponse.json(
            { error: 'No school found' },
            { status: 404 }
          );
        }
        tenantId = defaultTenant.id;
      }

      const newParent = await prisma.parent.create({
        data: {
          firstName: authUser.firstName || '',
          lastName: authUser.lastName || '',
          email: authUser.email,
          userId: authUser.userId,
          tenantId: tenantId,
          relationship: 'GUARDIAN',
          isPrimaryContact: true,
          approvalStatus: 'APPROVED'
        }
      });

      return NextResponse.json(
        { error: 'Parent account created. Please try linking again.' },
        { status: 201 }
      );
    }

    console.log('[link-student] Found parent:', parent.id);

    const siblingDiscount = await prisma.siblingDiscount.findFirst({
      where: { tenantId: parent.tenantId, isActive: true }
    });

    const linkingMode = siblingDiscount?.linkingMode || 'ADMIN_APPROVAL';
    const approvalStatus = linkingMode === 'AUTO_APPROVE' ? 'APPROVED' : 'PENDING';

    const student = await prisma.student.findFirst({
      where: {
        studentId,
        tenantId: parent.tenantId
      }
    });

    console.log('[link-student] Student search:', { studentId, parentTenantId: parent.tenantId, found: !!student });
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found. Please check the student ID and try again.' },
        { status: 404 }
      );
    }

    const existingLink = await prisma.parentStudent.findUnique({
      where: {
        parent_student_unique: {
          parentId: parent.id,
          studentId: student.id
        }
      }
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'This student is already linked to your account' },
        { status: 400 }
      );
    }

    const otherParentLinks = await prisma.parentStudent.findMany({
      where: {
        studentId: student.id,
        isPrimaryContact: true,
        approvalStatus: 'APPROVED'
      }
    });

    const finalIsPrimaryContact = isPrimaryContact !== false && otherParentLinks.length === 0;

    console.log('[link-student] Creating link with data:', {
      parentId: parent.id,
      studentId: student.id,
      tenantId: parent.tenantId,
      relationship: relationship || parent.relationship || 'GUARDIAN',
      isPrimaryContact: finalIsPrimaryContact,
      approvalStatus
    });

    const studentLink = await prisma.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        tenantId: parent.tenantId,
        relationship: relationship || parent.relationship || 'GUARDIAN',
        isPrimaryContact: finalIsPrimaryContact,
        approvalStatus
      }
    });

    console.log('[link-student] Successfully created link:', studentLink.id);

    return NextResponse.json({
      message: linkingMode === 'AUTO_APPROVE' 
        ? 'Successfully linked to student' 
        : 'Link request submitted. Pending approval.',
      linkingMode,
      approvalStatus,
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Link student error:', error);
    return NextResponse.json(
      { error: 'Failed to link student: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser || authUser.role !== 'PARENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parent = await prisma.parent.findFirst({
      where: { userId: authUser.userId },
      include: {
        parentStudents: {
          include: {
            student: true
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ children: [] });
    }

    const children = parent.parentStudents.map(ps => ({
      id: ps.student.id,
      studentId: ps.student.studentId,
      firstName: ps.student.firstName,
      lastName: ps.student.lastName,
      gender: ps.student.gender,
      relationship: ps.relationship,
      isPrimaryContact: ps.isPrimaryContact,
      approvalStatus: ps.approvalStatus,
      linkedAt: ps.createdAt
    }));

    return NextResponse.json({ children });
  } catch (error) {
    console.error('Get children error:', error);
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}
