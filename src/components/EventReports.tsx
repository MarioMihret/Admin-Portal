"use client";

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  BarChart2, 
  Users, 
  Download, 
  RefreshCw,
  Printer,
  Clock,
  Layers,
  PieChart,
  DollarSign,
  Award,
  Share2
} from 'lucide-react';

// Types for event reports
interface EventReportData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_events: number;
    total_attendees: number;
    avg_attendance: number;
    total_revenue: number;
    avg_ticket_price: number;
  };
  trends: {
    events: {
      date: string;
      events: number;
      categories: number;
    }[];
    attendance: {
      date: string;
      attendees: number;
      revenue: number;
      avg_ticket_price: number;
    }[];
  };
  categories: {
    category: string;
    count: number;
    attendees: number;
    revenue: number;
  }[];
  time_distribution: {
    time: string;
    percentage: number;
  }[];
  engagement: {
    avg_satisfaction: string;
    repeat_attendees: number;
    social_shares: number;
    avg_duration: number;
  };
  generatedAt: string;
}

export default function EventReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<EventReportData | null>(null);
  const [period, setPeriod] = useState<string>("30days");

  // Fetch report data
  const fetchReportData = async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports/events?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch event reports:", error);
      setError("Could not load event report data. Please try again later.");
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
          ["Event Report Summary", `Generated on: ${reportDate}`],
          ["Period", period],
          ["Date Range", `${formatDate(reportData.period.start)} to ${formatDate(reportData.period.end)}`],
          [],
          ["Total Events", reportData.summary.total_events.toString()],
          ["Total Attendees", reportData.summary.total_attendees.toString()],
          ["Average Attendance", reportData.summary.avg_attendance.toString()],
          ["Total Revenue", `$${reportData.summary.total_revenue.toLocaleString()}`],
          ["Average Ticket Price", `$${reportData.summary.avg_ticket_price.toLocaleString()}`],
          [],
          ["Engagement Metrics"],
          ["Average Satisfaction", `${reportData.engagement.avg_satisfaction}/5.0`],
          ["Repeat Attendees", `${formatPercentage(reportData.engagement.repeat_attendees * 100)}`],
          ["Social Shares", reportData.engagement.social_shares.toString()],
          ["Average Duration", `${reportData.engagement.avg_duration} minutes`]
        ];
        
        let csvRows = [...summarySection];
        
        if (exportType === 'csv-all') {
          // Event trends
          const eventSection = [
            [],
            ["Event Trends"],
            ["Date", "Events", "Categories"],
            ...reportData.trends.events.map(day => [
              day.date,
              day.events.toString(),
              day.categories.toString()
            ])
          ];
          
          // Attendance trends
          const attendanceSection = [
            [],
            ["Attendance Trends"],
            ["Date", "Attendees", "Revenue", "Avg. Ticket Price"],
            ...reportData.trends.attendance.map(day => [
              day.date,
              day.attendees.toString(),
              `$${day.revenue.toString()}`,
              `$${day.avg_ticket_price.toString()}`
            ])
          ];
          
          // Categories
          const categoriesSection = [
            [],
            ["Event Categories"],
            ["Category", "Event Count", "Attendees", "Revenue"],
            ...reportData.categories.map(cat => [
              cat.category,
              cat.count.toString(),
              cat.attendees.toString(),
              `$${cat.revenue.toString()}`
            ])
          ];
          
          // Time distribution
          const timeSection = [
            [],
            ["Time Distribution"],
            ["Time of Day", "Percentage"],
            ...reportData.time_distribution.map(time => [
              time.time,
              formatPercentage(time.percentage * 100)
            ])
          ];
          
          csvRows = [
            ...summarySection,
            ...eventSection,
            ...attendanceSection,
            ...categoriesSection,
            ...timeSection
          ];
        }
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${exportType === 'csv-all' ? 'complete' : 'summary'}_event_report_${period}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download and clean up
        link.click();
        document.body.removeChild(link);
      } 
      else if (exportType === 'csv-categories') {
        // Categories export
        const headers = ["Category", "Event Count", "Attendees", "Revenue", "Avg. Ticket Price"];
        
        const categoryRows = [
          ["Event Categories Report", `Period: ${period} (${formatDate(reportData.period.start)} to ${formatDate(reportData.period.end)})`],
          [],
          headers,
          ...reportData.categories.map(cat => [
            cat.category,
            cat.count.toString(),
            cat.attendees.toString(),
            `$${cat.revenue.toString()}`,
            `$${Math.round(cat.revenue / cat.attendees).toString()}`
          ])
        ];
        
        // Convert to CSV string
        const csvContent = categoryRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `event_categories_${period}_${new Date().toISOString().slice(0,10)}.csv`);
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

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading event reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <BarChart2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
                  onClick={() => handleExport('csv-categories')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Categories (CSV)
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
        {/* Total Events */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.total_events.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {period} period
              </p>
            </div>
          </div>
        </div>
        
        {/* Total Attendees */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Attendees</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.total_attendees.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                Avg {reportData.summary.avg_attendance} per event
              </p>
            </div>
          </div>
        </div>
        
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(reportData.summary.total_revenue)}
              </p>
              <p className="text-sm text-purple-600">
                Avg {formatCurrency(reportData.summary.avg_ticket_price)} per ticket
              </p>
            </div>
          </div>
        </div>
        
        {/* Satisfaction Rating */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Satisfaction</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.engagement.avg_satisfaction}/5.0
              </p>
              <p className="text-sm text-yellow-600">
                Average rating
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <BarChart2 className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Event Trends</h2>
        </div>
        
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Events</th>
                <th className="px-4 py-2">Attendees</th>
                <th className="px-4 py-2">Revenue</th>
                <th className="px-4 py-2">Avg Ticket</th>
              </tr>
            </thead>
            <tbody>
              {reportData.trends.events.slice(0, 7).map((day, index) => {
                const attendanceData = reportData.trends.attendance[index];
                return (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium">{day.date}</td>
                    <td className="px-4 py-3">{day.events}</td>
                    <td className="px-4 py-3">{attendanceData.attendees.toLocaleString()}</td>
                    <td className="px-4 py-3">{formatCurrency(attendanceData.revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(attendanceData.avg_ticket_price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {reportData.trends.events.length > 7 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">
              Showing 7 of {reportData.trends.events.length} days. Export for complete data.
            </span>
          </div>
        )}
      </div>
      
      {/* Event Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <PieChart className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Event Categories</h2>
        </div>
        
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Events</th>
                <th className="px-4 py-2">Attendees</th>
                <th className="px-4 py-2">Revenue</th>
                <th className="px-4 py-2">Average Ticket</th>
              </tr>
            </thead>
            <tbody>
              {reportData.categories.map((category, index) => (
                <tr key={index} className="bg-white border-b">
                  <td className="px-4 py-3 font-medium">{category.category}</td>
                  <td className="px-4 py-3">{category.count}</td>
                  <td className="px-4 py-3">{category.attendees.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatCurrency(category.revenue)}</td>
                  <td className="px-4 py-3">{formatCurrency(Math.round(category.revenue / category.attendees))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Time Distribution</h2>
          </div>
          
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Time of Day</th>
                  <th className="px-4 py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.time_distribution.map((time, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium">{time.time}</td>
                    <td className="px-4 py-3">{formatPercentage(time.percentage * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Engagement Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Share2 className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Engagement Metrics</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Average Satisfaction</h3>
              <p className="text-2xl font-bold text-blue-700">
                {reportData.engagement.avg_satisfaction}/5.0
              </p>
              <p className="text-xs text-gray-500">Attendee feedback score</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Repeat Attendees</h3>
              <p className="text-2xl font-bold text-blue-700">
                {formatPercentage(reportData.engagement.repeat_attendees * 100)}
              </p>
              <p className="text-xs text-gray-500">Return for multiple events</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Social Shares</h3>
              <p className="text-2xl font-bold text-blue-700">
                {reportData.engagement.social_shares.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Posts across platforms</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Average Duration</h3>
              <p className="text-2xl font-bold text-blue-700">
                {reportData.engagement.avg_duration} min
              </p>
              <p className="text-xs text-gray-500">Event length</p>
            </div>
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