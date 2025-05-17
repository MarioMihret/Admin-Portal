'use client';

import React from 'react';
import { X } from 'lucide-react';
import { SubscriptionFilters } from '../hooks/useSubscriptionManagement';
import { ISubscriptionPlanFE } from '../types';

interface FilterOption {
  id: string;
  label: string;
}

interface SubscriptionFilterPanelProps {
  filters: SubscriptionFilters;
  onPlanIdChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPaymentStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearFilters: () => void;
  plansData: ISubscriptionPlanFE[] | null | undefined;
  uniqueSubscriptionStatuses: FilterOption[];
  uniquePaymentStatuses: FilterOption[];
  activeFiltersCount: number;
}

export const SubscriptionFilterPanel: React.FC<SubscriptionFilterPanelProps> = ({
  filters,
  onPlanIdChange,
  onStatusChange,
  onPaymentStatusChange,
  onClearFilters,
  plansData,
  uniqueSubscriptionStatuses,
  uniquePaymentStatuses,
  activeFiltersCount
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="planIdFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Plan
          </label>
          <select 
            id="planIdFilter" 
            name="planIdFilter"
            value={filters.planId}
            onChange={onPlanIdChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-150 ease-in-out"
          >
            <option value="">All Plans</option>
            {plansData?.map((plan) => (
              <option key={plan._id} value={plan.slug}>{plan.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subscription Status
          </label>
          <select 
            id="statusFilter" 
            name="statusFilter"
            value={filters.status}
            onChange={onStatusChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-150 ease-in-out"
          >
            <option value="">All Statuses</option>
            {uniqueSubscriptionStatuses.map((status) => (
              <option key={status.id} value={status.id}>{status.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="paymentStatusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Status
          </label>
          <select 
            id="paymentStatusFilter" 
            name="paymentStatusFilter"
            value={filters.paymentStatus}
            onChange={onPaymentStatusChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-150 ease-in-out"
          >
            <option value="">All Payment Statuses</option>
            {uniquePaymentStatuses.map((status) => (
              <option key={status.id} value={status.id}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>
      {activeFiltersCount > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-700/30 rounded-md transition-colors duration-150 ease-in-out"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}; 