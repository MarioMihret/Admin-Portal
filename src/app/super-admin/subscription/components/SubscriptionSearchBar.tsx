'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SubscriptionSearchBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  placeholder?: string;
}

export const SubscriptionSearchBar: React.FC<SubscriptionSearchBarProps> = ({
  searchTerm,
  onSearchTermChange,
  placeholder = "Search subscriptions..."
}) => {
  return (
    <div className="relative flex-1 w-full md:w-auto">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm transition-colors duration-150 ease-in-out"
      />
    </div>
  );
}; 