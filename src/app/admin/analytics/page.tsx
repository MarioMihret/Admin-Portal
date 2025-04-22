import React from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Download, 
  Filter,
  ChevronDown,
  BarChart2,
  PieChart,
  LineChart
} from 'lucide-react';

// Mock data for analytics
const metrics = [
  { name: 'Total Users', value: '12,345', change: '+12%', icon: Users, color: 'bg-blue-500' },
  { name: 'Active Events', value: '87', change: '+5%', icon: Calendar, color: 'bg-green-500' },
  { name: 'Revenue', value: '$45,678', change: '+18%', icon: DollarSign, color: 'bg-purple-500' },
  { name: 'Conversion Rate', value: '3.2%', change: '+2%', icon: TrendingUp, color: 'bg-yellow-500' },
];

// Mock data for user growth chart
const userGrowthData = [
  { month: 'Jan', users: 8500 },
  { month: 'Feb', users: 9200 },
  { month: 'Mar', users: 9800 },
  { month: 'Apr', users: 10500 },
  { month: 'May', users: 11200 },
  { month: 'Jun', users: 12345 },
];

// Mock data for event types distribution
const eventTypesData = [
  { type: 'Conferences', count: 35, percentage: 40 },
  { type: 'Workshops', count: 25, percentage: 29 },
  { type: 'Seminars', count: 15, percentage: 17 },
  { type: 'Networking', count: 12, percentage: 14 },
];

// Mock data for revenue by month
const revenueData = [
  { month: 'Jan', revenue: 32000 },
  { month: 'Feb', revenue: 35000 },
  { month: 'Mar', revenue: 38000 },
  { month: 'Apr', revenue: 42000 },
  { month: 'May', revenue: 45000 },
  { month: 'Jun', revenue: 45678 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <div className="flex space-x-3">
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2 text-gray-500" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
              <div className={`${metric.color} p-3 rounded-full`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-green-600">{metric.change}</span>
              <span className="text-sm text-gray-500 ml-2">vs. previous period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">User Growth</h2>
            <div className="flex items-center text-sm text-gray-500">
              <LineChart className="w-4 h-4 mr-1" />
              <span>Line Chart</span>
            </div>
          </div>
          <div className="h-64 flex items-end space-x-2">
            {userGrowthData.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(data.users / 13000) * 100}%` }}
                ></div>
                <div className="mt-2 text-xs text-gray-500">{data.month}</div>
                <div className="text-xs font-medium">{data.users.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Types Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Event Types Distribution</h2>
            <div className="flex items-center text-sm text-gray-500">
              <PieChart className="w-4 h-4 mr-1" />
              <span>Pie Chart</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48 relative">
              {/* Simplified pie chart representation */}
              <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
              <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 100%, 50% 100%)' }}></div>
              <div className="absolute inset-0 rounded-full border-8 border-yellow-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 50%, 50% 50%)' }}></div>
              <div className="absolute inset-0 rounded-full border-8 border-purple-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%, 50% 50%)' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {eventTypesData.map((data) => (
              <div key={data.type} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ 
                  backgroundColor: 
                    data.type === 'Conferences' ? '#3B82F6' : 
                    data.type === 'Workshops' ? '#10B981' : 
                    data.type === 'Seminars' ? '#F59E0B' : '#8B5CF6' 
                }}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{data.type}</div>
                  <div className="text-xs text-gray-500">{data.count} events</div>
                </div>
                <div className="text-sm font-medium text-gray-900">{data.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Revenue by Month</h2>
          <div className="flex items-center text-sm text-gray-500">
            <BarChart2 className="w-4 h-4 mr-1" />
            <span>Bar Chart</span>
          </div>
        </div>
        <div className="h-64 flex items-end space-x-2">
          {revenueData.map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-purple-500 rounded-t"
                style={{ height: `${(data.revenue / 50000) * 100}%` }}
              ></div>
              <div className="mt-2 text-xs text-gray-500">{data.month}</div>
              <div className="text-xs font-medium">${data.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Events</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-500">
                  {i}
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">Event Name {i}</div>
                  <div className="text-xs text-gray-500">1,234 attendees</div>
                </div>
                <div className="text-sm font-medium text-gray-900">${(i * 1000).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* User Demographics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">User Demographics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">18-24</span>
                <span className="font-medium">25%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">25-34</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">35-44</span>
                <span className="font-medium">20%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">45+</span>
                <span className="font-medium">10%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'New user registered', time: '5 minutes ago', user: 'John Doe' },
              { action: 'Event created', time: '1 hour ago', user: 'Sarah Johnson' },
              { action: 'Payment received', time: '3 hours ago', user: 'Tech Conference' },
              { action: 'User profile updated', time: '5 hours ago', user: 'Michael Brown' },
              { action: 'New organizer application', time: '1 day ago', user: 'Emily Davis' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                  <div className="text-xs text-gray-500">
                    {activity.user} • {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 