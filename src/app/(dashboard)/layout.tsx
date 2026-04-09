'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { Logo, LogoIcon } from '@/components/logo';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import AIChatWidget from '@/components/AIChatWidget';
import { useTenantTheme } from '@/components/use-tenant-theme';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useBrand } from '@/components/brand-theme-provider';

const superAdminNavItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Schools', href: '/admin/tenants' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: 'Billing', href: '/admin/billing', icon: '💳' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'Data Management', href: '/admin/data', icon: '🗑️' },
];

const adminNavItems = [
  { label: 'Dashboard', href: '/' },
];

const schoolPortalNavItems = [
  { label: 'Dashboard', href: '/school/dashboard', icon: '📊' },
  { label: 'School Setup', href: '/sms/setup', icon: '🛠️' },
  { label: 'Tiers', href: '/sms/tiers', icon: '🏗️' },
  { label: 'Departments', href: '/sms/departments', icon: '📂' },
  { label: 'Academics', href: '/school/academics', icon: '📚' },
  { label: 'People', href: '/school/people/students', icon: '👥' },
  { label: 'Attendance', href: '/school/attendance', icon: '✅' },
  { label: 'Finance', href: '/school/finance', icon: '💰' },
  { label: 'Billing', href: '/school/billing', icon: '💳' },
  { label: 'Timetable', href: '/school/timetable', icon: '📅' },
  { label: 'Grading Scales', href: '/school/exams', icon: '📝' },
  { label: 'Reports', href: '/school/reports', icon: '📈' },
  { label: 'Settings', href: '/school/settings', icon: '⚙️' },
  { label: 'Bulk Import', href: '/sms/import', icon: '📤' },
  { label: 'Data Management', href: '/sms/data', icon: '🗑️' },
];

const smsNavItems = [
  { label: 'School Setup', href: '/sms/setup', icon: '🛠️' },
  { label: 'Tiers', href: '/sms/tiers', icon: '🏗️' },
  { label: 'Departments', href: '/sms/departments', icon: '📂' },
  { label: 'Terms', href: '/sms/terms', icon: '📅' },
  { label: 'Classes', href: '/sms/classes', icon: '🏫' },
  { label: 'Subjects', href: '/sms/subjects', icon: '📖' },
  { label: 'Students', href: '/sms/students', icon: '👨‍🎓' },
  { label: 'Teachers', href: '/sms/teachers', icon: '👨‍🏫' },
  { label: 'Staff', href: '/sms/staff', icon: '👥' },
  { label: 'Attendance', href: '/sms/attendance', icon: '✅' },
  { label: 'Fees', href: '/sms/fees', icon: '💰' },
  { label: 'Announcements', href: '/sms/announcements', icon: '📢' },
  { label: 'Report Cards', href: '/sms/report-cards', icon: '📊' },
  { label: 'Academic Records', href: '/sms/academic-records', icon: '📋' },
  { label: 'Admissions', href: '/sms/applications', icon: '📝' },
  { label: 'Admission Settings', href: '/sms/applications/settings', icon: '⚙️' },
  { label: 'Hostel', href: '/sms/hostel', icon: '🏨' },
  { label: 'Documents', href: '/sms/documents', icon: '📄' },
  { label: 'Audit Log', href: '/sms/audit', icon: '📋' },
  { label: 'HR & Payroll', href: '/sms/payroll', icon: '💼' },
  { label: 'Leave Mgmt', href: '/sms/leaves', icon: '🏖️' },
  { label: 'Library', href: '/sms/library', icon: '📕' },
  { label: 'Transport', href: '/sms/transport', icon: '🚌' },
  { label: 'ID Cards', href: '/sms/id-cards', icon: '🪪' },
  { label: 'Analytics', href: '/analytics', icon: '📈' },
  { label: 'Bulk Import', href: '/sms/import', icon: '📤' },
  { label: 'Data Management', href: '/sms/data', icon: '🗑️' },
];

const lmsNavItems = [
  { label: 'All Courses', href: '/lms/courses', icon: '📚' },
  { label: 'Enrollments', href: '/lms/enrollments', icon: '👥' },
  { label: 'Exams', href: '/lms/exams', icon: '📝' },
  { label: 'Results', href: '/lms/results', icon: '📊' },
  { label: 'Badges', href: '/lms/badges', icon: '🏅' },
  { label: 'Certificates', href: '/lms/certificates', icon: '🎓' },
  { label: 'Forums', href: '/lms/forums', icon: '💬' },
];

const teacherNavItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'My Courses', href: '/lms/courses' },
  { label: 'Exams', href: '/lms/exams' },
  { label: 'Results', href: '/lms/results' },
];

const studentNavItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Available Exams', href: '/lms/exams' },
  { label: 'My Results', href: '/lms/results' },
];

const parentNavItems = [
  { label: 'Dashboard', href: '/' },
  { label: "Children's Results", href: '/parent' },
];

function DropdownMenu({ 
  label, 
  items, 
  isActive, 
  onMouseEnter, 
  onMouseLeave,
  brandColor 
}: { 
  label: string; 
  items: { label: string; href: string; icon?: string }[]; 
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  brandColor?: string;
}) {
  const { primaryColor } = useBrand();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
    onMouseEnter();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      onMouseLeave();
    }, 200);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    onMouseLeave();
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1",
          isActive
            ? "text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        style={isActive ? { backgroundColor: `hsl(var(--brand-primary))` } : {}}
      >
        {label}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 py-1 z-50 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<{ name: string; brandColor: string; logo?: string | null } | null>(null);
  const { loading: themeLoading } = useTenantTheme();
  const { theme, setTheme } = useTheme();
  const { branding, primaryColor } = useBrand();

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';
  const isParent = role === 'PARENT';

  useEffect(() => {
    async function fetchTenantInfo() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user?.tenant) {
          setTenantInfo(data.user.tenant);
        }
      } catch (err) {
        console.error('Failed to fetch tenant info:', err);
      }
    }
    if (!isSuperAdmin) {
      fetchTenantInfo();
    }
  }, [isSuperAdmin]);

  let navItems = adminNavItems;
  if (isSuperAdmin) navItems = superAdminNavItems;
  else if (isTeacher) navItems = teacherNavItems;
  else if (isStudent) navItems = studentNavItems;
  else if (isParent) navItems = parentNavItems;

  const brandColor = primaryColor || tenantInfo?.brandColor || '#1a56db';
  const schoolName = tenantInfo?.name || branding?.name || 'School';
  const schoolLogo = tenantInfo?.logo || branding?.logo;

  const isSchoolPortalActive = pathname.startsWith('/school');
  const isSmsActive = pathname.startsWith('/sms');
  const isLmsActive = pathname.startsWith('/lms');

  if (loading || themeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {isSuperAdmin ? (
                <>
                  <Logo size="lg" variant="dark" />
                  <span className="text-xl font-bold text-gray-800">Platform Control</span>
                </>
              ) : (
                <>
                  {schoolLogo ? (
                    <img 
                      src={schoolLogo} 
                      alt={schoolName}
                      className="w-10 h-10 rounded-lg object-cover bg-white border"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      {schoolName.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">{schoolName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">School Dashboard</span>
                  </div>
                </>
              )}
              
              <nav className="hidden md:flex gap-1 ml-4 items-center">
                {/* LMS Menu - For Admin */}
                {isAdmin && (
                  <DropdownMenu 
                    label="LMS" 
                    items={lmsNavItems}
                    isActive={isLmsActive}
                    onMouseEnter={() => setActiveMenu('lms')}
                    onMouseLeave={() => setActiveMenu(null)}
                    brandColor={brandColor}
                  />
                )}

                {/* School Admin Portal - New organized structure */}
                {isAdmin && (
                  <DropdownMenu 
                    label="School" 
                    items={schoolPortalNavItems}
                    isActive={isSchoolPortalActive}
                    onMouseEnter={() => setActiveMenu('school')}
                    onMouseLeave={() => setActiveMenu(null)}
                    brandColor={brandColor}
                  />
                )}

                {/* SMS Menu - Academic Management */}
                {isAdmin && (
                  <DropdownMenu 
                    label="SMS" 
                    items={smsNavItems}
                    isActive={isSmsActive}
                    onMouseEnter={() => setActiveMenu('sms')}
                    onMouseLeave={() => setActiveMenu(null)}
                    brandColor={brandColor}
                  />
                )}

                {/* Admin Tools */}
                {isAdmin && (
                  <Link
                    href="/analytics"
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname.startsWith('/analytics')
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                    style={pathname.startsWith('/analytics') ? { backgroundColor: `hsl(var(--brand-primary))` } : {}}
                  >
                    Analytics
                  </Link>
                )}

                {/* Regular Nav Items */}
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                    style={pathname === item.href || pathname.startsWith(item.href + '/') ? { backgroundColor: `hsl(var(--brand-primary))` } : {}}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={`Current: ${theme || 'system'}. Click to toggle.`}
              >
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : theme === 'light' ? (
                  <Sun className="h-5 w-5 text-gray-600" />
                ) : (
                  <Monitor className="h-5 w-5 text-gray-600" />
                )}
              </button>
              {!isSuperAdmin && (
                <Logo size="sm" variant="dark" className="opacity-50" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
                {user.email}
              </span>
              <Link
                href="/api/auth/logout"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
        {role === 'ADMIN' && <AIChatWidget userRole="ADMIN" />}
        {role === 'TEACHER' && <AIChatWidget userRole="TEACHER" />}
        {role === 'STUDENT' && <AIChatWidget userRole="STUDENT" />}
        {role === 'PARENT' && <AIChatWidget userRole="PARENT" />}
      </main>
      <Toaster />
    </div>
  );
}
