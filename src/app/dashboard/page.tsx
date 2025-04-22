import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  // Redirect based on user role
  if (session.user?.role === 'super-admin') {
    redirect('/super-admin/dashboard');
  } else if (session.user?.role === 'admin') {
    redirect('/admin/dashboard');
  } else {
    redirect('/unauthorized');
  }
} 