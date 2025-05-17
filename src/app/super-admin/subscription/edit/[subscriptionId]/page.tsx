'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Save, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { AdminSubscriptionView } from '../../types'; // Corrected path
import { fetchSubscriptionById, updateUserSubscription, UpdateSubscriptionPayload } from '../../api'; // Corrected path

// Define the structure of your form data
interface SubscriptionEditFormData {
  status: string;
  paymentStatus: string;
  endDate: string; // Store as YYYY-MM-DD for input type='date'
  // Add other fields you want to edit, e.g., planId
}

export default function EditSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.subscriptionId as string;

  const [subscription, setSubscription] = useState<AdminSubscriptionView | null>(null);
  const [formData, setFormData] = useState<SubscriptionEditFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subscriptionId) {
      const loadSubscription = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await fetchSubscriptionById(subscriptionId);
          setSubscription(data);
          // Initialize form data from fetched subscription
          setFormData({
            status: data.status || '',
            paymentStatus: data.paymentStatus || '',
            endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription details.';
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
      loadSubscription();
    }
  }, [subscriptionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData || !subscription) return;

    setIsSaving(true);
    setError(null);

    const payload: UpdateSubscriptionPayload = {
      status: formData.status,
      paymentStatus: formData.paymentStatus,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };

    try {
      await updateUserSubscription(subscriptionId, payload);
      toast.success('Subscription updated successfully!');
      router.push('/super-admin/subscription'); // Redirect back to the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Loading subscription details...</p>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
        <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold text-red-700 dark:text-red-300 mb-3">Error Loading Subscription</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-6">{error}</p>
        <Link href="/super-admin/subscription"
          className="mt-8 px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Subscriptions
        </Link>
      </div>
    );
  }
  
  if (!formData) { // Should not happen if loading is false and no error, but good for safety
      return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Form data not available.</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/super-admin/subscription" 
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Subscriptions
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Edit Subscription
          </h1>
          {subscription && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: {subscription._id}</p>}
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-700/20 border border-red-200 dark:border-red-600/30 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription Status</label>
            <select 
              id="status" 
              name="status" 
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-150 ease-in-out"
            >
              {/* Consider fetching these from a central place or defining them more robustly */}
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="pending">Pending</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="inactive">Inactive</option>
              <option value="failed">Failed</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
            <select 
              id="paymentStatus" 
              name="paymentStatus" 
              value={formData.paymentStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-150 ease-in-out"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              name="endDate" 
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-150 ease-in-out"
            />
          </div>
          
          {/* Add more fields as needed, e.g., planId selection */}

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <Link href="/super-admin/subscription"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors shadow-sm"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSaving || isLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 