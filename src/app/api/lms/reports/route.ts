import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));

    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeStudents,
      totalExams,
      completedExams,
      results,
      courses,
      students
    ] = await Promise.all([
      prisma.course.count({ where: { tenantId: authUser.tenantId } }),
      prisma.course.count({ where: { tenantId: authUser.tenantId, isPublished: true } }),
      prisma.enrollment.count({ where: { tenantId: authUser.tenantId } }),
      prisma.enrollment.count({ where: { tenantId: authUser.tenantId, status: 'ACTIVE' } }),
      prisma.exam.count({ 
        where: { 
          subject: { 
            academicClass: { 
              academicYear: { tenantId: authUser.tenantId } 
            } 
          } 
        } 
      }),
      prisma.result.count({ where: { tenantId: authUser.tenantId, status: 'SUBMITTED' } }),
      prisma.result.findMany({ 
        where: { tenantId: authUser.tenantId },
        select: { score: true }
      }),
      prisma.course.findMany({
        where: { tenantId: authUser.tenantId },
        include: {
          enrollments: true
        }
      }),
      prisma.enrollment.findMany({
        where: { tenantId: authUser.tenantId },
        include: {
          student: true,
          course: true
        }
      })
    ]);

    const averageScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
      : 0;

    const completedEnrollments = await prisma.enrollment.count({
      where: { tenantId: authUser.tenantId, status: 'COMPLETED' }
    });
    
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedEnrollments / totalEnrollments) * 100) 
      : 0;

    const topCourses = courses
      .map(c => ({
        id: c.id,
        name: c.name,
        enrollments: c.enrollments.length,
        completionRate: 0
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    const studentScores: Record<string, { name: string; email: string; totalScore: number; count: number; courses: Set<string> }> = {};
    
    for (const enrollment of students) {
      if (!studentScores[enrollment.studentId]) {
        studentScores[enrollment.studentId] = {
          name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          email: enrollment.student.email || '',
          totalScore: 0,
          count: 0,
          courses: new Set()
        };
      }
      if (enrollment.finalGrade !== null) {
        studentScores[enrollment.studentId].totalScore += enrollment.finalGrade;
        studentScores[enrollment.studentId].count += 1;
      }
      studentScores[enrollment.studentId].courses.add(enrollment.courseId);
    }

    const topStudents = Object.entries(studentScores)
      .map(([id, data]) => ({
        id,
        name: data.name,
        email: data.email,
        avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
        coursesCompleted: data.courses.size
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        totalCourses,
        publishedCourses,
        totalEnrollments,
        activeStudents,
        totalExams,
        completedExams,
        averageScore,
        completionRate
      },
      topCourses,
      topStudents
    });
  } catch (error) {
    console.error('Failed to fetch LMS reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
