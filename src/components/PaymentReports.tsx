"use client";

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart2, 
  Calendar,
  Download, 
  RefreshCw,
  Printer 
} from 'lucide-react';

// Types for payment reports
interface PaymentReportData {
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalPayments: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    successRate: number;
  };
  revenue: {
    total: number;
    average: number;
    max: number;
    min: number;
  };
  trends: {
    date: string;
    total: number;
    revenue: number;
    successful: number;
    failed: number;
    pending: number;
  }[];
  distribution: {
    currency: {
      _id: string;
      count: number;
      total: number;
    }[];
  };
  generatedAt: string;
}

export default function PaymentReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<PaymentReportData | null>(null);
  const [period, setPeriod] = useState<string>("30days");

  // Fetch report data
  const fetchReportData = async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports/payments?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch payment reports:", error);
      setError("Could not load payment report data. Please try again later.");
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
  const handleExport = (exportType = 'csv-transactions') => {
    if (!reportData) return;
    
    try {
      if (exportType === 'csv-transactions') {
        // Create CSV content for transaction trends
        const headers = ["Date", "Total Transactions", "Revenue", "Successful", "Failed", "Pending"];
        const csvRows = [
          headers,
          // Add summary row
          [`Summary (${formatDate(reportData.dateRange.from)} to ${formatDate(reportData.dateRange.to)})`, 
           reportData.summary.totalPayments.toString(),
           reportData.revenue.total.toString(),
           reportData.summary.successfulPayments.toString(),
           reportData.summary.failedPayments.toString(),
           reportData.summary.pendingPayments.toString()
          ],
          // Add empty row as separator
          [],
          // Add all trend data
          ...reportData.trends.map(day => [
            day.date,
            day.total.toString(),
            day.revenue.toString(),
            day.successful.toString(),
            day.failed.toString(),
            day.pending.toString()
          ])
        ];
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payment_trends_${period}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download and clean up
        link.click();
        document.body.removeChild(link);
      } 
      else if (exportType === 'csv-currency') {
        // Create CSV content for currency distribution
        const headers = ["Currency", "Number of Transactions", "Total Amount"];
        const csvRows = [
          headers,
          // Add all currency data
          ...reportData.distribution.currency.map(currency => [
            currency._id || 'Unknown',
            currency.count.toString(),
            currency.total.toString()
          ])
        ];
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `currency_distribution_${period}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download and clean up
        link.click();
        document.body.removeChild(link);
      }
      else if (exportType === 'csv-all') {
        // Create complete report with all data
        const reportDate = new Date().toLocaleDateString();
        const summarySection = [
          ["Payment Report Summary", `Generated on: ${reportDate}`],
          ["Period", period],
          ["Date Range", `${formatDate(reportData.dateRange.from)} to ${formatDate(reportData.dateRange.to)}`],
          [],
          ["Total Payments", reportData.summary.totalPayments.toString()],
          ["Successful Payments", reportData.summary.successfulPayments.toString()],
          ["Pending Payments", reportData.summary.pendingPayments.toString()],
          ["Failed Payments", reportData.summary.failedPayments.toString()],
          ["Success Rate", `${formatPercentage(reportData.summary.successRate)}`],
          [],
          ["Revenue Metrics"],
          ["Total Revenue", formatCurrency(reportData.revenue.total)],
          ["Average Payment", formatCurrency(reportData.revenue.average)],
          ["Min Payment", formatCurrency(reportData.revenue.min)],
          ["Max Payment", formatCurrency(reportData.revenue.max)],
          [],
          ["Payment Trends"],
          ["Date", "Transactions", "Revenue", "Successful", "Failed", "Pending"]
        ];
        
        const trendsSection = reportData.trends.map(day => [
          day.date,
          day.total.toString(),
          day.revenue.toString(),
          day.successful.toString(),
          day.failed.toString(),
          day.pending.toString()
        ]);
        
        const currencySection = [
          [],
          ["Currency Distribution"],
          ["Currency", "Transactions", "Total Amount"],
          ...reportData.distribution.currency.map(currency => [
            currency._id || 'Unknown',
            currency.count.toString(),
            formatCurrency(currency.total)
          ])
        ];
        
        // Combine all sections
        const csvRows = [
          ...summarySection,
          ...trendsSection,
          ...currencySection
        ];
        
        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        
        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `complete_payment_report_${period}_${new Date().toISOString().slice(0,10)}.csv`);
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading payment reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
              {reportData.dateRange && (
                <span>
                  {formatDate(reportData.dateRange.from)} to {formatDate(reportData.dateRange.to)}
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
                  onClick={() => handleExport('csv-transactions')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Payment Trends (CSV)
                </button>
                <button 
                  onClick={() => handleExport('csv-currency')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Currency Data (CSV)
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
        {/* Total Payments */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Payments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.totalPayments}
              </p>
              <p className="text-sm text-gray-600">
                {formatCurrency(reportData.revenue.total)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Successful Payments */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Successful</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.successfulPayments}
              </p>
              <p className="text-sm text-green-600">
                {formatPercentage(reportData.summary.successRate)} success rate
              </p>
            </div>
          </div>
        </div>
        
        {/* Pending Payments */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.pendingPayments}
              </p>
              <p className="text-sm text-yellow-600">
                Awaiting processing
              </p>
            </div>
          </div>
        </div>
        
        {/* Failed Payments */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.summary.failedPayments}
              </p>
              <p className="text-sm text-red-600">
                {reportData.summary.totalPayments > 0 
                  ? formatPercentage((reportData.summary.failedPayments / reportData.summary.totalPayments) * 100)
                  : '0%'} failure rate
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Revenue Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <BarChart2 className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Revenue Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-r border-gray-200 pr-6">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(reportData.revenue.total)}</p>
            <p className="text-sm text-gray-600">From successful payments</p>
          </div>
          
          <div className="border-r border-gray-200 px-6">
            <p className="text-sm text-gray-500 mb-1">Average Payment</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(reportData.revenue.average)}</p>
            <p className="text-sm text-gray-600">Per successful transaction</p>
          </div>
          
          <div className="pl-6">
            <p className="text-sm text-gray-500 mb-1">Payment Range</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(reportData.revenue.min)} - {formatCurrency(reportData.revenue.max)}
            </p>
            <p className="text-sm text-gray-600">Min to max amount</p>
          </div>
        </div>
      </div>
      
      {/* Trends and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BarChart2 className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Payment Trends</h2>
          </div>
          
          {reportData.trends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No trend data available for the selected period.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Transactions</th>
                    <th className="px-4 py-2">Revenue</th>
                    <th className="px-4 py-2">Success/Fail</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.trends.map((day, index) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-4 py-3 font-medium">{day.date}</td>
                      <td className="px-4 py-3">{day.total}</td>
                      <td className="px-4 py-3">{formatCurrency(day.revenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">{day.successful}</span>
                          <span className="text-red-600">{day.failed}</span>
                          {day.pending > 0 && <span className="text-yellow-600 ml-2">({day.pending} pending)</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Currency Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Currency Distribution</h2>
          </div>
          
          {reportData.distribution.currency.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No currency data available for the selected period.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Currency</th>
                    <th className="px-4 py-2">Transactions</th>
                    <th className="px-4 py-2">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.distribution.currency.map((currency, index) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-4 py-3 font-medium">{currency._id || 'Unknown'}</td>
                      <td className="px-4 py-3">{currency.count}</td>
                      <td className="px-4 py-3">{formatCurrency(currency.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Report Metadata */}
      <div className="text-xs text-gray-500 text-right">
        Report generated at: {new Date(reportData.generatedAt).toLocaleString()}
      </div>
    </div>
  );
} 