import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { SubmitFeeRegistrationSchema } from '@/lib/schemas/fee';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const termId = searchParams.get('termId');

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        tenantId: user.tenantId,
        OR: [
          { userId: user.id },
          ...(user.role === 'PARENT'
            ? [{ parents: { some: { userId: user.id } } }]
            : []),
        ],
      },
      include: {
        enrollments: {
          where: { academicClass: { academicYearId } },
          include: {
            academicClass: {
              include: { tier: true },
            },
          },
        },
        parentStudents: {
          include: { parent: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const enrollment = student.enrollments[0];
    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled for this academic year' }, { status: 404 });
    }

    const tierId = enrollment.academicClass.tierId;

    const where: any = {
      academicYearId,
      tenantId: user.tenantId,
      OR: [
        { tierId: tierId },
        { tierId: null },
        { branchId: student.branchId },
        { branchId: null },
      ],
    };
    if (termId) where.termId = termId;

    const components = await prisma.feeComponent.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    let registration = null;
    if (termId) {
      registration = await prisma.studentFeeRegistration.findUnique({
        where: {
          studentId_academicYearId_termId: {
            studentId: student.id,
            academicYearId,
            termId,
          },
        },
      });

      if (registration) {
        const selections = await prisma.studentFeeComponentSelection.findMany({
          where: { registrationId: registration.id },
        });
        registration = { ...registration, selections };
      }
    }

    const mandatoryComponents = components.filter((c) => c.category === 'MANDATORY');
    const optionalComponents = components.filter((c) => c.category === 'OPTIONAL');

    const selectedOptionalIds = registration?.selections.map((s: any) => s.componentId) || [];

    const parent = student.parentStudents.find((ps) => ps.isPrimaryContact)?.parent;

    return NextResponse.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        class: enrollment.academicClass.name,
        tier: enrollment.academicClass.tier?.name,
        branchId: student.branchId,
      },
      termId,
      registration: registration
        ? {
            id: registration.id,
            status: registration.status,
            confirmedAt: registration.confirmedAt,
            selectedOptionalIds,
          }
        : null,
      mandatoryComponents,
      optionalComponents,
      selectedOptionalIds,
      totalMandatory: mandatoryComponents.reduce((sum, c) => sum + c.amount, 0),
      totalOptional: selectedOptionalIds
        .map((id) => optionalComponents.find((c) => c.id === id))
        .filter(Boolean)
        .reduce((sum, c) => sum + (c?.amount || 0), 0),
    });
  } catch (error: any) {
    console.error('Error fetching fee registration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SubmitFeeRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { academicYearId, termId, selectedOptionalComponents } = parsed.data;

    const student = await prisma.student.findFirst({
      where: {
        tenantId: user.tenantId,
        OR: [
          { userId: user.id },
          ...(user.role === 'PARENT'
            ? [{ parents: { some: { userId: user.id } } }]
            : []),
        ],
      },
      include: {
        enrollments: {
          where: { academicClass: { academicYearId } },
          include: {
            academicClass: { include: { tier: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.enrollments.length === 0) {
      return NextResponse.json({ error: 'Student not enrolled for this academic year' }, { status: 404 });
    }

    const enrollment = student.enrollments[0];
    const tierId = enrollment.academicClass.tierId;
    const branchId = student.branchId || null;

    const optionalIds = new Set(selectedOptionalComponents);
    const validOptionals = await prisma.feeComponent.findMany({
      where: {
        id: { in: selectedOptionalComponents },
        academicYearId,
        category: 'OPTIONAL',
        OR: [
          { tierId: tierId },
          { tierId: null },
          { branchId: branchId },
          { branchId: null },
        ],
      },
    });

    if (validOptionals.length !== optionalIds.size) {
      return NextResponse.json({ error: 'One or more optional component IDs are invalid' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let registration = await tx.studentFeeRegistration.findUnique({
        where: {
          studentId_academicYearId_termId: {
            studentId: student.id,
            academicYearId,
            termId,
          },
        },
      });

      if (registration) {
        if (registration.status === 'CONFIRMED') {
          throw new Error('Registration already confirmed. Contact admin to make changes.');
        }
        await tx.studentFeeComponentSelection.deleteMany({
          where: { registrationId: registration.id },
        });
        registration = await tx.studentFeeRegistration.update({
          where: { id: registration.id },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
          },
        });
      } else {
        registration = await tx.studentFeeRegistration.create({
          data: {
            studentId: student.id,
            academicYearId,
            termId,
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            tenantId: user.tenantId,
            branchId,
            tierId,
          },
        });
      }

      await tx.studentFeeComponentSelection.createMany({
        data: selectedOptionalComponents.map((componentId) => ({
          registrationId: registration!.id,
          componentId,
          tenantId: user.tenantId,
        })),
      });

      const selections = await tx.studentFeeComponentSelection.findMany({
        where: { registrationId: registration.id },
      });

      const componentIds = selections.map(s => s.componentId);
      const components = componentIds.length
        ? await tx.feeComponent.findMany({ where: { id: { in: componentIds } } })
        : [];
      const componentMap = new Map(components.map(c => [c.id, c]));

      const selectionsWithComponents = selections.map(s => ({
        ...s,
        component: componentMap.get(s.componentId),
      }));

      return { registration, selections: selectionsWithComponents };
    });

    return NextResponse.json({
      message: 'Fee registration submitted successfully',
      registration: {
        id: result.registration.id,
        status: result.registration.status,
        confirmedAt: result.registration.confirmedAt,
        selections: result.selections.map((s: any) => ({
          id: s.id,
          componentId: s.componentId,
          name: s.component?.name,
          amount: s.component?.amount,
          type: s.component?.type,
        })),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting fee registration:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}