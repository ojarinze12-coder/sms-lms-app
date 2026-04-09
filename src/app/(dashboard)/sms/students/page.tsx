import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export default async function StudentsPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  const students = await prisma.student.findMany({
    where: { tenantId: authUser.tenantId },
    include: {
      enrollments: {
        include: {
          academicClass: true
        }
      }
    },
    orderBy: { lastName: 'asc' }
  });

  const tiers = await prisma.tier.findMany({
    where: { tenantId: authUser.tenantId },
    select: { id: true, name: true, order: true }
  });
  const tierMap = new Map(tiers.map(t => [t.id, t]));

  const sortedStudents = [...students].sort((a, b) => {
    const enrollA = a.enrollments?.[0];
    const enrollB = b.enrollments?.[0];
    const classA = enrollA?.academicClass;
    const classB = enrollB?.academicClass;
    const tierA = classA ? tierMap.get(classA.tierId) : null;
    const tierB = classB ? tierMap.get(classB.tierId) : null;
    const tierOrderA = tierA?.order ?? 999;
    const tierOrderB = tierB?.order ?? 999;
    if (tierOrderA !== tierOrderB) return tierOrderA - tierOrderB;
    return (classA?.name ?? '').localeCompare(classB?.name ?? '');
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Students</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage student records</p>
        </div>
        <Link
          href="/sms/students/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600"
        >
          Add Student
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Tier/Class</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {!students || students.length === 0 ? (
                <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No students yet. Add your first student to get started.
                </td>
              </tr>
            ) : (
              sortedStudents.map((student) => {
                const enroll = student.enrollments?.[0];
                const classInfo = enroll?.academicClass;
                const tierInfo = classInfo ? tierMap.get(classInfo.tierId) : null;
                return (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm dark:text-white">{student.studentId}</td>
                  <td className="px-6 py-4 text-sm font-medium dark:text-white">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {tierInfo?.name || '-'}
                    {classInfo?.name ? ` / ${classInfo.name}` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link 
                      href={`/sms/students/${student.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
