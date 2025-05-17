"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CreditCard, RefreshCw, AlertTriangle, Activity, Users, Database, DollarSign, CheckCircle, XCircle, Clock, Info, ChevronLeft, ChevronRight, Search, Filter, Download,
  PlusCircle, Edit3, Check, X, LayoutGrid, Tag, FolderOpen, SlidersHorizontal, RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminSubscriptionView,
  ISubscriptionPlanFE,
} from './types';
import {
  formatDate,
  getStatusChipClass,
  getStatusIcon
} from './utils/displayHelpers';
import { useSubscriptionManagement, SubscriptionFilters } from './hooks/useSubscriptionManagement';
import { usePlanDefinitions } from './hooks/usePlanDefinitions';
import { updateSubscriptionStatus } from './api';
import { SubscriptionSearchBar } from './components/SubscriptionSearchBar';
import { SubscriptionFilterPanel } from './components/SubscriptionFilterPanel';
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal';

const uniqueSubscriptionStatuses = [
  { id: 'active', label: 'Active' },
  { id: 'trial', label: 'Trial' },
  { id: 'pending', label: 'Pending' },
  { id: 'past_due', label: 'Past Due' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'failed', label: 'Failed' },
  { id: 'paid', label: 'Paid' }
];

const uniquePaymentStatuses = [
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'refunded', label: 'Refunded' }
];

export default function SubscriptionManagementPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<AdminSubscriptionView | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [subscriptionToActivate, setSubscriptionToActivate] = useState<AdminSubscriptionView | null>(null);
  
  const {
    data: subscriptionData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    filters,
    activeFiltersCount,
    handlePageChange,
    handleFilterChange,
    clearFilters,
    refreshData: refreshSubscriptionData
  } = useSubscriptionManagement(10);

  const {
    plansData,
    isLoading: plansLoading,
  } = usePlanDefinitions();

  const handleSearchTermChange = (newSearchTerm: string) => {
    handleFilterChange({ search: newSearchTerm });
  };

  const handlePlanIdFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleFilterChange({ planId: e.target.value });
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleFilterChange({ status: e.target.value });
  };

  const handlePaymentStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleFilterChange({ paymentStatus: e.target.value });
  };

  const openCancelModal = (subscription: AdminSubscriptionView) => {
    setSubscriptionToCancel(subscription);
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setSubscriptionToCancel(null);
    setIsCancelModalOpen(false);
  };

  const openActivateModal = (subscription: AdminSubscriptionView) => {
    setSubscriptionToActivate(subscription);
    setIsActivateModalOpen(true);
  };

  const closeActivateModal = () => {
    setSubscriptionToActivate(null);
    setIsActivateModalOpen(false);
  };

  const confirmSubscriptionCancel = async () => {
    if (!subscriptionToCancel) return;
    
    const originalStatus = subscriptionToCancel.status;
    // Optimistic update (optional, but can make UI feel faster)
    // setData(prevData => prevData ? {
    //   ...prevData,
    //   subscriptions: prevData.subscriptions.map(sub => 
    //     sub._id === subscriptionToCancel._id ? { ...sub, status: 'cancelled' } : sub
    //   )
    // } : null);

    toast.loading(`Cancelling subscription for ${subscriptionToCancel.userId?.name || subscriptionToCancel.userId?.email || subscriptionToCancel._id}...`);

    try {
      await updateSubscriptionStatus(subscriptionToCancel._id, 'cancelled');
      toast.dismiss();
      toast.success(`Subscription for ${subscriptionToCancel.userId?.name || subscriptionToCancel.userId?.email || subscriptionToCancel._id} has been cancelled.`);
      refreshSubscriptionData(); // Refresh the list to show the updated status
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription.';
      toast.error(errorMessage);
      // Optional: Rollback optimistic update if it was implemented
      // setData(prevData => prevData ? { ... } : null); // Revert to original status if needed
    } finally {
      closeCancelModal();
    }
  };

  const confirmSubscriptionActivate = async () => {
    if (!subscriptionToActivate) return;

    toast.loading(`Activating subscription for ${subscriptionToActivate.userId?.name || subscriptionToActivate.userId?.email || subscriptionToActivate._id}...`);

    try {
      await updateSubscriptionStatus(subscriptionToActivate._id, 'active');
      toast.dismiss();
      toast.success(`Subscription for ${subscriptionToActivate.userId?.name || subscriptionToActivate.userId?.email || subscriptionToActivate._id} has been activated.`);
      refreshSubscriptionData();
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate subscription.';
      toast.error(errorMessage);
    } finally {
      closeActivateModal();
    }
  };

  if (subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Loading critical data...</p>
      </div>
    );
  }

  const combinedError = subscriptionsError;
  if (combinedError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
        <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold text-red-700 dark:text-red-300 mb-3">An Error Occurred</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-6">
          We encountered a problem loading the subscription management console. Please try again.
        </p>
        {subscriptionsError && <p className="text-sm text-red-600 dark:text-red-400 mt-1">Details (Subscriptions): {subscriptionsError}</p>}
        <button
          onClick={() => {
            if(subscriptionsError) refreshSubscriptionData();
          }}
          className="mt-8 px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <RefreshCw className="w-5 h-5 mr-2 animate-spin-slow" /> 
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Subscription Control Center
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
            Manage user subscriptions, monitor plan statuses, and oversee all subscription activities.
          </p>
        </div>
          <div className="flex gap-3">
            <Link href="/super-admin/subscription/plans" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-150 ease-in-out transform hover:scale-105">
              <LayoutGrid className="w-5 h-5 mr-2" />
              Manage Plans
            </Link>
            <Link href="/super-admin" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150">
          <ArrowLeft className="w-5 h-5 mr-2" />
              Back
        </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <SubscriptionSearchBar 
            searchTerm={filters.search || ''}
            onSearchTermChange={handleSearchTermChange}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <button
              onClick={refreshSubscriptionData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Refresh
            </button>
              <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
              <Download className="w-5 h-5 mr-2" />
              Export
                        </button>
          </div>
                    </div>

        {showFilters && (
          <SubscriptionFilterPanel 
            filters={filters}
            onPlanIdChange={handlePlanIdFilterChange}
            onStatusChange={handleStatusFilterChange}
            onPaymentStatusChange={handlePaymentStatusFilterChange}
            onClearFilters={clearFilters}
            plansData={plansData}
            uniqueSubscriptionStatuses={uniqueSubscriptionStatuses}
            uniquePaymentStatuses={uniquePaymentStatuses}
            activeFiltersCount={activeFiltersCount}
          />
        )}
      </header>

      {/* Stats Overview Section */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat Card 1: Active Subscriptions */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow duration-300">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full">
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="min-h-20 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {subscriptionData?.pagination?.total || 'N/A'}
              </p>
            </div>
          </div>

          {/* Stat Card 2: Trial Subscriptions */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow duration-300">
            <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-full">
              <Activity className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
            <div className="min-h-20 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trial Subscriptions</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {subscriptionsLoading
                  ? '...'
                  : (subscriptionData?.subscriptions?.filter(s => s.status === 'trial').length || '0')}
              </p>
            </div>
          </div>

          {/* Stat Card 3: Total Plans */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow duration-300">
            <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-full">
              <LayoutGrid className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="min-h-20 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Plans</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {plansData?.length || 'N/A'}
              </p>
            </div>
          </div>

          {/* Stat Card 4: Estimated MRR */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow duration-300">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-full">
              <DollarSign className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div className="min-h-20 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated MRR</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {subscriptionsLoading
                  ? '...'
                  : subscriptionData?.aggregates?.estimatedMRR !== undefined
                    ? `$${subscriptionData.aggregates.estimatedMRR.toFixed(2)}`
                    : `$${(
                        subscriptionData?.subscriptions
                          ?.filter(sub => sub.status === 'active')
                          ?.reduce((sum, sub) => sum + sub.amount, 0) || 0
                      ).toFixed(2)}`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-800">
         <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center text-gray-800 dark:text-gray-200">
                <Users className="w-6 h-6 mr-2 text-blue-500" /> Active Subscriptions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Showing {subscriptionData?.subscriptions?.length || 0} of {subscriptionData?.pagination?.total || 0} subscriptions
            </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-750">
            <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(subscriptionData?.subscriptions ?? []).length > 0 ? (
                (subscriptionData?.subscriptions ?? []).map((sub) => (
              <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                      {sub.userId ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {sub.userId.name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sub.userId.email || sub.userId._id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Missing User Data
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300">
                        {sub.planId || 'N/A'}
                      </span>
                    </td>
                <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusChipClass(sub.status)}`}>
                        {getStatusIcon(sub.status)}
                        <span className="ml-1">{sub.status ? sub.status.replace('_', ' ') : 'N/A'}</span>
                      </span>
                    </td>
                <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusChipClass(sub.paymentStatus)}`}>
                        {getStatusIcon(sub.paymentStatus)}
                        <span className="ml-1">{sub.paymentStatus ? sub.paymentStatus.replace('_', ' ') : 'N/A'}</span>
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-green-500" />
                          Start: {formatDate(sub.startDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-red-500" />
                          End: {formatDate(sub.endDate)}
                        </div>
                        {sub.expiryDate && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-yellow-500" />
                            Expiry: {formatDate(sub.expiryDate)}
                          </div>
                        )}
                      </div>
                </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                        {sub.currency} {sub.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/super-admin/subscription/edit/${sub._id}`}>
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="Edit Subscription"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Link>
                        {sub.status !== 'cancelled' ? (
                          <button
                            onClick={() => openCancelModal(sub)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Cancel Subscription"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openActivateModal(sub)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30"
                            title="Activate Subscription"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-gray-400 mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No Subscriptions Found</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeFiltersCount > 0 
                          ? 'Try adjusting your filters to see more results' 
                          : 'No subscriptions are currently available'}
                      </p>
                    </div>
                    </td>
                  </tr>
            )}
              </tbody>
            </table>
        </div>

        {subscriptionData && subscriptionData.pagination.pages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Previous
                                </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === subscriptionData.pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Next
                                        </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, subscriptionData.pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{subscriptionData.pagination.total}</span> results
                </p>
                </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === subscriptionData.pagination.pages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      
      {subscriptionToCancel && (
        <CancelSubscriptionModal
          isOpen={isCancelModalOpen}
          onClose={closeCancelModal}
          onConfirm={confirmSubscriptionCancel}
          subscription={subscriptionToCancel}
        />
      )}
      {subscriptionToActivate && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${isActivateModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0" style={isActivateModalOpen ? {transform: 'scale(1)', opacity: 1} : {}}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activate Subscription</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to reactivate the subscription for {subscriptionToActivate.userId?.name || subscriptionToActivate.userId?.email || subscriptionToActivate._id}?
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeActivateModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubscriptionActivate}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 