import React from 'react';
import { MoreVertical, AlertCircle } from 'lucide-react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string;
  // Add props for chart interactions later (e.g., onMoreClick)
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, isLoading, error }) => {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        {/* Implement dropdown menu later */}
        <button className="p-1 rounded-full hover:bg-gray-100" disabled={isLoading || !!error}>
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="h-80 relative"> {/* Ensure parent has height for ResponsiveContainer */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-red-600 bg-red-50/50 rounded-lg p-4">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">Could not load chart data</p>
            <p className="text-xs mt-1">{error}</p>
            {/* Add retry button later */}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard; 