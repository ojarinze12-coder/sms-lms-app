import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser || !authUser.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'BURSAR'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    const where: any = { tenantId: authUser.tenantId };
    
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const discounts = await prisma.siblingDiscount.findMany({
      where,
      include: { academicYear: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ discounts });
  } catch (error) {
    console.error('Get sibling discounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser || !authUser.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'BURSAR'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      academicYearId,
      linkingMode,
      discountType,
      secondChildDiscount,
      thirdChildDiscount,
      fourthChildDiscount,
      fifthChildDiscount,
      isActive
    } = body;

    if (!linkingMode) {
      return NextResponse.json(
        { error: 'Linking mode is required' },
        { status: 400 }
      );
    }

    const existingDiscount = await prisma.siblingDiscount.findFirst({
      where: {
        tenantId: authUser.tenantId,
        academicYearId: academicYearId || null
      }
    });

    if (existingDiscount) {
      const updated = await prisma.siblingDiscount.update({
        where: { id: existingDiscount.id },
        data: {
          linkingMode,
          discountType: discountType || 'PERCENTAGE',
          secondChildDiscount: secondChildDiscount || 0,
          thirdChildDiscount: thirdChildDiscount || 0,
          fourthChildDiscount: fourthChildDiscount || 0,
          fifthChildDiscount: fifthChildDiscount || 0,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      return NextResponse.json({
        message: 'Sibling discount updated',
        discount: updated
      });
    }

    const discount = await prisma.siblingDiscount.create({
      data: {
        tenantId: authUser.tenantId,
        academicYearId: academicYearId || null,
        linkingMode,
        discountType: discountType || 'PERCENTAGE',
        secondChildDiscount: secondChildDiscount || 0,
        thirdChildDiscount: thirdChildDiscount || 0,
        fourthChildDiscount: fourthChildDiscount || 0,
        fifthChildDiscount: fifthChildDiscount || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      message: 'Sibling discount created',
      discount
    }, { status: 201 });

  } catch (error) {
    console.error('Create sibling discount error:', error);
    return NextResponse.json(
      { error: 'Failed to create sibling discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  
  if (!authUser || !authUser.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'BURSAR'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 }
      );
    }

    await prisma.siblingDiscount.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Sibling discount deleted' });
  } catch (error) {
    console.error('Delete sibling discount error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sibling discount' },
      { status: 500 }
    );
  }
}
