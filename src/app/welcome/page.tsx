import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth-server';
import { Logo } from '@/components/logo';

export default async function Home() {
  const user = await getAuthUser();
  
  if (user) {
    if (user.role === 'SUPER_ADMIN') {
      redirect('/admin/analytics');
    } else if (user.role === 'ADMIN') {
      redirect('/');
    } else if (user.role === 'TEACHER') {
      redirect('/');
    } else if (user.role === 'STUDENT') {
      redirect('/');
    } else if (user.role === 'PARENT') {
      redirect('/parent');
    } else {
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mb-8">
        <Logo size="xl" variant="dark" />
      </div>
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">
          Welcome to Edunext
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Multi-tenant School Management System + Learning Management System
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Register School
          </Link>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl px-4">
        <FeatureCard
          title="School Management"
          description="Manage students, teachers, classes, and academic records efficiently."
        />
        <FeatureCard
          title="Learning Management"
          description="Create courses, manage enrollments, and deliver online learning."
        />
        <FeatureCard
          title="Multi-Tenant SaaS"
          description="Each school gets their own subdomain with complete data isolation."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
