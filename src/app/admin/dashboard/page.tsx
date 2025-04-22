"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  MoreVertical,
  LucideIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Import new components
import StatCard from '@/components/admin/dashboard/StatCard';
import ChartCard from '@/components/admin/dashboard/ChartCard';
import ActivityItem from '@/components/admin/dashboard/ActivityItem';
import { cn } from '@/lib/utils'; // Make sure cn is available

// Define interfaces for data structures
interface StatDataItem {
  name: string;
  key: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  link?: string;
  // Add error/loading state per item if needed later
}

interface ActivityLogItem {
  id: number | string;
  userInitial: string;
  userName?: string;
  userLink?: string;
  action: string;
  timestamp: string;
  itemLink?: string;
}

// Sample data - replace with real data from your API
const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const userActivityData = [
  { name: 'Mon', active: 4000, new: 2400 },
  { name: 'Tue', active: 3000, new: 1398 },
  { name: 'Wed', active: 2000, new: 9800 },
  { name: 'Thu', active: 2780, new: 3908 },
  { name: 'Fri', active: 1890, new: 4800 },
  { name: 'Sat', active: 2390, new: 3800 },
  { name: 'Sun', active: 3490, new: 4300 },
];

const userDistributionData = [
  { name: 'Active', value: 400 },
  { name: 'Inactive', value: 300 },
  { name: 'New', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// Updated Stats definition with links and better icons
const initialStats: StatDataItem[] = [
  {
    name: 'Total Users',
    key: 'totalUsers',
    value: '12,345', // Will be overwritten by loading state
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'blue',
    link: '/admin/users'
  },
  {
    name: 'Revenue',
    key: 'revenue',
    value: '$34,567',
    change: '+8.2%',
    trend: 'up',
    icon: DollarSign,
    color: 'green',
    link: '/admin/reports'
  },
  {
    name: 'Growth',
    key: 'growth',
    value: '23.1%',
    change: '-2.4%',
    trend: 'down',
    icon: TrendingUp,
    color: 'yellow',
    link: '/admin/analytics'
  },
  {
    name: 'Active Sessions',
    key: 'activeSessions',
    value: '1,234',
    change: '+18.3%',
    trend: 'up',
    icon: Activity,
    color: 'purple',
  }
];

// Sample recent activity data (replace with API call)
const sampleActivity: ActivityLogItem[] = [
  { id: 1, userInitial: 'J', userName: 'Jane Doe', action: 'updated their profile', timestamp: '1 hour ago', userLink: '/admin/users/1', itemLink: '/admin/users/1/edit' },
  { id: 2, userInitial: 'S', userName: 'System', action: 'generated a monthly report', timestamp: '3 hours ago', itemLink: '/admin/reports/monthly-2024-04' },
  { id: 3, userInitial: 'A', userName: 'Admin User', action: 'approved an application', timestamp: '5 hours ago', itemLink: '/admin/applications/123' },
  { id: 4, userInitial: 'B', userName: 'Bob Smith', action: 'created a new event', timestamp: '1 day ago', userLink: '/admin/users/2', itemLink: '/admin/events/456' },
  { id: 5, userInitial: 'C', userName: 'Charlie', action: 'logged in', timestamp: '2 days ago', userLink: '/admin/users/3' },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  // State for loading, errors, and data
  const [statsData, setStatsData] = useState<StatDataItem[]>(initialStats.map(s => ({ ...s, value: '', change: undefined, trend: undefined })));
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const [activityChartData, setActivityChartData] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  
  const [distributionChartData, setDistributionChartData] = useState<any[]>([]);
  const [distributionLoading, setDistributionLoading] = useState(true);
  const [distributionError, setDistributionError] = useState<string | null>(null);

  const [recentActivity, setRecentActivity] = useState<ActivityLogItem[]>([]);
  const [activityFeedLoading, setActivityFeedLoading] = useState(true);
  const [activityFeedError, setActivityFeedError] = useState<string | null>(null);

  // Simulate data fetching on mount
  useEffect(() => {
    const fetchData = async () => {
      // Simulate Stats fetch
      setStatsLoading(true);
      setStatsError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        // --- Replace with actual API call for stats ---
        setStatsData(initialStats); 
        // Example of partial error:
        // setStatsData(initialStats.map(s => s.key === 'growth' ? { ...s, error: 'Failed to load growth data' } : s));
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStatsError("Could not load dashboard statistics.");
      } finally {
        setStatsLoading(false);
      }

      // Simulate Revenue Chart fetch
      setRevenueLoading(true);
      setRevenueError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 1200)); 
        // --- Replace with actual API call ---
        setRevenueChartData(revenueData);
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
        setRevenueError("Network error fetching revenue.");
      } finally {
        setRevenueLoading(false);
      }

      // Simulate Activity Chart fetch
      setActivityLoading(true);
      setActivityError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        // --- Replace with actual API call ---
        setActivityChartData(userActivityData);
        // Simulate error for one chart: throw new Error("API timeout"); 
      } catch (error: any) {
        console.error("Failed to fetch user activity data:", error);
        setActivityError(error.message || "Failed to retrieve user activity.");
      } finally {
        setActivityLoading(false);
      }
      
      // Simulate Distribution Chart fetch
      setDistributionLoading(true);
      setDistributionError(null);
       try {
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        // --- Replace with actual API call ---
        setDistributionChartData(userDistributionData);
      } catch (error) {
        console.error("Failed to fetch user distribution data:", error);
        setDistributionError("Unable to get user distribution.");
      } finally {
        setDistributionLoading(false);
      }

      // Simulate Activity Feed fetch
      setActivityFeedLoading(true);
      setActivityFeedError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 1800)); 
        // --- Replace with actual API call ---
        setRecentActivity(sampleActivity);
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        setActivityFeedError("Could not load recent activity feed.");
      } finally {
        setActivityFeedLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {session?.user?.name || 'Admin'}
        </p>
      </div>

      {/* Stats */}
      {statsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {statsError}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <StatCard 
            key={stat.key}
            name={stat.name}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
            link={stat.link}
            isLoading={statsLoading}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <ChartCard title="Revenue" isLoading={revenueLoading} error={revenueError || undefined}>
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} 
                itemStyle={{ color: '#4F46E5' }}
              />
              <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
        </ChartCard>

        {/* User Activity Chart */}
        <ChartCard title="User Activity" isLoading={activityLoading} error={activityError || undefined}>
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} 
                cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
              />
              <Bar dataKey="active" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="new" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </ChartCard>

        {/* User Distribution Chart */}
        <ChartCard title="User Distribution" isLoading={distributionLoading} error={distributionError || undefined}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                data={distributionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                {distributionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} 
              />
              </PieChart>
            </ResponsiveContainer>
        </ChartCard>

        {/* Recent Activity */}
        <ChartCard title="Recent Activity" isLoading={activityFeedLoading} error={activityFeedError || undefined}>
          {recentActivity.length > 0 ? (
            <div className="space-y-4 overflow-y-auto h-full pr-2">
              {recentActivity.map((item) => (
                <ActivityItem 
                  key={item.id}
                  userInitial={item.userInitial}
                  userName={item.userName}
                  userLink={item.userLink}
                  action={item.action}
                  timestamp={item.timestamp}
                  itemLink={item.itemLink}
                />
            ))}
          </div>
          ) : (
             <div className="flex items-center justify-center h-full text-gray-500">
               No recent activity found.
        </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
} 