"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, RefreshCw, UserCog, KeyRound, Eye, Shield, ListChecks, UserX, ArrowRight, History, Users, ShieldAlert, GanttChartSquare } from 'lucide-react';

interface LockedAccountInfo {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lockedAt: string;
  reason: string;
  failedAttempts: number;
}

interface SecurityOverviewData {
  lockedAccounts: LockedAccountInfo[];
  suspiciousAttemptsToday: number;
  newAlerts: number;
}

interface SecurityFeatureCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  actionText: string;
  color?: string; // Optional: for specific card accent color e.g. 'border-red-500' or 'bg-red-100'
}

const SecurityFeatureCard: React.FC<SecurityFeatureCardProps> = ({ href, icon: Icon, title, description, actionText, color }) => {
  return (
    <div className={`group bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-xl p-6 transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transform hover:-translate-y-1 ${color}`}>
      <div className="flex items-center mb-4">
        <Icon className={`h-10 w-10 ${color ? color.replace('border-', 'text-').replace('bg-', 'text-') : 'text-purple-600 dark:text-purple-400'} mr-4 flex-shrink-0`} />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {title}
        </h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 min-h-[40px]">
        {description}
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 dark:focus:ring-offset-gray-800 transition-colors duration-150 shadow-md hover:shadow-lg group-hover:scale-105 transform"
      >
        {actionText}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const fetchSecurityOverview = async (): Promise<SecurityOverviewData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800)); 
  // Return mock data similar to what an API might provide
  return {
    lockedAccounts: [
      { id: 'lock1', userId: 'usr_123', userName: 'John Doe', userEmail: 'john.doe@example.com', lockedAt: new Date(Date.now() - 3600000 * 2).toISOString(), reason: 'Too many failed login attempts (5)', failedAttempts: 5 },
      { id: 'lock2', userId: 'usr_456', userName: 'Jane Smith', userEmail: 'jane.smith@example.com', lockedAt: new Date(Date.now() - 3600000 * 5).toISOString(), reason: 'Manual lock by admin due to suspicious activity.', failedAttempts: 0 },
    ],
    suspiciousAttemptsToday: 3,
    newAlerts: 1,
  };
};

export default function SecurityPage() {
  const [overviewData, setOverviewData] = useState<SecurityOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSecurityOverview();
      setOverviewData(data);
    } catch (error) {
      console.error("Failed to fetch security overview:", error);
      // Handle error display appropriately, e.g., using a toast notification
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  if (isLoading || !overviewData) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  const { lockedAccounts, suspiciousAttemptsToday, newAlerts } = overviewData;

  const features: SecurityFeatureCardProps[] = [
    {
      href: '/super-admin/security/audit-logs',
      icon: GanttChartSquare, 
      title: 'Audit Logs',
      description: 'View detailed logs of actions performed by users, organizers, and admins across the platform.',
      actionText: 'View Audit Logs',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      href: '/super-admin/security/auth-monitoring',
      icon: KeyRound, 
      title: 'Authentication Monitoring',
      description: 'Track login attempts, user sessions, IP addresses, and identify suspicious activity.',
      actionText: 'Monitor Logins',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      href: '/super-admin/security/account-management',
      icon: UserX, 
      title: 'Account Locking & Bans',
      description: 'Manage user account status, including temporary or permanent bans with reason logging.',
      actionText: 'Manage Accounts',
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <ShieldCheck className="h-8 w-8 mr-3 text-purple-600 dark:text-purple-400" />
            Security Overview
          </h1>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Monitor account lockouts, suspicious activities, and security alerts.
          </p>
        </div>
        <button onClick={loadSecurityData} title="Refresh security data" className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-l-4 border-red-500 dark:border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Locked Accounts</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{lockedAccounts.length}</p>
            </div>
            <KeyRound className="h-8 w-8 text-red-400 dark:text-red-300 opacity-70" />
          </div>
           {lockedAccounts.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Review and manage locked user accounts.</p>}
        </div>
        <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-l-4 border-yellow-500 dark:border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Suspicious Attempts (24h)</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{suspiciousAttemptsToday}</p>
            </div>
            <Eye className="h-8 w-8 text-yellow-400 dark:text-yellow-300 opacity-70" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Monitor for unusual login patterns.</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-l-4 border-blue-500 dark:border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">New Security Alerts</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{newAlerts}</p>
            </div>
             <AlertTriangle className="h-8 w-8 text-blue-400 dark:text-blue-300 opacity-70" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Actionable security notifications.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-x-auto">
        <h2 className="px-5 py-4 text-lg font-semibold text-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-700">
          Recently Locked Accounts
        </h2>
        {lockedAccounts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/80">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Locked At</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Attempts</th>
                <th scope="col" className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {lockedAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-red-50/50 dark:hover:bg-red-700/20 transition-colors duration-150">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{account.userName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{account.userEmail}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(account.lockedAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 max-w-xs truncate" title={account.reason}>{account.reason}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{account.failedAttempts}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <Link href={`/super-admin/users/edit/${account.userId}`} className="p-1.5 rounded-full text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-700/30 transition-colors" title="View User & Unlock">
                      <UserCog className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
            No accounts are currently locked.
          </p>
        )}
      </div>

      <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
        <header className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center">
            <Shield className="h-7 w-7 mr-3 text-purple-600 dark:text-purple-400" />
            Security Tools & Modules
          </h2>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Access specialized tools for in-depth security monitoring and management.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature) => (
            <SecurityFeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>

    </div>
  );
} 