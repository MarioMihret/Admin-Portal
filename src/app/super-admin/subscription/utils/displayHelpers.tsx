import React from 'react'; // Ensure React is imported for React.ReactNode
import { CheckCircle, XCircle, Clock, AlertTriangle, Info } from 'lucide-react';

export const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!dateString) return 'N/A';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'short', day: 'numeric',
  };
  try {
    return new Date(dateString).toLocaleDateString('en-US', options || defaultOptions);
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Invalid Date';
  }
};

export const getStatusChipClass = (status?: string): string => {
  const s = status ? status.toLowerCase().replace('_', ' ') : ''; // Normalize: past_due -> past due
  if (s === 'active' || s === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300';
  if (s === 'trial') return 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300';
  if (s === 'pending' || s === 'past due') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300';
  if (s === 'cancelled' || s === 'inactive' || s === 'failed' || s === 'canceled') return 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400';
};

export const getStatusIcon = (status?: string): React.ReactNode => {
  const s = status ? status.toLowerCase().replace('_', ' ') : '';
  
  if (s === 'active' || s === 'paid') {
    return <CheckCircle className="h-4 w-4" />;
  } else if (s === 'trial') {
    return <Clock className="h-4 w-4" />;
  } else if (s === 'pending' || s === 'past due') {
    return <AlertTriangle className="h-4 w-4" />;
  } else if (s === 'cancelled' || s === 'inactive' || s === 'failed' || s === 'canceled') {
    return <XCircle className="h-4 w-4" />;
  } else {
    return <Info className="h-4 w-4" />;
  }
}; 