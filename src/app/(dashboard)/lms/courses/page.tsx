import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';

export default async function CoursesPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  const isTeacher = authUser.role === 'TEACHER';
  
  let courses;
  if (isTeacher) {
    courses = await prisma.course.findMany({
      where: { teacherId: authUser.userId },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    courses = await prisma.course.findMany({
      where: { tenantId: authUser.tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {isTeacher ? 'My Courses' : 'Courses'}
          </h1>
          <p className="text-gray-600">
            {isTeacher ? 'Your assigned courses' : 'Manage all courses'}
          </p>
        </div>
        {!isTeacher && (
          <Link
            href="/lms/courses/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Course
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!courses || courses.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border">
            <p className="text-gray-500 mb-4">
              {isTeacher ? 'No courses assigned to you yet.' : 'No courses yet.'}
            </p>
            {!isTeacher && (
              <Link
                href="/lms/courses/new"
                className="text-blue-600 hover:underline"
              >
                Create your first course
              </Link>
            )}
          </div>
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              href={`/lms/courses/${course.id}`}
              className="bg-white p-6 rounded-xl border hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{course.name}</h3>
                <Badge variant="outline">{course.code}</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {course.creditHours} credit hours
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
