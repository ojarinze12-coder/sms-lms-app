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
    console.log('[ParentAPI] Fetching parent for userId:', authUser.userId);
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
    console.log('[ParentAPI] Parent found:', parent ? 'yes' : 'no');

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
    console.log('[ParentAPI] Student IDs:', studentIds);

    if (studentIds.length === 0) {
      console.log('[ParentAPI] No children, returning early');
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
        feeData: [],
        attendances: [],
        announcements: [],
      });
    }

    console.log('[ParentAPI] Fetching results...');
    let results: any[] = [];
    try {
      results = await prisma.result.findMany({
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
    } catch (e: any) { console.error('[ParentAPI] Results query failed:', e.message); }

    console.log('[ParentAPI] Fetching reportCards...');
    let reportCards: any[] = [];
    try {
      reportCards = await prisma.reportCard.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          term: { 
            select: { id: true, name: true, academicYear: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e: any) { console.error('[ParentAPI] ReportCards query failed:', e.message); }

    console.log('[ParentAPI] Fetching bills...');
    let bills: any[] = [];
    try {
      bills = await prisma.studentFeeBill.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          billItems: true,
          academicYear: { select: { id: true, name: true } },
          term: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e: any) { console.error('[ParentAPI] Bills query failed:', e.message); }

    console.log('[ParentAPI] Fetching payments...');
    let payments: any[] = [];
    try {
      payments = await prisma.feePayment.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          feeReceipt: { select: { receiptNo: true } }
        },
        orderBy: { paidAt: 'desc' }
      });
    } catch (e: any) { console.error('[ParentAPI] Payments query failed:', e.message); }

    console.log('[ParentAPI] Fetching receipts...');
    let allReceipts: any[] = [];
    try {
      allReceipts = await prisma.feeReceipt.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          academicYear: { select: { name: true } },
          term: { select: { name: true } },
        },
        orderBy: { generatedAt: 'desc' },
        take: 50
      });
    } catch (e: any) { console.error('[ParentAPI] Receipts query failed:', e.message); }

    const feeDataByStudent = children.map((child: any) => {
      const childBills = bills.filter(b => b.studentId === child.id);
      const childPayments = payments.filter(p => p.studentId === child.id);
      const childReceipts = allReceipts.filter(r => r.studentId === child.id);
      
      const totalBilled = childBills.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalPaid = childBills.reduce((sum, b) => sum + b.amountPaid, 0);
      const totalOutstanding = childBills.reduce((sum, b) => sum + b.balance, 0);
      
      const billItems = childBills.flatMap(b => 
        (b.billItems || []).map(item => ({
          billId: b.id,
          billStatus: b.status,
          academicYear: b.academicYear?.name,
          term: b.term?.name,
          componentName: item.componentName,
          componentType: item.componentType,
          amountDue: item.amountDue,
          amountPaid: item.amountPaid,
          outstanding: item.outstanding,
          status: item.status,
        }))
      );

      return {
        studentId: child.id,
        studentName: `${child.firstName} ${child.lastName}`,
        totalBilled,
        totalPaid,
        outstanding: totalOutstanding,
        bills: childBills.map(b => ({
          id: b.id,
          academicYear: b.academicYear?.name,
          term: b.term?.name,
          totalAmount: b.totalAmount,
          amountPaid: b.amountPaid,
          balance: b.balance,
          status: b.status,
          items: (b.billItems || []).map(item => ({
            componentName: item.componentName,
            amountDue: item.amountDue,
            amountPaid: item.amountPaid,
            outstanding: item.outstanding,
            status: item.status,
          })),
        })),
        payments: childPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          paidAt: p.paidAt,
          transactionId: p.transactionId,
          receiptNo: p.feeReceipt?.receiptNo,
        })),
        receipts: childReceipts.map(r => ({
          id: r.id,
          receiptNo: r.receiptNo,
          totalPaid: r.totalPaid,
          generatedAt: r.generatedAt,
          academicYear: r.academicYear?.name,
          term: r.term?.name,
        })),
        billItems,
      };
    });

    console.log('[ParentAPI] Fetching attendances...');
    let attendances: any[] = [];
    try {
      attendances = await prisma.attendance.findMany({
        where: { studentId: { in: studentIds } },
        orderBy: { date: 'desc' },
        take: 30
      });
    } catch (e: any) { console.error('[ParentAPI] Attendances query failed:', e.message); }

    console.log('[ParentAPI] Fetching announcements...');
    let announcements: any[] = [];
    try {
      announcements = await prisma.announcement.findMany({
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
    } catch (e: any) { console.error('[ParentAPI] Announcements query failed:', e.message); }

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
      feeData: feeDataByStudent,
      attendances: attendances || [],
      announcements: announcements || [],
    });
  } catch (error: any) {
    console.error('Error fetching parent portal data:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error.message || String(error) }, { status: 500 });
  }
}
