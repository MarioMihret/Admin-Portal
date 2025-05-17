import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/constants/roles';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/auth/signin');
    return;
  }
  
  // Redirect based on user role
  if (session.user?.role === ROLES.SUPER_ADMIN) {
    redirect('/super-admin/dashboard');
  } else if (session.user?.role === ROLES.ADMIN) {
    redirect('/admin/dashboard');
  } else {
    console.warn(`Dashboard redirect: Unexpected user role '${session.user?.role}' for user ${session.user?.email}`);
    redirect('/unauthorized');
  }
} 