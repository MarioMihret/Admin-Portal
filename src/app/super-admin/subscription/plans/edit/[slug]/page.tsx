'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ISubscriptionPlan } from '@/models/SubscriptionPlan'; // Assuming this path is correct
import { 
    SubscriptionPlanPayload, 
    subscriptionPlanPayloadSchema, 
    featureEntrySchema 
} from '@/schemas/subscriptionPlanSchemas'; 
import { z } from 'zod';

// Helper function to fetch a single plan (adapt from existing API services if available)
async function getPlan(slug: string): Promise<ISubscriptionPlan | null> {
  const res = await fetch(`/api/super/subscription-plans/${slug}`);
  if (!res.ok) {
    // throw new Error(`Failed to fetch plan: ${res.statusText}`);
    console.error(`Failed to fetch plan: ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  return data.plan;
}

// Helper function to update a plan (adapt from existing API services if available)
async function updatePlan(slug: string, payload: SubscriptionPlanPayload): Promise<ISubscriptionPlan> {
  const res = await fetch(`/api/super/subscription-plans/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || `Failed to update plan: ${res.statusText}`);
  }
  const data = await res.json();
  return data.plan;
}

interface FeatureEntryClient extends z.infer<typeof featureEntrySchema> {
  _key?: string; 
}
interface FormDataClient extends Omit<SubscriptionPlanPayload, 'features'> {
  features?: FeatureEntryClient[];
}

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [plan, setPlan] = useState<ISubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<Partial<FormDataClient>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<z.ZodFormattedError<SubscriptionPlanPayload> | null>(null);

  useEffect(() => {
    if (slug) {
      getPlan(slug)
        .then((data) => {
          if (data) {
            setPlan(data);
            // CORRECTED: Rely on f.id for feature identifier, _key for React keys
            const initialFeatures: FeatureEntryClient[] = data.features?.map((f, idx) => ({ 
                ...f, 
                id: f.id || '', // IFeature.id is the source of truth for the feature's actual ID
                _key: f.id || `new-feature-key-${idx}-${Date.now()}` // React key can use existing id or generate one
              })) || [] as FeatureEntryClient[];

            const initialFormData: Partial<FormDataClient> = {
              name: data.name || '',
              slug: data.slug || '',
              description: data.description || '',
              price: data.price === undefined ? 0 : Number(data.price),
              durationDays: data.durationDays === undefined ? 0 : Number(data.durationDays),
              features: initialFeatures,
              limits: data.limits || {},
              isActive: data.isActive === undefined ? true : data.isActive,
              displayOrder: data.displayOrder === undefined ? 0 : Number(data.displayOrder),
              metadata: data.metadata || {},
            };
            setFormData(initialFormData);
          } else {
            setError('Plan not found.');
          }
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || 'Failed to load plan details.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('limits.')) {
      const limitKey = name.split('.')[1] as keyof NonNullable<SubscriptionPlanPayload['limits']>; 
      setFormData(prev => ({
        ...prev,
        limits: {
          ...prev?.limits,
          [limitKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                      type === 'number' ? parseFloat(value) : value,
        },
      }));
    } else if (name.startsWith('metadata.')) {
      const metadataKey = name.split('.')[1] as keyof NonNullable<SubscriptionPlanPayload['metadata']>; 
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev?.metadata,
          [metadataKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' && value !== '' ? parseFloat(value) : (type === 'number' && value === '' ? undefined : value),
      }));
    }
  };
  
  const handleFeatureChange = (index: number, field: keyof FeatureEntryClient, value: string | boolean | undefined) => {
    setFormData(prev => {
        const updatedFeatures = [...(prev?.features || [])] as FeatureEntryClient[];
        if (updatedFeatures[index]) {
            (updatedFeatures[index] as any)[field] = value;
        }
        return { ...prev, features: updatedFeatures };
    });
  };

  const addNewFeature = () => {
    setFormData(prev => ({
        ...prev,
        features: [
            ...(prev?.features || [] as FeatureEntryClient[]),
            { id: '', name: '', description: '', included: false, _key: `new-key-${Date.now()}` } as FeatureEntryClient
        ]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
        ...prev,
        features: (prev?.features || [] as FeatureEntryClient[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors(null); 
    if (!plan || !formData) return;

    const processedFeatures = formData.features?.map(f => {
        const {_key, ...rest} = f as FeatureEntryClient; 
        return rest;
    }) || [] as z.infer<typeof featureEntrySchema>[];

    const fullFormData: SubscriptionPlanPayload = {
        name: formData.name || '',
        slug: formData.slug || slug, 
        description: formData.description || '',
        price: Number(formData.price || 0),
        durationDays: Number(formData.durationDays || 0),
        features: processedFeatures,
        limits: formData.limits || {},
        isActive: typeof formData.isActive === 'boolean' ? formData.isActive : true,
        displayOrder: Number(formData.displayOrder || 0),
        metadata: formData.metadata || {},
    };

    const validationResult = subscriptionPlanPayloadSchema.safeParse(fullFormData);
    if (!validationResult.success) {
      setFormErrors(validationResult.error.format());
      setError("Validation failed. Please check the form.");
      return;
    }

    setIsLoading(true);
    try {
      await updatePlan(params.slug as string, validationResult.data);
      alert('Plan updated successfully!');
      
      if (validationResult.data.slug && params.slug !== validationResult.data.slug) {
        router.replace(`/super-admin/subscription/plans/edit/${validationResult.data.slug}`);
      } else {
        getPlan(params.slug as string).then(updatedPlan => {
            if (updatedPlan) {
                setPlan(updatedPlan);
                // CORRECTED: Rely on f.id for feature identifier, _key for React keys in refresh
                const refreshedFeatures: FeatureEntryClient[] = updatedPlan.features?.map((f, idx) => ({ 
                    ...f, 
                    id: f.id || '',
                    _key: f.id || `refreshed-key-${idx}-${Date.now()}` 
                  })) || [] as FeatureEntryClient[];
                setFormData({
                  name: updatedPlan.name || '',
                  slug: updatedPlan.slug || '',
                  description: updatedPlan.description || '',
                  price: Number(updatedPlan.price || 0),
                  durationDays: Number(updatedPlan.durationDays || 0),
                  features: refreshedFeatures,
                  limits: updatedPlan.limits || {},
                  isActive: typeof updatedPlan.isActive === 'boolean' ? updatedPlan.isActive : true,
                  displayOrder: Number(updatedPlan.displayOrder || 0),
                  metadata: updatedPlan.metadata || {},
              });
            }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update plan.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !plan) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 text-center">
        {/* Consider adding a spinner icon here if you have one e.g. from lucide-react */}
        <p className="text-lg font-medium text-gray-700">Loading plan details...</p>
      </div>
    </div>
  );

  if (error && !plan && !formErrors) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-lg text-center">
        {/* Consider adding an error icon here */}
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Plan</h2>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go Back
        </button>
      </div>
    </div>
  );
  
  if (!plan && !isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-lg text-center">
         {/* Consider adding a not-found icon here */}
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Plan Not Found</h2>
        <p className="text-gray-600">The requested plan could not be found.</p>
        <button 
          onClick={() => router.push('/super-admin/subscription/plans')} 
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Plans List
        </button>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Edit Plan: <span className="text-indigo-600">{plan?.name || slug}</span>
            </h1>
            <p className="text-sm text-gray-500">Manage the details of this subscription plan.</p>
          </div>
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        </div>

        {/* Global Messages */}
        {error && !formErrors && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                {/* Add AlertTriangle icon from lucide-react if available */}
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.22 3.008-1.742 3.008H4.42c-1.522 0-2.492-1.678-1.743-3.008l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-5.5a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700">Operation Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        {formErrors && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                 {/* Add AlertTriangle icon from lucide-react if available */}
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.22 3.008-1.742 3.008H4.42c-1.522 0-2.492-1.678-1.743-3.008l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-5.5a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Validation Errors</p>
                <p className="text-sm text-yellow-700 mt-1">Please review the highlighted fields below and correct any errors.</p>
              </div>
            </div>
          </div>
        )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* General Information Section */}
        <div className="bg-white shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">General Information</h2>
          <p className="text-sm text-gray-500 mb-6">Basic details of the subscription plan.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" 
                placeholder="e.g., Basic, Pro, Enterprise"
              />
              {formErrors?.name?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{formErrors.name._errors[0]}</p>}
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <input 
                type="text" 
                name="slug" 
                id="slug" 
                value={formData.slug || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 bg-gray-50" 
                placeholder="e.g., basic-plan, pro-plan (auto-generates if empty)"
              />
              {formErrors?.slug?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{formErrors.slug._errors[0]}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              name="description" 
              id="description" 
              value={formData.description || ''} 
              onChange={handleChange} 
              rows={3} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" 
              placeholder="A brief summary of what this plan offers."
            ></textarea>
            {formErrors?.description?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{formErrors.description._errors[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input 
                type="number" 
                name="price" 
                id="price" 
                value={formData.price === undefined ? '' : formData.price} 
                onChange={handleChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" 
                placeholder="e.g., 0, 19.99, 99"
                step="0.01"
              />
              {formErrors?.price?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{formErrors.price._errors[0]}</p>}
            </div>
            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
              <input 
                type="number" 
                name="durationDays" 
                id="durationDays" 
                value={formData.durationDays === undefined ? '' : formData.durationDays} 
                onChange={handleChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" 
                placeholder="e.g., 30, 90, 365 (0 for lifetime)"
              />
              {formErrors?.durationDays?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{formErrors.durationDays._errors[0]}</p>}
            </div>
            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input 
                type="number" 
                name="displayOrder" 
                id="displayOrder" 
                value={formData.displayOrder === undefined ? '' : formData.displayOrder} 
                onChange={handleChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" 
                placeholder="Lower numbers appear first"
              />
              {formErrors?.displayOrder?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{formErrors.displayOrder._errors[0]}</p>}
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
             <div className="relative flex items-start">
                <div className="flex h-5 items-center">
                    <input 
                        type="checkbox" 
                        name="isActive" 
                        id="isActive" 
                        checked={formData.isActive === undefined ? true : formData.isActive} // Default to true if undefined
                        onChange={handleChange} 
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="isActive" className="font-medium text-gray-700">Active Plan</label>
                    <p className="text-gray-500">Inactive plans will not be available for new subscriptions.</p>
                </div>
             </div>
            {formErrors?.isActive?._errors?.[0] && <p className="text-xs text-red-600 mt-1 ml-8 animate-pulse">{formErrors.isActive._errors[0]}</p>}
          </div>
        </div>

        {/* Features Section - Placeholder for now, will be styled in next step */}
        <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-1">Features</h2>
            <p className="text-sm text-gray-500 mb-6">Define the features included in this plan. Each feature must have a unique ID.</p>
            
            <div className="space-y-6">
              {(formData.features || []).map((feature, index) => {
                  const featureErrors = formErrors?.features?.[index];
                  return (
                      <div key={(feature as FeatureEntryClient)._key || feature.id || `feature-item-${index}`} className="p-5 border border-gray-200 rounded-lg shadow-sm bg-white">
                          <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-medium text-indigo-600">
                                  Feature {index + 1}{feature.name ? `: ${feature.name}` : ''}
                              </h3>
                              <button 
                                  type="button" 
                                  onClick={() => removeFeature(index)} 
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                  title="Remove Feature"
                              >
                                  {/* Replace with Lucide Trash2 icon if available */}
                                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                              </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                              <div>
                                  <label htmlFor={`feature-${index}-id`} className="block text-sm font-medium text-gray-700 mb-1">Feature ID</label>
                                  <input 
                                      type="text" 
                                      id={`feature-${index}-id`}
                                      value={feature.id || ''} // Ensure value is not null/undefined for controlled input
                                      onChange={(e) => handleFeatureChange(index, 'id', e.target.value)} 
                                      placeholder="unique-feature-identifier"
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                  />
                                  {featureErrors?.id?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{featureErrors.id._errors[0]}</p>}
                              </div>
                              <div>
                                  <label htmlFor={`feature-${index}-name`} className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                  <input 
                                      type="text" 
                                      id={`feature-${index}-name`}
                                      value={feature.name || ''} // Ensure value is not null/undefined
                                      onChange={(e) => handleFeatureChange(index, 'name', e.target.value)} 
                                      placeholder="Feature Display Name"
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                  />
                                  {featureErrors?.name?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{featureErrors.name._errors[0]}</p>}
                              </div>
                              <div className="md:col-span-2">
                                  <label htmlFor={`feature-${index}-description`} className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                  <textarea 
                                      id={`feature-${index}-description`}
                                      value={feature.description || ''}
                                      onChange={(e) => handleFeatureChange(index, 'description', e.target.value)} 
                                      rows={2}
                                      placeholder="Briefly describe this feature"
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                  ></textarea>
                                  {featureErrors?.description?._errors?.[0] && <p className="text-xs text-red-600 mt-1 animate-pulse">{featureErrors.description._errors[0]}</p>}
                              </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="relative flex items-start">
                               <div className="flex h-5 items-center">
                                  <input 
                                      type="checkbox" 
                                      id={`feature-${index}-included`}
                                      checked={!!feature.included} 
                                      onChange={(e) => handleFeatureChange(index, 'included', e.target.checked)} 
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor={`feature-${index}-included`} className="font-medium text-gray-700">
                                        Included in this plan
                                    </label>
                                    <p className="text-gray-500">Check if this feature is active for this plan by default.</p>
                                </div>
                            </div>
                          </div>
                          {featureErrors?._errors?.map((err, i) => <p key={`feat-obj-err-${i}-${index}`} className="text-xs text-red-600 mt-2">{err}</p>)}
                      </div>
                  );
              })}
            </div>

            {(!formData.features || formData.features.length === 0) && (
                <div className="text-center py-6 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                    {/* Add Icon here if available e.g. ListPlus from lucide-react */}
                     <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No features added</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding the first feature to this plan.</p>
                </div>
            )}

            <div className="mt-6 flex justify-start">
                <button 
                    type="button" 
                    onClick={addNewFeature} 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    {/* Add PlusCircleIcon from lucide-react if available */}
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Add New Feature
                </button>
            </div>
            {formErrors?.features?._errors?.map((err, i) => <p key={`features-arr-err-${i}`} className="text-xs text-red-600 mt-2">{err}</p>)}
        </div>
        
        {/* Limits Section - Placeholder for now */}
        <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-1">Limits</h2>
            <p className="text-sm text-gray-500 mb-6">Configure usage limits for this plan.</p>
            {/* Current limits rendering - will be restyled */}
            <div>
                <label htmlFor="limits.maxEvents" className="block text-sm font-medium text-gray-700">Max Events (-1 for unlimited)</label>
                <input type="number" name="limits.maxEvents" id="limits.maxEvents" value={formData.limits?.maxEvents === undefined ? '' : formData.limits.maxEvents} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                {formErrors?.limits?.maxEvents?._errors?.[0] && <p className="text-xs text-red-500 mt-1">{formErrors.limits.maxEvents._errors[0]}</p>}
            </div>
            {/* ... other limit fields will be here ... */}
            <div className="mt-2">
                <label htmlFor="limits.customDomain" className="flex items-center">
                    <input type="checkbox" name="limits.customDomain" id="limits.customDomain" checked={formData.limits?.customDomain || false} onChange={handleChange} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-gray-700">Custom Domain</span>
                </label>
                {formErrors?.limits?.customDomain?._errors?.[0] && <p className="text-xs text-red-500 mt-1">{formErrors.limits.customDomain._errors[0]}</p>}
            </div>
             <div>
                <label htmlFor="limits.eventTypes" className="block text-sm font-medium text-gray-700">Allowed Event Types (comma-separated)</label>
                <input type="text" name="limits.eventTypes" id="limits.eventTypes" value={(formData.limits?.eventTypes || []).join(', ')} onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({...prev, limits: {...prev?.limits, eventTypes: value.split(',').map(s => s.trim()).filter(s => s)} }));
                }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                 {formErrors?.limits?.eventTypes?._errors?.[0] && <p className="text-xs text-red-500 mt-1">{formErrors.limits.eventTypes._errors[0]}</p>}
            </div>
            {formErrors?.limits?._errors?.map((err, i) => <p key={i} className="text-xs text-red-500 mt-1">{err}</p>)}
        </div>

        {/* Metadata Section - Placeholder for now */}
        <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-1">Metadata</h2>
            <p className="text-sm text-gray-500 mb-6">Additional settings and classifications for the plan.</p>
            {/* Current metadata rendering - will be restyled */}
             <div className="mt-2">
                <label htmlFor="metadata.isPopular" className="flex items-center">
                    <input type="checkbox" name="metadata.isPopular" id="metadata.isPopular" checked={formData.metadata?.isPopular || false} onChange={handleChange} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-gray-700">Is Popular</span>
                </label>
                {formErrors?.metadata?.isPopular?._errors?.[0] && <p className="text-xs text-red-500 mt-1">{formErrors.metadata.isPopular._errors[0]}</p>}
            </div>
             {/* ... other metadata fields ... */}
            {formErrors?.metadata?._errors?.map((err, i) => <p key={i} className="text-xs text-red-500 mt-1">{err}</p>)}
        </div>

        {/* Action Buttons */}
        <div className="pt-5 mt-8 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </div>
      </form>
    </div>
    </div>
  );
} 