import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-server';
import DashboardShell from './dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  return <DashboardShell user={authUser}>{children}</DashboardShell>;
}