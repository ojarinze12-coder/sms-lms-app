'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Eye, EyeOff, Loader2, GraduationCap, User, Users } from 'lucide-react';

type LoginType = 'admin' | 'student';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`/api/auth/me?_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const role = data.user?.role;
        if (role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else if (role === 'ADMIN' || role === 'TEACHER') {
          router.push('/');
        } else if (role === 'STUDENT') {
          router.push('/student');
        } else if (role === 'PARENT') {
          router.push('/parent');
        } else {
          router.push('/');
        }
        return;
      }
    } catch {
      // Not logged in, stay on login page
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const body = loginType === 'student'
        ? { studentId: email, password, loginType: 'student' }
        : { email, password };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setSubmitting(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const role = data.user?.role;
      if (role === 'SUPER_ADMIN') {
        window.location.href = '/admin';
      } else if (role === 'ADMIN' || role === 'TEACHER') {
        window.location.href = '/';
      } else if (role === 'STUDENT') {
        window.location.href = '/student';
      } else if (role === 'PARENT') {
        window.location.href = '/parent';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <Logo size="xl" showText={true} className="text-white" />
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Welcome to EduNext
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Your complete school management solution. Manage students, teachers, exams, and more — all in one place.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-blue-100 text-sm">Schools Trust Us</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-blue-100 text-sm">Active Users</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          © 2024 EduNext. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center">
            <Logo size="lg" showText={true} />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">
              {getGreeting()}
            </h2>
            <p className="text-gray-600 mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Type Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => { setLoginType('admin'); setError(''); setEmail(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                loginType === 'admin'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users className="h-4 w-4" />
              Admin / Staff
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('student'); setError(''); setEmail(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                loginType === 'student'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {loginType === 'student' ? 'Student ID' : 'Email Address'}
              </label>
              <input
                type={loginType === 'student' ? 'text' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:bg-gray-700 dark:text-white"
                placeholder={loginType === 'student' ? 'e.g., STU/2024/001' : 'you@school.edu'}
                required
              />
              {loginType === 'student' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter your student ID as provided by the school
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                {loginType === 'admin' && (
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 pr-12 dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {loginType === 'admin' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Remember me for 30 days
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or</span>
            </div>
          </div>

          {loginType === 'admin' && (
            <>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline dark:text-blue-400">
                  Register your school
                </Link>
              </p>
              
              <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                Are you a parent?{' '}
                <Link href="/register/parent" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline dark:text-blue-400">
                  Register as Parent
                </Link>
              </p>
            </>
          )}

          {loginType === 'student' && (
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              Need help logging in? Contact your school administrator.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}