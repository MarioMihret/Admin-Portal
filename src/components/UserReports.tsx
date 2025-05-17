"use client";

import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  BarChart2, 
  UserPlus, 
  Activity,
  Download, 
  RefreshCw,
  Printer,
  Globe,
  User,
  Clock
} from 'lucide-react';

// Types for user reports
interface UserReportData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_users: number;
    new_users: number;
    active_users: number;
    avg_session_duration: number;
  };
  trends: {
    registration: {
      date: string;
      new_users: number;
      total_users: number;
    }[];
    activity: {
      date: string;
      active_users: number;
      sessions: number;
      avg_session_duration: number;
    }[];
  };
  demographics: {
    gender: {
      category: string;
      count: number;
    }[];
    age: {
      category: string;
      count: number;
    }[];
    location: {
      category: string;
      count: number;
    }[];
  };
  retention: {
    "1day": number;
    "7days": number;
    "30days": number;
    "90days": number;
  };
  generatedAt: string;
}

export default function UserReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<UserReportData | null>(null);
  const [period, setPeriod] = useState<string>("30days");

  // Fetch report data
  const fetchReportData = async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports/users?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch user reports:", error);
      setError("Could not load user report data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle period change
  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);
    fetchReportData(newPeriod);
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchReportData();
  }, []);
  
  // Handle export action
  const handleExport = (exportType = 'csv-all') => {
    if (!reportData) return;
    
    try {
      if (exportType === 'csv-all' || exportType === 'csv-summary') {
        // Create complete report with all data
        const reportDate = new Date().toLocaleDateString();
        const summarySection = [
          ["User Report Summary", `Generated on: ${reportDate}`],
          ["Period", period],
          ["Date Range", `${formatDate(reportData.period.start)} to ${formatDate(reportData.period.end)}`],
          [],
          ["Total Users", reportData.summary.total_users.toString()],
          ["New Users", reportData.summary.new_users.toString()],
          ["Active Users", reportData.summary.active_users.toString()],
          ["Average Session Duration", `${reportData.summary.avg_session_duration} minutes`],
          [],
          ["User Retention Rates"],
          ["1 Day", `${formatPercentage(reportData.retention["1day"] * 100)}`],
          ["7 Days", `${formatPercentage(reportData.retention["7days"] * 100)}`],
          ["30 Days", `${formatPercentage(reportData.retention["30days"] * 100)}`],
          ["90 Days", `${formatPercentage(reportData.retention["90days"] * 100)}`],
        ];
        
        let csvRows = [...summarySection];
        
        if (exportType === 'csv-all') {
          // Registration trends
          const registrationSection = [
            [],
            ["Registration Trends"],
            ["Date", "New Users", "Total Users"],
            ...reportData.trends.registration.map(day => [
              day.date,
              day.new_users.toString(),
              day.total_users.toString()
            ])
          ];
          
          // Activity trends
          const activitySection = [
            [],
            ["Activity Trends"],
            ["Date", "Active Users", "Sessions", "Avg. Session Duration (min)"],
            ...reportData.trends.activity.map(day => [
              day.date,
              day.active_users.toString(),
              day.sessions.toString(),
              day.avg_session_duration.toString()
            ])
          ];
          
          // Demographics
          const demographicsSection = [
            [],
            ["Demographics - Gender"],
            ["Category", "Count", "Percentage"],
            ...reportData.demographics.gender.map(item => [
              item.category,
              item.count.toString(),
              formatPercentage((item.count / reportData.summary.total_users) * 100)
            ]),
            [],
            ["Demographics - Age"],
            ["Category", "Count", "Percentage"],
            ...reportData.demographics.age.map(item => [
              item.category,
              item.count.toString(),
              formatPercentage((item.count / reportData.summary.total_users) * 100)
            ]),
            [],
            ["Demographics - Location"],
            ["Category", "Count", "Percentage"],
            ...reportData.demographics.location.map(item => [
              item.category,
              item.count.toString(),
              formatPercentage((item.count / reportData.summary.total_users) * 100)
            ])
          ];
          
          csvRows = [
            ...summarySection,
            ...registrationSection,
            ...activitySection,
            ...demographicsSection
          ];
        }
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${exportType === 'csv-all' ? 'complete' : 'summary'}_user_report_${period}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download and clean up
        link.click();
        document.body.removeChild(link);
      } 
      else if (exportType === 'csv-demographics') {
        // Demographics export
        const demoHeaders = ["Category", "Count", "Percentage"];
        
        const genderSection = [
          ["Gender Demographics"],
          demoHeaders,
          ...reportData.demographics.gender.map(item => [
            item.category,
            item.count.toString(),
            formatPercentage((item.count / reportData.summary.total_users) * 100)
          ]),
          []
        ];
        
        const ageSection = [
          ["Age Demographics"],
          demoHeaders,
          ...reportData.demographics.age.map(item => [
            item.category,
            item.count.toString(),
            formatPercentage((item.count / reportData.summary.total_users) * 100)
          ]),
          []
        ];
        
        const locationSection = [
          ["Location Demographics"],
          demoHeaders,
          ...reportData.demographics.location.map(item => [
            item.category,
            item.count.toString(),
            formatPercentage((item.count / reportData.summary.total_users) * 100)
          ])
        ];
        
        const csvRows = [
          ...genderSection,
          ...ageSection,
          ...locationSection
        ];
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `user_demographics_${period}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download and clean up
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to generate export. Please try again.");
    }
  };
  
  // Handle print action
  const handlePrint = () => {
    window.print();
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Loading user reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <User className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Reports</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchReportData()}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg inline-flex items-center font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center w-full sm:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                value={period}
                onChange={handlePeriodChange}
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="thisMonth">This month</option>
                <option value="lastMonth">Last month</option>
                <option value="thisYear">This year</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="text-sm text-gray-500">
              {reportData.period && (
                <span>
                  {formatDate(reportData.period.start)} to {formatDate(reportData.period.end)}
                </span>
              )}
            </div>
            
            <button
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
              title="Print report"
            >
              <Printer className="h-5 w-5" />
            </button>
            
            <div className="relative group">
              <button
                onClick={() => handleExport('csv-all')}
                className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
                title="Export report"
              >
                <Download className="h-5 w-5" />
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
                <button 
                  onClick={() => handleExport('csv-all')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Complete Report (CSV)
                </button>
                <button 
                  onClick={() => handleExport('csv-summary')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Summary (CSV)
                </button>
                <button 
                  onClick={() => handleExport('csv-demographics')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Demographics (CSV)
                </button>
              </div>
            </div>
            
            <button
              onClick={() => fetchReportData()}
              className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
              title="Refresh report"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.total_users.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Platform accounts
              </p>
            </div>
          </div>
        </div>
        
        {/* New Users */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.new_users.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                For this period
              </p>
            </div>
          </div>
        </div>
        
        {/* Active Users */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.active_users.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600">
                {formatPercentage((reportData.summary.active_users / reportData.summary.total_users) * 100)} of total
              </p>
            </div>
          </div>
        </div>
        
        {/* Session Duration */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Session</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.avg_session_duration} min
              </p>
              <p className="text-sm text-yellow-600">
                Per active user
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registration Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <BarChart2 className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Registration Trends</h2>
        </div>
        
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">New Users</th>
                <th className="px-4 py-2">Total Users</th>
              </tr>
            </thead>
            <tbody>
              {reportData.trends.registration.slice(0, 7).map((day, index) => (
                <tr key={index} className="bg-white border-b">
                  <td className="px-4 py-3 font-medium">{day.date}</td>
                  <td className="px-4 py-3">{day.new_users}</td>
                  <td className="px-4 py-3">{day.total_users.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reportData.trends.registration.length > 7 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">
              Showing 7 of {reportData.trends.registration.length} days. Export for complete data.
            </span>
          </div>
        )}
      </div>
      
      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics - Age */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Age Demographics</h2>
          </div>
          
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Age Range</th>
                  <th className="px-4 py-2">Number of Users</th>
                  <th className="px-4 py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.demographics.age.map((item, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium">{item.category}</td>
                    <td className="px-4 py-3">{item.count.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {formatPercentage((item.count / reportData.summary.total_users) * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Demographics - Location */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Globe className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Location Demographics</h2>
          </div>
          
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Region</th>
                  <th className="px-4 py-2">Number of Users</th>
                  <th className="px-4 py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.demographics.location.map((item, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium">{item.category}</td>
                    <td className="px-4 py-3">{item.count.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {formatPercentage((item.count / reportData.summary.total_users) * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Retention Rates */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Users className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">User Retention</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">1-Day Retention</h3>
            <p className="text-2xl font-bold text-blue-700">
              {formatPercentage(reportData.retention["1day"] * 100)}
            </p>
            <p className="text-xs text-gray-500">Users who return the next day</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">7-Day Retention</h3>
            <p className="text-2xl font-bold text-blue-700">
              {formatPercentage(reportData.retention["7days"] * 100)}
            </p>
            <p className="text-xs text-gray-500">Users who return within a week</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">30-Day Retention</h3>
            <p className="text-2xl font-bold text-blue-700">
              {formatPercentage(reportData.retention["30days"] * 100)}
            </p>
            <p className="text-xs text-gray-500">Users who return within a month</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">90-Day Retention</h3>
            <p className="text-2xl font-bold text-blue-700">
              {formatPercentage(reportData.retention["90days"] * 100)}
            </p>
            <p className="text-xs text-gray-500">Users who return within 3 months</p>
          </div>
        </div>
      </div>
      
      {/* Report Metadata */}
      <div className="text-xs text-gray-500 text-right">
        Report generated at: {new Date(reportData.generatedAt).toLocaleString()}
      </div>
    </div>
  );
} 