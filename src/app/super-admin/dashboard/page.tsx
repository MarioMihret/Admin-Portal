import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SuperAdminDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  if (session.user?.role !== 'super-admin') {
    redirect('/unauthorized');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active users in the system</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Admin Users</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administrators</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Super Admins</h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Super administrators</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">System Status</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">Active</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All systems operational</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Database Connection</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Authentication Service</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">API Services</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Storage</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Available</span>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-gray-400">No recent activity to display.</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Super Admin Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/super-admin/users" className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg text-center hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors">
            <h3 className="font-medium text-indigo-700 dark:text-indigo-300">User Management</h3>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">Manage all user accounts</p>
          </a>
          <a href="/super-admin/admins" className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg text-center hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors">
            <h3 className="font-medium text-purple-700 dark:text-purple-300">Admin Management</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Manage admin accounts</p>
          </a>
          <a href="/super-admin/settings" className="bg-green-50 dark:bg-green-900 p-4 rounded-lg text-center hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
            <h3 className="font-medium text-green-700 dark:text-green-300">System Settings</h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">Configure system parameters</p>
          </a>
          <a href="/change-password" className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
            <h3 className="font-medium text-blue-700 dark:text-blue-300">Change Password</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Update your account password</p>
          </a>
        </div>
      </div>
    </div>
  );
} 