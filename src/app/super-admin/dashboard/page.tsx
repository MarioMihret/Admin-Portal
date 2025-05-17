"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Shield, 
  UserCog,
  Database,
  Lock,
  Settings,
  ClipboardList,
  Server,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  adminUsers: number;
  superAdmins: number;
  totalOrganizers: number;
}

const fetchDashboardData = async (): Promise<DashboardStats> => {
  console.log("Fetching dashboard data...");
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    totalUsers: 1256,
    adminUsers: 12,
    superAdmins: 3,
    totalOrganizers: 78,
  };
};

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardData();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center items-center h-[calc(100vh-150px)]">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Error Loading Dashboard</h2>
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">No dashboard data available.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Total Users</h3>
            <Users className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active users in the system</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Total Organizers</h3>
            <Briefcase className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
          </div>
          <p className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{stats.totalOrganizers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registered organizers</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Admin</h3>
            <Shield className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.adminUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administrators</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Super Admins</h3>
            <UserCog className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          </div>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.superAdmins.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Super administrators</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <Database className="h-5 w-5 text-sky-600 dark:text-sky-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Database Connection</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200">Connected</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <Server className="h-5 w-5 text-sky-600 dark:text-sky-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Authentication Service</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <Server className="h-5 w-5 text-sky-600 dark:text-sky-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">API Services</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200">Operational</span>
            </div>
             <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <ClipboardList className="h-5 w-5 text-sky-600 dark:text-sky-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Storage Service</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-200">Available</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          <ClipboardList className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Recent Activity</h2>
          <p className="text-gray-500 dark:text-gray-400">No recent system activity to display.</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/super-admin/users" className="group bg-indigo-50 dark:bg-gray-700/50 p-5 rounded-xl hover:bg-indigo-100 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center">
            <Users className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-3 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-medium text-indigo-700 dark:text-indigo-300">User Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage all user accounts</p>
          </Link>
          <Link href="/super-admin/admins" className="group bg-purple-50 dark:bg-gray-700/50 p-5 rounded-xl hover:bg-purple-100 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center">
            <Shield className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-3 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-medium text-purple-700 dark:text-purple-300">Admin Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage admin accounts</p>
          </Link>
          <Link href="/super-admin/settings" className="group bg-green-50 dark:bg-gray-700/50 p-5 rounded-xl hover:bg-green-100 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center">
            <Settings className="h-10 w-10 text-green-600 dark:text-green-400 mb-3 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-medium text-green-700 dark:text-green-300">System Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure system parameters</p>
          </Link>
          <Link href="/auth/change-password" className="group bg-blue-50 dark:bg-gray-700/50 p-5 rounded-xl hover:bg-blue-100 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center">
            <Lock className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-3 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-medium text-blue-700 dark:text-blue-300">Change Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your account password</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 