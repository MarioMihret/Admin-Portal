"use client";

import React, { useState } from 'react';
import { 
  Download, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart2, 
  FileText, 
  Filter,
  Search,
  ChevronDown,
  Printer,
  Mail,
  RefreshCw
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Import components with no SSR to avoid hydration issues
const PaymentReports = dynamic(() => import('@/components/PaymentReports'), { ssr: false });
const UserReports = dynamic(() => import('@/components/UserReports'), { ssr: false });
const EventReports = dynamic(() => import('@/components/EventReports'), { ssr: false });
const AnalyticsReports = dynamic(() => import('@/components/AnalyticsReports'), { ssr: false });

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('payments');
  
  // Handle exporting the current report
  const handleExport = () => {
    switch (activeTab) {
      case 'payments':
        // Find the PaymentReports component and trigger its export function
        const exportButton = document.querySelector('[title="Export report"]');
        if (exportButton) {
          exportButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        } else {
          alert('Payment report is still loading. Please try again in a moment.');
        }
        break;
      case 'user':
        // Placeholder for future user report export
        alert('User reports export will be implemented in a future update.');
        break;
      case 'event':
        // Find the EventReports component and trigger its export function
        const eventExportButton = document.querySelector('[title="Export report"]');
        if (eventExportButton) {
          eventExportButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        } else {
          alert('Event report is still loading. Please try again in a moment.');
        }
        break;
      case 'analytics':
        // Find the AnalyticsReports component and trigger its export function
        const analyticsExportButton = document.querySelector('[title="Export report"]');
        if (analyticsExportButton) {
          analyticsExportButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        } else {
          alert('Analytics report is still loading. Please try again in a moment.');
        }
        break;
      default:
        alert('Please select a report to export.');
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Reports
              </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'user'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Reports
            </button>
            <button
              onClick={() => setActiveTab('event')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'event'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Event Reports
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'payments' && (
        <PaymentReports />
      )}
      
      {activeTab === 'user' && (
        <UserReports />
      )}
      
      {activeTab === 'event' && (
        <EventReports />
      )}
      
      {activeTab === 'analytics' && (
        <AnalyticsReports />
      )}
    </div>
  );
} 