"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, UserCircle, XCircle, CheckCircle } from 'lucide-react';

interface PaymentSummary {
  totalRevenue: number;
  successfulTransactions: number;
  averageTransactionValue: number;
  totalFailedTransactions: number;
}

interface FailedPayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  failedAt: string;
  reason: string;
  paymentMethodType?: string; // e.g., 'Card', 'PayPal'
}

interface FinancialsData {
  summary: PaymentSummary;
  recentFailedPayments: FailedPayment[];
}

// Mock function to fetch financials data
const fetchFinancialsData = async (): Promise<FinancialsData> => {
  console.log("Fetching financials data...");
  await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate API delay

  const mockFailedPayments: FailedPayment[] = [
    {
      id: 'fail_pay_001',
      userId: 'usr_abc123',
      userName: 'Alice Wonderland',
      userEmail: 'alice@example.com',
      amount: 49.99,
      currency: 'USD',
      failedAt: '2024-03-12T14:30:00Z',
      reason: 'Insufficient funds',
      paymentMethodType: 'Card',
    },
    {
      id: 'fail_pay_002',
      userId: 'usr_def456',
      userName: 'Bob The Builder',
      userEmail: 'bob@example.com',
      amount: 99.00,
      currency: 'USD',
      failedAt: '2024-03-11T09:15:00Z',
      reason: 'Payment declined by bank',
      paymentMethodType: 'Card',
    },
    {
      id: 'fail_pay_003',
      userId: 'usr_ghi789',
      userName: 'Charlie Chaplin',
      userEmail: 'charlie@example.com',
      amount: 19.50,
      currency: 'USD',
      failedAt: '2024-03-10T16:00:00Z',
      reason: 'Invalid card details',
      paymentMethodType: 'Card',
    },
  ];

  return {
    summary: {
      totalRevenue: 125670.50,
      successfulTransactions: 1850,
      averageTransactionValue: 67.93,
      totalFailedTransactions: mockFailedPayments.length + 12, // Adding some more for the summary
    },
    recentFailedPayments: mockFailedPayments.sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()),
  };
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const formatCurrency = (amount: number, currencyCode = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
};

export default function FinancialsPage() {
  const [financials, setFinancials] = useState<FinancialsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinancials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFinancialsData();
      setFinancials(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching financial data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading Financial Overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Error Loading Financial Data</h2>
        <p className="text-red-600 dark:text-red-400 text-center mb-6 px-4">{error}</p>
        <button onClick={loadFinancials} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          <RefreshCw className="h-5 w-5 mr-2" /> Try Again
        </button>
      </div>
    );
  }

  if (!financials) {
     return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <DollarSign className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">No Financial Data Available</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6 px-4">There is currently no financial data to display.</p>
        <button onClick={loadFinancials} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          <RefreshCw className="h-5 w-5 mr-2" /> Refresh Data
        </button>
      </div>
    );
  }

  const { summary, recentFailedPayments } = financials;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <DollarSign className="h-8 w-8 mr-3 text-purple-600 dark:text-purple-400" />
            Financial Overview
          </h1>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Track revenue, successful transactions, and failed payments.
          </p>
        </div>
        <button onClick={loadFinancials} title="Refresh financial data" className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-l-4 border-green-500 dark:border-green-400">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-l-4 border-blue-500 dark:border-blue-400">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Successful Transactions</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.successfulTransactions.toLocaleString()}</p>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-l-4 border-purple-500 dark:border-purple-400">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Avg. Transaction Value</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(summary.averageTransactionValue)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on successful transactions</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-l-4 border-red-500 dark:border-red-400">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Failed Transactions</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.totalFailedTransactions.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time, needs attention</p>
        </div>
      </div>

      {/* Failed Payments Table */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-x-auto">
        <h2 className="px-5 py-4 text-lg font-semibold text-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-700 flex items-center">
          <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
          Recent Failed Payments
        </h2>
        {recentFailedPayments.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/80">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Failed At</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                <th scope="col" className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {recentFailedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-red-50/50 dark:hover:bg-red-700/20 transition-colors duration-150">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.userName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{payment.userEmail}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 font-medium">{formatCurrency(payment.amount, payment.currency)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(payment.failedAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 max-w-xs truncate" title={payment.reason}>{payment.reason}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{payment.paymentMethodType || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {/* Placeholder for actions like retry payment, view user, etc. */}
                    <Link href={`/super-admin/users/edit/${payment.userId}`} className="p-1.5 rounded-full text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-700/30 transition-colors" title="View User Profile">
                      <UserCircle className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
            No recent failed payments found.
          </p>
        )}
      </div>

      {/* Placeholder for future sections like payment gateways status, detailed reports link etc */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Future financial modules like Payment Gateway Status or links to Detailed Financial Reports will appear here.
        </p>
      </div>

    </div>
  );
} 