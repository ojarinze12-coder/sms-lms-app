import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

const DEFAULT_STUDENT_PASSWORD = 'school123';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = { tenantId: authUser.tenantId };
    
    if (branchId) {
      where.branchId = branchId;
    }
    if (classId) {
      where.classId = classId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (status) {
      where.status = status;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            branchId: true,
          },
        },
        academicClass: {
          select: {
            id: true,
            name: true,
            level: true,
            stream: true,
            branchId: true,
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ enrollments });
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, classId } = body;

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student and class are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.enrollment.findFirst({
      where: {
        tenantId: authUser.tenantId,
        studentId,
        classId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this class' },
        { status: 400 }
      );
    }

    const [student, academicClass] = await Promise.all([
      prisma.student.findUnique({ 
        where: { id: studentId },
        include: { branch: { select: { name: true } } }
      }),
      prisma.academicClass.findUnique({ 
        where: { id: classId },
        include: { 
          academicYear: { select: { name: true } },
          tier: { select: { name: true } }
        }
      }),
    ]);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const branchId = student.branchId || academicClass?.branchId || null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sms-lms-app.vercel.app';

    // Check if student already has a user account
    let userCreated = false;
    let credentials = null;
    
    if (!student.userId) {
      // Generate credentials
      const username = student.studentId;
      const password = DEFAULT_STUDENT_PASSWORD;
      const hashedPassword = hashPassword(password);
      
      // Determine email for account
      const userEmail = student.email || `${student.studentId}@student.local`;
      
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (!existingUser) {
        // Create user account
        const newUser = await prisma.user.create({
          data: {
            email: userEmail,
            password: hashedPassword,
            firstName: student.firstName,
            lastName: student.lastName,
            role: 'STUDENT',
            tenantId: authUser.tenantId,
            branchId: branchId,
          }
        });

        // Link user to student
        await prisma.student.update({
          where: { id: studentId },
          data: { userId: newUser.id }
        });

        userCreated = true;
        credentials = {
          username: username,
          password: password,
          email: userEmail,
          userId: newUser.id
        };

        // Send email with credentials
        if (student.email) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to the Student Portal!</h2>
              <p>Dear ${student.firstName} ${student.lastName},</p>
              <p>Your student account has been created. You can now access the student portal using the following credentials:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Student ID:</strong></td>
                    <td style="padding: 8px 0; font-weight: bold;">${student.studentId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Username:</strong></td>
                    <td style="padding: 8px 0;">${username}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Password:</strong></td>
                    <td style="padding: 8px 0;">${password}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Class:</strong></td>
                    <td style="padding: 8px 0;">${academicClass?.name || 'To be assigned'}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin-top: 20px;">
                <a href="${appUrl}/login" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                  Login to Student Portal
                </a>
              </p>
              
              <p style="color: #dc2626; margin-top: 20px;"><strong>Important:</strong> Please change your password after your first login.</p>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                If you have any questions, please contact your school administrator.
              </p>
            </div>
          `;

          try {
            await sendEmail({
              to: student.email,
              subject: `Welcome to Student Portal - Your Login Credentials`,
              html: emailHtml,
            });
            console.log(`[Enrollment] Credentials email sent to ${student.email}`);
          } catch (emailError) {
            console.error('[Enrollment] Failed to send email:', emailError);
            // Don't fail the enrollment if email fails
          }
        }
      }
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId,
        tenantId: authUser.tenantId,
        branchId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        academicClass: {
          select: {
            id: true,
            name: true,
            level: true,
            stream: true,
            academicYear: { select: { name: true } },
            tier: { select: { name: true } },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Return enrollment along with credentials info if user was created
    return NextResponse.json({ 
      enrollment,
      credentialsCreated: userCreated,
      credentials: credentials,
      message: userCreated 
        ? `Enrollment successful. Student account created and credentials ${student.email ? 'emailed' : 'can be copied below'}.`
        : 'Enrollment successful.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
