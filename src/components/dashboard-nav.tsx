'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'SMS', href: '/sms/students' },
  { label: 'LMS', href: '/lms/courses' },
  { label: 'Exams', href: '/lms/exams' },
  { label: 'Results', href: '/lms/results' },
];

const teacherNavItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'My Courses', href: '/lms/courses' },
  { label: 'Exams', href: '/lms/exams' },
  { label: 'Results', href: '/lms/results' },
];

const studentNavItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'My Portal', href: '/student' },
  { label: 'Available Exams', href: '/lms/exams' },
  { label: 'My Results', href: '/lms/results' },
];

const parentNavItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'My Children', href: '/parent' },
  { label: 'Fees', href: '/parent?view=fees' },
];

export function DashboardNav() {
  const { role, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <nav className="hidden md:flex gap-1">
        <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
      </nav>
    );
  }

  const navItems = role === 'STUDENT' 
    ? studentNavItems 
    : role === 'TEACHER' 
    ? teacherNavItems
    : role === 'PARENT'
    ? parentNavItems
    : adminNavItems;

  return (
    <nav className="hidden md:flex gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
