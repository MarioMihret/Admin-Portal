"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  DollarSign, 
  Download, 
  Filter, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Search
} from 'lucide-react';

// Define interfaces for data structures
interface Payment {
  _id: string;
  tx_ref: string;
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'pending' | 'success' | 'failed';
  payment_date: string;
  callback_response?: any;
}

interface PaymentListResponse {
  payments: Payment[];
  metrics: {
    totalRevenue: number;
    statusCounts: {
      success: number;
      pending: number;
      failed: number;
    };
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const paymentStatusColors = {
  success: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800'
};

const paymentStatusIcons = {
  success: CheckCircle,
  pending: Clock,
  failed: AlertCircle
};

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Metrics state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Fetch data from the API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      // Make the API request
      const response = await fetch(`/api/payments?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data: PaymentListResponse = await response.json();
      
      // Update state with the response data
      setPayments(data.payments);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
      
      // Update metrics
      setTotalRevenue(data.metrics.totalRevenue);
      setCompletedCount(data.metrics.statusCounts.success);
      setPendingCount(data.metrics.statusCounts.pending);
      setFailedCount(data.metrics.statusCounts.failed);
      
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setError("Could not load payment data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, statusFilter]); // Refetch when these values change
  
  // Debounce search to prevent too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchData();
      } else {
        // Reset to page 1 when search changes
        setPage(1);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Handle export functionality
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Build query params for export (fetching all matching records)
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      queryParams.append('limit', '10000'); // Fetch up to 10000 records for export
      queryParams.append('page', '1');
      
      const response = await fetch(`/api/payments?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data for export');
      }
      
      const data: PaymentListResponse = await response.json();
      
      // Convert to CSV
      const headers = ['Transaction ID', 'Date', 'Amount', 'Currency', 'Status', 'Customer Name', 'Customer Email'];
      const csvContent = [
        headers.join(','),
        ...data.payments.map(payment => {
          const date = new Date(payment.payment_date).toLocaleDateString('en-US');
          const name = `${payment.first_name} ${payment.last_name}`.replace(/,/g, ''); // Remove commas to prevent CSV issues
          return [
            payment.tx_ref,
            date,
            payment.amount,
            payment.currency,
            payment.status,
            name,
            payment.email
          ].join(',');
        })
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export payments. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all payment transactions
        </p>
      </div>

      {/* Payment summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-semibold text-gray-900">
                ${typeof totalRevenue === 'number' ? totalRevenue.toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-gray-600">From {completedCount} completed payments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Successful Payments</h3>
              <p className="text-2xl font-semibold text-gray-900">{completedCount}</p>
              <p className="text-sm text-green-600">
                {totalItems > 0 
                  ? `${Math.round((completedCount / totalItems) * 100)}% success rate` 
                  : '0% success rate'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-yellow-600">
                {failedCount > 0 && `+ ${failedCount} failed payments`}
                {failedCount === 0 && pendingCount > 0 && 'Awaiting processing'}
                {failedCount === 0 && pendingCount === 0 && 'No pending payments'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and actions */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-64 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-3 py-2 w-full border border-blue-100 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                className="border border-blue-100 rounded-lg bg-white/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="success">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center px-3 py-2 border border-blue-100 rounded-lg bg-white text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Refresh payment data"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-blue-100 rounded-lg bg-white text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
        {error && (
          <div className="p-6 bg-red-50 border-b border-red-100 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg inline-flex items-center font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="py-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center mt-4 text-gray-500">Loading payment data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100">
              <thead className="bg-blue-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                        {searchTerm || statusFilter !== 'all' ? (
                          <Filter className="h-8 w-8 text-blue-500" />
                        ) : (
                          <CreditCard className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                      <p className="text-gray-500 text-lg font-medium mb-2">
                        {searchTerm || statusFilter !== 'all' ? 
                          "No payments found matching your filters." :
                          "No payment transactions available."}
                      </p>
                      {(searchTerm || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg inline-flex items-center transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    // Use fallback icon if status doesn't match known types
                    const StatusIcon = paymentStatusIcons[payment.status] || AlertCircle;
                    
                    return (
                      <tr key={payment._id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{payment.tx_ref || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${payment.amount ? payment.amount.toFixed(2) : '0.00'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span 
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColors[payment.status] || 'bg-gray-100 text-gray-800'}`}
                              title={payment.status === 'success' ? 'Payment completed successfully' : 
                                     payment.status === 'pending' ? 'Payment is being processed' :
                                     payment.status === 'failed' ? 'Payment failed to process' : 'Unknown status'}
                            >
                              <StatusIcon className="h-3.5 w-3.5 mr-1" />
                              {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.payment_date || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.first_name || 'Unknown'} {payment.last_name || ''}
                          </div>
                          <div className="text-xs text-gray-500">{payment.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.currency || 'USD'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/payments/${payment._id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-blue-100 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-blue-100 text-sm font-medium rounded-lg ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-blue-100 text-sm font-medium rounded-lg ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{payments.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-lg border border-blue-100 text-sm font-medium ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Pagination numbers - simplified for brevity */}
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNum: number;
                    
                    // Simple logic to handle pagination display
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (page <= 3) {
                      pageNum = idx + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = page - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border border-blue-100 text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white text-gray-500 hover:bg-blue-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-lg border border-blue-100 text-sm font-medium ${
                      page === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 