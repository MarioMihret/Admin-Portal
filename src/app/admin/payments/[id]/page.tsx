"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  DollarSign, 
  User, 
  Clock, 
  CreditCard, 
  FileText, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Interfaces
interface Payment {
  _id: string;
  tx_ref: string;
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'pending' | 'success' | 'failed';
  payment_date: string;
  callback_response?: any;
}

// Status styling
const statusStyles = {
  success: {
    background: 'bg-green-100',
    text: 'text-green-800',
    icon: CheckCircle,
    border: 'border-green-200'
  },
  pending: {
    background: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: Clock,
    border: 'border-yellow-200'
  },
  failed: {
    background: 'bg-red-100',
    text: 'text-red-800',
    icon: AlertCircle,
    border: 'border-red-200'
  }
};

export default function PaymentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Fetch payment details from the API
  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const paymentId = Array.isArray(id) ? id[0] : id;
      
      // Make the API request
      const response = await fetch(`/api/payments/${paymentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment not found');
        }
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setPayment(data.payment);
    } catch (error: any) {
      console.error('Error fetching payment:', error);
      setError(error.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPaymentDetails();
  }, [id]);

  // Handle payment actions (approve or retry)
  const handlePaymentAction = async (action: 'approve' | 'retry') => {
    if (!payment) return;
    
    setActionLoading(true);
    try {
      const newStatus = action === 'approve' ? 'success' : 'pending';
      
      // Update the payment status
      const response = await fetch(`/api/payments/${payment._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} payment`);
      }
      
      const data = await response.json();
      
      // Update the local state with the updated payment
      setPayment(data.payment);
      
      // Show success message
      alert(`Payment successfully ${action === 'approve' ? 'approved' : 'retried'}`);
      
    } catch (error: any) {
      console.error(`Error ${action}ing payment:`, error);
      alert(error.message || `Failed to ${action} payment. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Download receipt handler
  const handleDownloadReceipt = () => {
    // In a real application, you would call an API endpoint that returns a PDF
    alert('Receipt download functionality would be implemented in a production environment.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Loading payment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to payments
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-red-800 mb-2">Payment Not Found</h2>
          <p className="text-red-700">{error}</p>
          <Link href="/admin/payments" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to payments list
          </Link>
        </div>
      </div>
    );
  }

  if (!payment) {
    return null;
  }

  // Use fallback for unknown status
  const StatusIcon = statusStyles[payment.status]?.icon || AlertCircle;
  const statusStyle = statusStyles[payment.status] || {
    background: 'bg-gray-100',
    text: 'text-gray-800',
    icon: AlertCircle,
    border: 'border-gray-200'
  };

  return (
    <div className="space-y-6">
      {/* Header with back button and status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to payments
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Payment #{payment.tx_ref}
          </h1>
        </div>
        
        <div className={`px-4 py-2 rounded-lg ${statusStyle.background} ${statusStyle.text} flex items-center`}>
          <StatusIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">
            {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment details card */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6 md:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            Payment Details
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-xl font-semibold text-gray-900">
                ${payment.amount ? payment.amount.toFixed(2) : '0.00'} {payment.currency || 'USD'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(payment.payment_date || '')}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Transaction Reference</p>
              <p className="text-sm font-medium text-gray-900">{payment.tx_ref || 'N/A'}</p>
              <p className="text-xs text-gray-500">MongoDB ID: {payment._id || 'Unknown'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="text-sm font-medium text-gray-900">{payment.currency || 'USD'}</p>
            </div>
          </div>
          
          {payment.callback_response && (
            <div className="mt-6 pt-6 border-t border-blue-100">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Callback Response
              </h3>
              
              <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">
                  {typeof payment.callback_response === 'string' 
                    ? payment.callback_response
                    : JSON.stringify(payment.callback_response, null, 2)
                  }
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Customer info card */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Customer Information
          </h2>
          
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {payment.first_name ? payment.first_name.charAt(0) : '?'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {payment.first_name || 'Unknown'} {payment.last_name || ''}
              </p>
              <p className="text-xs text-gray-500">{payment.email || 'No email provided'}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-100">
            <p className="text-sm text-gray-500">Customer ID</p>
            <p className="text-sm font-medium text-gray-900">{payment._id}</p>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-blue-100 rounded-lg bg-white text-sm font-medium text-gray-500 cursor-not-allowed"
              disabled
              title="User profile linking is not available for this customer ID format"
            >
              <User className="h-5 w-5 mr-2" />
              View customer profile
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Note: External payment customer IDs cannot be directly linked to user profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 mt-6">
        <button
          type="button"
          onClick={handleDownloadReceipt}
          className="inline-flex items-center px-4 py-2 border border-blue-100 rounded-lg bg-white text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FileText className="h-5 w-5 mr-2" />
          Download Receipt
        </button>
        
        {payment.status === 'pending' && (
          <button
            type="button"
            onClick={() => handlePaymentAction('approve')}
            disabled={actionLoading}
            className={`inline-flex items-center px-4 py-2 border border-green-500 rounded-lg bg-green-500 text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              actionLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {actionLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve Payment
              </>
            )}
          </button>
        )}
        
        {payment.status === 'failed' && (
          <button
            type="button"
            onClick={() => handlePaymentAction('retry')}
            disabled={actionLoading}
            className={`inline-flex items-center px-4 py-2 border border-blue-500 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              actionLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {actionLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Retry Payment
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
} 