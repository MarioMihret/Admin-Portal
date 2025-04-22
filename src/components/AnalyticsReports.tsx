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
  PieChart,
  TrendingUp,
  MousePointer,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  Eye,
  FileText
} from 'lucide-react';

// Types for analytics reports
interface AnalyticsReportData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_visits: number;
    total_pageviews: number;
    avg_session_duration: number;
    bounce_rate: number;
    new_users: number;
    returning_users: number;
  };
  trends: {
    traffic: {
      date: string;
      visits: number;
      page_views: number;
      new_users: number;
      bounce_rate: number;
    }[];
    conversion: {
      date: string;
      signups: number;
      conversion_rate: number;
      purchases: number;
      revenue: number;
    }[];
  };
  traffic_sources: {
    source: string;
    visits: number;
  }[];
  devices: {
    device: string;
    percentage: number;
  }[];
  popular_pages: {
    path: string;
    pageviews: number;
  }[];
  engagement: {
    avg_session_duration: number;
    avg_page_views: number;
    avg_time_on_page: number;
    total_signups: number;
    conversion_rate: number;
    total_revenue: number;
  };
  generatedAt: string;
}

export default function AnalyticsReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<AnalyticsReportData | null>(null);
  const [period, setPeriod] = useState<string>("30days");

  // Fetch report data
  const fetchReportData = async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports/analytics?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch analytics reports:", error);
      setError("Could not load analytics report data. Please try again later.");
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
          ["Analytics Report Summary", `Generated on: ${reportDate}`],
          ["Period", period],
          ["Date Range", `${formatDate(reportData.period.start)} to ${formatDate(reportData.period.end)}`],
          [],
          ["Total Visits", reportData.summary.total_visits.toString()],
          ["Total Pageviews", reportData.summary.total_pageviews.toString()],
          ["New Users", reportData.summary.new_users.toString()],
          ["Returning Users", reportData.summary.returning_users.toString()],
          ["Bounce Rate", formatPercentage(reportData.summary.bounce_rate * 100)],
          ["Avg Session Duration", `${reportData.summary.avg_session_duration} seconds`],
          [],
          ["Engagement Metrics"],
          ["Avg Page Views Per Session", reportData.engagement.avg_page_views.toString()],
          ["Avg Time on Page", `${reportData.engagement.avg_time_on_page} seconds`],
          ["Total Signups", reportData.engagement.total_signups.toString()],
          ["Conversion Rate", formatPercentage(reportData.engagement.conversion_rate * 100)],
          ["Total Revenue", formatCurrency(reportData.engagement.total_revenue)]
        ];
        
        let csvRows = [...summarySection];
        
        if (exportType === 'csv-all') {
          // Traffic trends
          const trafficSection = [
            [],
            ["Traffic Trends"],
            ["Date", "Visits", "Page Views", "New Users", "Bounce Rate"],
            ...reportData.trends.traffic.map(day => [
              day.date,
              day.visits.toString(),
              day.page_views.toString(),
              day.new_users.toString(),
              formatPercentage(day.bounce_rate * 100)
            ])
          ];
          
          // Conversion trends
          const conversionSection = [
            [],
            ["Conversion Trends"],
            ["Date", "Signups", "Conversion Rate", "Purchases", "Revenue"],
            ...reportData.trends.conversion.map(day => [
              day.date,
              day.signups.toString(),
              formatPercentage(day.conversion_rate * 100),
              day.purchases.toString(),
              formatCurrency(day.revenue)
            ])
          ];
          
          // Traffic sources
          const sourcesSection = [
            [],
            ["Traffic Sources"],
            ["Source", "Visits", "Percentage"],
            ...reportData.traffic_sources.map(source => [
              source.source,
              source.visits.toString(),
              formatPercentage((source.visits / reportData.summary.total_visits) * 100)
            ])
          ];
          
          // Devices
          const devicesSection = [
            [],
            ["Device Distribution"],
            ["Device", "Percentage"],
            ...reportData.devices.map(device => [
              device.device,
              formatPercentage(device.percentage * 100)
            ])
          ];
          
          // Popular pages
          const pagesSection = [
            [],
            ["Popular Pages"],
            ["Page Path", "Pageviews", "Percentage"],
            ...reportData.popular_pages.map(page => [
              page.path,
              page.pageviews.toString(),
              formatPercentage((page.pageviews / reportData.summary.total_pageviews) * 100)
            ])
          ];
          
          csvRows = [
            ...summarySection,
            ...trafficSection,
            ...conversionSection,
            ...sourcesSection,
            ...devicesSection,
            ...pagesSection
          ];
        }
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${exportType === 'csv-all' ? 'complete' : 'summary'}_analytics_report_${period}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download and clean up
        link.click();
        document.body.removeChild(link);
      } 
      else if (exportType === 'csv-traffic') {
        // Traffic export
        const headers = ["Date", "Visits", "Page Views", "New Users", "Bounce Rate"];
        
        const trafficRows = [
          ["Traffic Trends Report", `Period: ${period} (${formatDate(reportData.period.start)} to ${formatDate(reportData.period.end)})`],
          [],
          headers,
          ...reportData.trends.traffic.map(day => [
            day.date,
            day.visits.toString(),
            day.page_views.toString(),
            day.new_users.toString(),
            formatPercentage(day.bounce_rate * 100)
          ])
        ];
        
        // Convert to CSV string
        const csvContent = trafficRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `traffic_trends_${period}_${new Date().toISOString().slice(0,10)}.csv`);
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
  
  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading analytics reports...</p>
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
                  onClick={() => handleExport('csv-traffic')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Traffic Data (CSV)
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
        {/* Total Visits */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MousePointer className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Visits</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.total_visits.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {formatPercentage((reportData.summary.new_users / reportData.summary.total_visits) * 100)} new users
              </p>
            </div>
          </div>
        </div>
        
        {/* Pageviews */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pageviews</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.total_pageviews.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                {reportData.engagement.avg_page_views.toFixed(1)} per session
              </p>
            </div>
          </div>
        </div>
        
        {/* Bounce Rate */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bounce Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(reportData.summary.bounce_rate * 100)}
              </p>
              <p className="text-sm text-yellow-600">
                Single page sessions
              </p>
            </div>
          </div>
        </div>
        
        {/* Session Duration */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Session</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatTime(reportData.summary.avg_session_duration)}
              </p>
              <p className="text-sm text-purple-600">
                {formatTime(reportData.engagement.avg_time_on_page)} per page
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Traffic Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <BarChart2 className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Traffic Trends</h2>
        </div>
        
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Visits</th>
                <th className="px-4 py-2">Pageviews</th>
                <th className="px-4 py-2">New Users</th>
                <th className="px-4 py-2">Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {reportData.trends.traffic.slice(0, 7).map((day, index) => (
                <tr key={index} className="bg-white border-b">
                  <td className="px-4 py-3 font-medium">{day.date}</td>
                  <td className="px-4 py-3">{day.visits.toLocaleString()}</td>
                  <td className="px-4 py-3">{day.page_views.toLocaleString()}</td>
                  <td className="px-4 py-3">{day.new_users.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatPercentage(day.bounce_rate * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reportData.trends.traffic.length > 7 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">
              Showing 7 of {reportData.trends.traffic.length} days. Export for complete data.
            </span>
          </div>
        )}
      </div>
      
      {/* Traffic Sources & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Globe className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Traffic Sources</h2>
          </div>
          
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">Visits</th>
                  <th className="px-4 py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.traffic_sources.map((source, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium">{source.source}</td>
                    <td className="px-4 py-3">{source.visits.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {formatPercentage((source.visits / reportData.summary.total_visits) * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Devices */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Smartphone className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Device Distribution</h2>
          </div>
          
          <div className="space-y-6">
            {reportData.devices.map((device, index) => (
              <div key={index} className="relative">
                <div className="flex items-center">
                  <div className="w-10 text-gray-500">
                    {device.device === 'Mobile' && <Smartphone className="h-5 w-5" />}
                    {device.device === 'Desktop' && <Monitor className="h-5 w-5" />}
                    {device.device === 'Tablet' && <Tablet className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{device.device}</span>
                      <span className="text-sm font-medium text-gray-700">{formatPercentage(device.percentage * 100)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${device.percentage * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Popular Pages */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Popular Pages</h2>
        </div>
        
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Page Path</th>
                <th className="px-4 py-2">Pageviews</th>
                <th className="px-4 py-2">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {reportData.popular_pages.map((page, index) => (
                <tr key={index} className="bg-white border-b">
                  <td className="px-4 py-3 font-medium">{page.path}</td>
                  <td className="px-4 py-3">{page.pageviews.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {formatPercentage((page.pageviews / reportData.summary.total_pageviews) * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Conversion Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <PieChart className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Conversion Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-r border-gray-200 pr-6">
            <p className="text-sm text-gray-500 mb-1">Signups</p>
            <p className="text-2xl font-semibold text-gray-900">{reportData.engagement.total_signups.toLocaleString()}</p>
            <p className="text-sm text-gray-600">
              {formatPercentage(reportData.engagement.conversion_rate * 100)} conversion rate
            </p>
          </div>
          
          <div className="border-r border-gray-200 px-6">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(reportData.engagement.total_revenue)}</p>
            <p className="text-sm text-gray-600">From all purchases</p>
          </div>
          
          <div className="pl-6">
            <p className="text-sm text-gray-500 mb-1">Engagement</p>
            <p className="text-lg font-semibold text-gray-900">
              {reportData.engagement.avg_page_views.toFixed(1)} pages per session
            </p>
            <p className="text-sm text-gray-600">{formatTime(reportData.engagement.avg_time_on_page)} avg. time on page</p>
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