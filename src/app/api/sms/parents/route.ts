import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'PARENT') {
    return NextResponse.json({ error: 'Forbidden - Parent access required' }, { status: 403 });
  }

  try {
    const parent = await prisma.parent.findFirst({
      where: { userId: authUser.userId },
      include: {
        parentStudents: {
          include: {
            student: {
              include: {
                enrollments: {
                  include: {
                    academicClass: true
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ 
        parent: { firstName: authUser.firstName || '', lastName: authUser.lastName || '', email: authUser.email },
        children: [], 
        fees: [], 
        attendances: [], 
        announcements: [] 
      });
    }

    const children = parent.parentStudents.map(ps => ({
      id: ps.student.id,
      studentId: ps.student.studentId,
      firstName: ps.student.firstName,
      lastName: ps.student.lastName,
      email: ps.student.email,
      phone: ps.student.phone,
      relationship: ps.relationship,
      isPrimaryContact: ps.isPrimaryContact,
      approvalStatus: ps.approvalStatus,
      linkedAt: ps.createdAt,
      class: ps.student.enrollments[0]?.academicClass || null,
    }));

    if (children.length === 0) {
      return NextResponse.json({
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phone: parent.phone,
        },
        children: [],
        results: [],
        reportCards: [],
        fees: [],
        attendances: [],
        announcements: [],
      });
    }

    const studentIds = children.map(c => c.id);

    const results = await prisma.result.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        exam: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            term: { 
              select: { id: true, name: true, academicYear: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { gradedAt: 'desc' },
      take: 20
    });

    const reportCards = await prisma.reportCard.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        term: { 
          select: { id: true, name: true, academicYear: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const fees = await prisma.feePayment.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        feeStructure: {
          include: {
            academicYear: { select: { name: true } },
            term: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const attendances = await prisma.attendance.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { date: 'desc' },
      take: 30
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        tenantId: parent.tenantId,
        isPublished: true,
        OR: [
          { targetRoles: { has: 'PARENT' } },
          { targetRoles: { has: 'STUDENT' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone,
      },
      children,
      results: results || [],
      reportCards: reportCards || [],
      fees: fees || [],
      attendances: attendances || [],
      announcements: announcements || [],
    });
  } catch (error) {
    console.error('Error fetching parent portal data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
