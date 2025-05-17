"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  Edit3,
  Tag,
  Check,
  X,
  Users,
  FolderKanban,
  Database,
  Settings,
  Sliders,
  Trash2
} from 'lucide-react';
import { usePlanDefinitions } from '../hooks/usePlanDefinitions';
import { IFeatureDisplay, ISubscriptionPlanFE, ILimitsDisplay } from '../types';

interface PlanFeatureValue {
  included: boolean;
  limit?: number;
}

export default function PlanManagementPage() {
  const {
    plansData,
    isLoading,
    error,
    handleTogglePlanStatus,
    refreshPlansData
  } = usePlanDefinitions();

  const [editingFeatures, setEditingFeatures] = useState<string | null>(null);
  const [editingLimits, setEditingLimits] = useState<string | null>(null);
  const [featureValues, setFeatureValues] = useState<Record<string, PlanFeatureValue>>({});
  const [limitValues, setLimitValues] = useState<Record<string, ILimitsDisplay>>({});

  const handleFeatureChange = (planId: string, featureId: string, value: PlanFeatureValue) => {
    setFeatureValues(prev => ({
      ...prev,
      [`${planId}_${featureId}`]: value
    }));
  };

  const handleLimitChange = (planId: string, field: keyof ILimitsDisplay, value: ILimitsDisplay[keyof ILimitsDisplay] | string) => {
    setLimitValues(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value
      }
    }));
  };

  const saveFeatureChanges = async (planId: string) => {
    try {
      const updatedFeatures = Object.entries(featureValues)
        .filter(([key]) => key.startsWith(`${planId}_`))
        .reduce<Record<string, PlanFeatureValue>>((acc, [key, value]) => {
          const featureId = key.split('_')[1];
          return { ...acc, [featureId]: value };
        }, {});

      await fetch(`/api/super/subscription-plans/${planId}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: updatedFeatures })
      });

      setEditingFeatures(null);
      refreshPlansData();
    } catch (error) {
      console.error('Failed to save feature changes:', error);
    }
  };

  const saveLimitChanges = async (planId: string) => {
    try {
      const updatedLimits = limitValues[planId];
      await fetch(`/api/super/subscription-plans/${planId}/limits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits: updatedLimits })
      });

      setEditingLimits(null);
      refreshPlansData();
    } catch (error) {
      console.error('Failed to save limit changes:', error);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch(`/api/super/subscription-plans/${planId}`, {
        method: 'DELETE'
      });
      refreshPlansData();
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Loading plan data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
        <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mb-6" />
        <h2 className="text-3xl font-bold text-red-700 dark:text-red-300 mb-3">An Error Occurred</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-6">
          We encountered a problem loading the plan management console.
        </p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">Details: {error}</p>
        <button
          onClick={refreshPlansData}
          className="mt-8 px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <RefreshCw className="w-5 h-5 mr-2 animate-spin-slow" /> 
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Plan Management
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
              Customize and manage subscription plans
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/super-admin/subscription/plans/new" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150">
              <PlusCircle className="w-5 h-5 mr-2" />
              New Plan
            </Link>
            <Link href="/super-admin/subscription" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plansData.map((plan) => (
            <div key={plan._id} 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border ${
                plan.isActive 
                  ? 'border-green-200 dark:border-green-800' 
                  : 'border-red-200 dark:border-red-800'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{plan.name}</h3>
                    <div className="flex items-center mt-1">
                      <Tag className="w-4 h-4 mr-2 text-gray-500" />
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{plan.slug}</code>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePlanStatus(plan)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                      >
                        {plan.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <Link href={`/super-admin/subscription/plans/edit/${plan.slug}`}>
                        <button
                          className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit Plan"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => deletePlan(plan.slug)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Features Section */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Features</h4>
                      {editingFeatures === plan._id ? (
                        <button
                          onClick={() => saveFeatureChanges(plan._id)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Save Changes
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingFeatures(plan._id)}
                          className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {plan.features?.map((feature) => (
                        <div key={feature.id} className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{feature.name}</span>
                            {feature.description && (
                              <span className="text-xs text-gray-500 dark:text-gray-500">{feature.description}</span>
                            )}
                          </div>
                          {editingFeatures === plan._id ? (
                            <div className="flex items-center space-x-2">
                              {feature.limit !== undefined && (
                                <input
                                  type="number"
                                  value={featureValues[`${plan._id}_${feature.id}`]?.limit ?? feature.limit}
                                  onChange={(e) => handleFeatureChange(plan._id, feature.id, {
                                    ...featureValues[`${plan._id}_${feature.id}`],
                                    limit: parseInt(e.target.value)
                                  })}
                                  className="w-20 px-2 py-1 text-sm border rounded"
                                />
                              )}
                              <input
                                type="checkbox"
                                checked={featureValues[`${plan._id}_${feature.id}`]?.included ?? feature.included}
                                onChange={(e) => handleFeatureChange(plan._id, feature.id, {
                                  ...featureValues[`${plan._id}_${feature.id}`],
                                  included: e.target.checked
                                })}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                            </div>
                          ) : (
                            <span className={`flex items-center ${feature.included ? 'text-green-500' : 'text-red-500'}`}>
                              {feature.included ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                              {feature.limit !== undefined && (
                                <span className="ml-2 text-xs text-gray-500">({feature.limit})</span>
                              )}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limits Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Limits</h4>
                      {editingLimits === plan._id ? (
                        <button
                          onClick={() => saveLimitChanges(plan._id)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Save Changes
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingLimits(plan._id)}
                          className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {plan.limits && Object.entries(plan.limits).map(([key, value]) => {
                        if (key === 'eventTypes') return null;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            {editingLimits === plan._id ? (
                              typeof value === 'boolean' ? (
                                <input
                                  type="checkbox"
                                  checked={limitValues[plan._id]?.[key as keyof ILimitsDisplay] as boolean ?? value}
                                  onChange={(e) => handleLimitChange(plan._id, key as keyof ILimitsDisplay, e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                              ) : typeof value === 'string' ? (
                                <select
                                  value={limitValues[plan._id]?.[key as keyof ILimitsDisplay] as string ?? value}
                                  onChange={(e) => {
                                    const newValue = key === 'analytics' 
                                      ? e.target.value as 'basic' | 'advanced' | 'premium'
                                      : key === 'support'
                                      ? e.target.value as 'email' | 'priority' | '24/7'
                                      : e.target.value;
                                    handleLimitChange(plan._id, key as keyof ILimitsDisplay, newValue);
                                  }}
                                  className="text-sm border rounded px-2 py-1"
                                >
                                  {key === 'analytics' ? (
                                    <>
                                      <option value="basic">Basic</option>
                                      <option value="advanced">Advanced</option>
                                      <option value="premium">Premium</option>
                                    </>
                                  ) : key === 'support' ? (
                                    <>
                                      <option value="email">Email</option>
                                      <option value="priority">Priority</option>
                                      <option value="24/7">24/7</option>
                                    </>
                                  ) : null}
                                </select>
                              ) : (
                                <input
                                  type="number"
                                  value={limitValues[plan._id]?.[key as keyof ILimitsDisplay] ?? value}
                                  onChange={(e) => handleLimitChange(plan._id, key as keyof ILimitsDisplay, parseInt(e.target.value))}
                                  className="w-20 px-2 py-1 text-sm border rounded"
                                />
                              )
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {typeof value === 'boolean' ? (
                                  value ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />
                                ) : (
                                  value === -1 ? 'Unlimited' : value
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Price: {plan.price === 0 ? 'Custom' : `$${plan.price}`}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Duration: {plan.durationDays} days
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 