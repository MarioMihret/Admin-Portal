// src/app/super-admin/subscription/api.ts
import { 
  SubscriptionListData, 
  ISubscriptionPlanFE, 
  AdminSubscriptionView
} from './types'; // Import types from the local types file

// API interaction function for Subscription List
export const fetchSubscriptionListData = async (
  page: number = 1, 
  limit: number = 10, 
  filters: Record<string, string | number | boolean | undefined | null> = {}
): Promise<SubscriptionListData> => {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') { // Check for actual value and ensure it's not empty string
      queryParams.append(key, String(value)); // Explicitly convert value to string
    }
  });
  const response = await fetch(`/api/super/subscriptions?${queryParams.toString()}`, { cache: 'no-store' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
    throw new Error(errorData.message || `Failed to fetch subscriptions: ${response.statusText}`);
  }
  return response.json();
};

// API interaction functions for Plans (definitions)
export const fetchPlansData = async (): Promise<ISubscriptionPlanFE[]> => {
  const response = await fetch('/api/super/subscription-plans');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch subscription plans');
  }
  const data = await response.json();
  return data.plans || [];
};

export const fetchSubscriptionById = async (subscriptionId: string): Promise<AdminSubscriptionView> => {
  const response = await fetch(`/api/super/subscriptions?id=${subscriptionId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch subscription details for ID: ${subscriptionId}`);
  }
  const data = await response.json();
  // Assuming the API returns the subscription object directly or under a specific key like 'subscription'
  // Adjust if your API nests it, e.g., data.subscription
  return data.subscription || data; 
};

export const updateSubscriptionStatus = async (subscriptionId: string, status: string): Promise<AdminSubscriptionView> => {
  const response = await fetch(`/api/super/subscriptions/${subscriptionId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update subscription status to ${status}`);
  }
  const data = await response.json();
  return data.subscription; // Assuming the API returns the updated subscription object under a 'subscription' key
};

export const togglePlanStatusOnPage = async (planId: string, currentStatus: boolean): Promise<ISubscriptionPlanFE> => {
  let response;
  if (currentStatus) {
    response = await fetch(`/api/super/subscription-plans/${planId}`, { method: 'DELETE' });
  } else {
    const planResponse = await fetch(`/api/super/subscription-plans/${planId}`);
    if(!planResponse.ok) throw new Error('Failed to fetch plan details before activation.');
    const planData = await planResponse.json();
    
    if (!planData.plan) throw new Error('Invalid plan data received');
    
    // Extract only the fields we need for the update
    const {
      name,
      slug,
      description,
      price,
      durationDays,
      features,
      limits,
      displayOrder,
      metadata
    } = planData.plan;

    const updatedPlanPayload = {
      name,
      slug,
      description,
      price,
      durationDays,
      features,
      limits,
      displayOrder,
      metadata,
      isActive: true
    };

    response = await fetch(`/api/super/subscription-plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlanPayload),
    });
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to ${currentStatus ? 'deactivate' : 'activate'} plan`);
  }
  const data = await response.json();
  return data.plan;
};

// Function to update a user's subscription (NEW - for PUT /api/super/subscriptions)
export interface UpdateSubscriptionPayload {
  status?: string;
  paymentStatus?: string;
  endDate?: string; // ISO string
  planId?: string;
}
export const updateUserSubscription = async (subscriptionId: string, payload: UpdateSubscriptionPayload): Promise<{ message: string; subscription: AdminSubscriptionView }> => {
  const response = await fetch(`/api/super/subscriptions?id=${subscriptionId}`, { // Pass ID as query param
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update subscription' }));
    throw new Error(errorData.message);
  }
  return response.json();
};

// Function to cancel/delete a user's subscription (NEW - for DELETE /api/super/subscriptions)
export const cancelUserSubscription = async (subscriptionId: string): Promise<{ message: string; subscription: AdminSubscriptionView }> => {
  const response = await fetch(`/api/super/subscriptions?id=${subscriptionId}`, { // Pass ID as query param
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to cancel subscription'}));
    throw new Error(errorData.message);
  }
  return response.json();
}; 