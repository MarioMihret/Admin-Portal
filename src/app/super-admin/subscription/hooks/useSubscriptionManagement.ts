import { useState, useCallback, useEffect } from 'react';
import { SubscriptionListData } from '../types';
import { fetchSubscriptionListData } from '../api';
import { toast } from 'sonner';

export interface SubscriptionFilters {
  planId: string;
  status: string;
  paymentStatus: string;
  search?: string;
  // Add other potential filters here e.g., userId, email
}

export const useSubscriptionManagement = (initialItemsPerPage: number = 10) => {
  const [data, setData] = useState<SubscriptionListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  
  const [filters, setFilters] = useState<SubscriptionFilters>({
    planId: '',
    status: '',
    paymentStatus: '',
    search: '',
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const loadSubscriptionData = useCallback(async (page = 1, limit = itemsPerPage, currentFilters: SubscriptionFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSubscriptionListData(page, limit, currentFilters as unknown as Record<string, string>);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching subscription details.';
      setError(errorMessage);
      toast.error(errorMessage);
      setData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    loadSubscriptionData(currentPage, itemsPerPage, filters);
  }, [loadSubscriptionData, currentPage, itemsPerPage, filters]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.pagination.pages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (newFilters: Partial<SubscriptionFilters>) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };
  
  const clearFilters = () => {
    setFilters({ planId: '', status: '', paymentStatus: '', search: '' });
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const refreshData = () => {
    loadSubscriptionData(currentPage, itemsPerPage, filters);
  };

  return {
    data,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filters,
    activeFiltersCount,
    handlePageChange,
    handleFilterChange,
    clearFilters,
    refreshData,
  };
}; 