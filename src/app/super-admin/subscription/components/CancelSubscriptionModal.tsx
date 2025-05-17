'use client';

import React from 'react';
import { XIcon, AlertTriangle } from 'lucide-react'; // Using XIcon for close, correct if it's just X
import { AdminSubscriptionView } from '../types';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subscription: AdminSubscriptionView | null;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subscription
}) => {
  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <AlertTriangle className="text-red-500 dark:text-red-400 mr-3 h-7 w-7" />
            Confirm Cancellation
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full p-1"
            aria-label="Close modal"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 space-y-3 text-gray-600 dark:text-gray-300">
          <p>Are you sure you want to cancel the subscription for:</p>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="font-medium text-gray-800 dark:text-gray-100">
              User: <span className="font-normal">{subscription.userId?.name || subscription.userId?.email || subscription.userId?._id || 'N/A'}</span>
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-100">
              Plan ID: <span className="font-normal">{subscription.planId}</span>
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-100">
              Status: <span className="font-normal capitalize">{subscription.status.replace('_', ' ')}</span>
            </p>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">
            This action will update the subscription status to 'cancelled'. This may be irreversible.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors shadow-sm"
          >
            No, Keep It
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Yes, Cancel Subscription
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes modalShowKeyframes {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modalShow {
          animation: modalShowKeyframes 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}; 