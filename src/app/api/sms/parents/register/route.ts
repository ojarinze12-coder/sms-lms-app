import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      occupation,
      workplace,
      relationship,
      isPrimaryContact,
      studentId,
      tenantSlug 
    } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    let tenantId = null;
    
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      const defaultTenant = await prisma.tenant.findFirst();
      if (!defaultTenant) {
        return NextResponse.json(
          { error: 'No school found. Please contact administrator.' },
          { status: 400 }
        );
      }
      tenantId = defaultTenant.id;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'PARENT',
        tenantId
      }
    });

    const siblingDiscount = await prisma.siblingDiscount.findFirst({
      where: { tenantId, isActive: true }
    });

    const linkingMode = siblingDiscount?.linkingMode || 'ADMIN_APPROVAL';
    const approvalStatus = linkingMode === 'AUTO_APPROVE' ? 'APPROVED' : 'PENDING';

    const parentRecord = await prisma.parent.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        occupation,
        workplace,
        relationship: relationship || 'GUARDIAN',
        isPrimaryContact: isPrimaryContact || true,
        approvalStatus,
        tenantId,
        userId: user.id
      }
    });

    let linkedStudent = null;
    
    if (studentId) {
      const student = await prisma.student.findFirst({
        where: {
          studentId,
          tenantId
        }
      });

      if (student) {
        const existingLink = await prisma.parentStudent.findUnique({
          where: {
            parent_student_unique: {
              parentId: parentRecord.id,
              studentId: student.id
            }
          }
        });

        if (!existingLink) {
          const studentLink = await prisma.parentStudent.create({
            data: {
              parentId: parentRecord.id,
              studentId: student.id,
              relationship: relationship || 'GUARDIAN',
              isPrimaryContact: isPrimaryContact || true,
              approvalStatus
            }
          });

          linkedStudent = {
            id: student.id,
            studentId: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            status: approvalStatus
          };
        } else {
          linkedStudent = {
            error: 'This student is already linked to another parent'
          };
        }
      } else {
        linkedStudent = {
          error: 'Student not found. You can link after registration.'
        };
      }
    }

    return NextResponse.json({
      message: 'Registration successful',
      parent: {
        id: parentRecord.id,
        firstName: parentRecord.firstName,
        lastName: parentRecord.lastName,
        email: parentRecord.email,
        approvalStatus: parentRecord.approvalStatus
      },
      linkedStudent,
      linkingMode
    }, { status: 201 });

  } catch (error) {
    console.error('Parent registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Parent self-registration endpoint',
    fields: {
      required: ['email', 'password', 'firstName', 'lastName'],
      optional: ['phone', 'occupation', 'workplace', 'relationship', 'isPrimaryContact', 'studentId', 'tenantSlug'],
      relationshipOptions: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
      note: 'Provide studentId to link to existing student record during registration'
    }
  });
}
