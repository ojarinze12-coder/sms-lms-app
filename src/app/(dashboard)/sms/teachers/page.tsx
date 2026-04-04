import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export default async function TeachersPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  const teachers = await prisma.teacher.findMany({
    where: { tenantId: authUser.tenantId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Teachers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage teacher records</p>
        </div>
        <Link
          href="/sms/teachers/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 dark:bg-primary"
        >
          Add Teacher
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Specialty</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {!teachers || teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No teachers yet. Add your first teacher to get started.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm dark:text-white">{teacher.employeeId}</td>
                  <td className="px-6 py-4 text-sm font-medium dark:text-white">
                    {teacher.firstName} {teacher.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.specialty || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/sms/teachers/${teacher.id}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
