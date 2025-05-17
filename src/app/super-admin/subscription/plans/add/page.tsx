'use client';

import React from 'react';
import PlanForm, { PlanFormValues } from '../components/PlanForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const AddPlanPage: React.FC = () => {
  const router = useRouter();

  const handleSubmit = async (values: PlanFormValues) => {
    // TODO: Implement API call to create plan
    console.log('Form submitted:', values);
    try {
      // Simulate API call
      const response = await fetch('/api/super/subscription-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create plan');
      }

      toast.success('Subscription plan created successfully!');
      router.push('/super-admin/plans'); // Redirect to plans list
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/super-admin/plans" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">Add New Subscription Plan</h1>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <PlanForm onSubmit={handleSubmit} submitButtonText="Create Plan" />
        </div>
      </div>
    </div>
  );
};

export default AddPlanPage; 