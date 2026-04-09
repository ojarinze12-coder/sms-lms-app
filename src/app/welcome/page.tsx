import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Logo } from '@/components/logo';

export default async function Home() {
  // Simple cookie check - don't try to verify token at build time
  const cookieStore = await cookies();
  const hasToken = !!(cookieStore.get('pcc-token') || cookieStore.get('scc-token') || cookieStore.get('auth-token'));
  
  if (hasToken) {
    // Token exists, user is logged in - redirect to appropriate dashboard
    // The client-side will handle the actual redirect based on role
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mb-8">
        <Logo size="xl" variant="dark" />
      </div>
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to EduNext</h1>
        <p className="text-lg text-gray-600">School Management System + LMS</p>
        <div className="flex gap-4 justify-center pt-4">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Login
          </Link>
          <Link 
            href="/register" 
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Register School
          </Link>
        </div>
      </div>
    </div>
  );
}