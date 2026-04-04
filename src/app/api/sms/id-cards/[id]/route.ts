import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createIDCardData, generateQRCodeDataURL } from '@/lib/id-card';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // student, teacher, staff

    let person;
    let tenant;
    let qrCodeDataURL;

    if (type === 'student') {
      person = await prisma.student.findUnique({
        where: { id },
        include: { tenant: { select: { name: true, logo: true } } },
      });
      
      if (!person) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      if (person.cardStatus !== 'ISSUED') {
        return NextResponse.json({ error: 'ID card not issued' }, { status: 400 });
      }

      tenant = person.tenant;
      const cardData = createIDCardData('STUDENT', person.id, person, tenant, person.cardExpiresAt?.toISOString().split('T')[0]);
      qrCodeDataURL = await generateQRCodeDataURL(cardData);

      return NextResponse.json({
        type: 'STUDENT',
        id: person.id,
        studentId: person.studentId,
        firstName: person.firstName,
        lastName: person.lastName,
        photo: person.photo,
        barcode: person.barcode,
        cardIssuedAt: person.cardIssuedAt,
        cardExpiresAt: person.cardExpiresAt,
        tenantName: tenant.name,
        tenantLogo: tenant.logo,
        qrCodeDataURL,
      });
    } else if (type === 'teacher') {
      person = await prisma.teacher.findUnique({
        where: { id },
        include: { tenant: { select: { name: true, logo: true } } },
      });

      if (!person) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      if (person.cardStatus !== 'ISSUED') {
        return NextResponse.json({ error: 'ID card not issued' }, { status: 400 });
      }

      tenant = person.tenant;
      const cardData = createIDCardData('TEACHER', person.id, person, tenant, person.cardExpiresAt?.toISOString().split('T')[0]);
      qrCodeDataURL = await generateQRCodeDataURL(cardData);

      return NextResponse.json({
        type: 'TEACHER',
        id: person.id,
        employeeId: person.employeeId,
        firstName: person.firstName,
        lastName: person.lastName,
        photo: person.photo,
        barcode: person.barcode,
        cardIssuedAt: person.cardIssuedAt,
        cardExpiresAt: person.cardExpiresAt,
        tenantName: tenant.name,
        tenantLogo: tenant.logo,
        qrCodeDataURL,
      });
    } else if (type === 'staff') {
      person = await prisma.staff.findUnique({
        where: { id },
        include: { tenant: { select: { name: true, logo: true } } },
      });

      if (!person) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
      }

      if (person.cardStatus !== 'ISSUED') {
        return NextResponse.json({ error: 'ID card not issued' }, { status: 400 });
      }

      tenant = person.tenant;
      const cardData = createIDCardData('STAFF', person.id, person, tenant, person.cardExpiresAt?.toISOString().split('T')[0]);
      qrCodeDataURL = await generateQRCodeDataURL(cardData);

      return NextResponse.json({
        type: 'STAFF',
        id: person.id,
        employeeId: person.employeeId,
        firstName: person.firstName,
        lastName: person.lastName,
        category: person.category,
        photo: person.photo,
        barcode: person.barcode,
        cardIssuedAt: person.cardIssuedAt,
        cardExpiresAt: person.cardExpiresAt,
        tenantName: tenant.name,
        tenantLogo: tenant.logo,
        qrCodeDataURL,
      });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('ID Card GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}