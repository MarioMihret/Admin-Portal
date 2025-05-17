// src/app/super-admin/subscription/types.ts

// For data fetched from /api/super/subscriptions (user subscriptions)
export interface AdminUserView {
  _id: string;
  email?: string;
  name?: string;
}

export interface AdminSubscriptionView {
  _id: string;
  userId: AdminUserView | null;
  planId: string;
  status: string;
  paymentStatus: string;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  amount: number;
  currency: string;
  transactionRef?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SubscriptionAggregates {
  totalTrialSubscriptions?: number;
  estimatedMRR?: number;
  // Add other global aggregates here as needed
}

export interface SubscriptionListData {
  subscriptions: AdminSubscriptionView[];
  pagination: PaginationData;
  aggregates?: SubscriptionAggregates; // Added for global stats
}

// For data related to Subscription Plans (definitions)
export interface IFeatureDisplay {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
}

export interface ILimitsDisplay {
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxFileUploads?: number;
  maxImageSize?: number;
  maxVideoLength?: number;
  customDomain?: boolean;
  analytics?: 'basic' | 'advanced' | 'premium';
  support?: 'email' | 'priority' | '24/7';
  eventTypes?: string[];
}

export interface IMetadataDisplay {
  isPopular?: boolean;
  isTrial?: boolean;
  isEnterpriseFlag?: boolean;
}

export interface ISubscriptionPlanFE { // For Frontend display of Plan Definitions
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  durationDays: number;
  features: IFeatureDisplay[];
  limits?: ILimitsDisplay;
  isActive: boolean;
  displayOrder?: number;
  metadata?: IMetadataDisplay;
  createdAt?: string;
  updatedAt?: string;
} 