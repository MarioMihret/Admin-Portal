import mongoose, { Schema, Document, models, Model } from 'mongoose';

// New interface for individual features within a plan
export interface IFeature {
  id: string; // e.g., 'events', 'attendees'
  name: string; // e.g., 'Create Events'
  description?: string; // e.g., 'Create and manage multiple events'
  included: boolean; // Is this feature included in the plan?
}

// New interface for plan limits
export interface ILimits {
  maxEvents?: number; // -1 for infinity
  maxAttendeesPerEvent?: number; // -1 for infinity
  maxFileUploads?: number; // -1 for infinity
  maxImageSize?: number; // In MB, -1 for infinity
  maxVideoLength?: number; // In minutes, -1 for infinity
  customDomain?: boolean;
  analytics?: 'basic' | 'advanced' | 'premium';
  support?: 'email' | 'priority' | '24/7';
  eventTypes?: string[]; // List of allowed event types
}

// New interface for metadata
export interface IMetadata {
  isPopular?: boolean;
  isTrial?: boolean;
  isEnterpriseFlag?: boolean; // To differentiate from a plan named 'enterprise' if needed
  // Add other potential metadata like highlightColor, etc.
}

export interface ISubscriptionPlan extends Document {
  name: string; // e.g., "Basic Plan"
  slug: string; // Unique identifier for the plan (e.g., 'basic'), was planId in example
  description?: string;
  price: number; // Changed back to number
  durationDays: number; // e.g., 30, 365. Replaces string duration.
  features: IFeature[]; // Array of feature objects
  limits?: ILimits; // Object containing various limits
  isActive: boolean; // To allow soft-deleting or deactivating plans
  displayOrder?: number; // ADDED
  metadata?: IMetadata; // ADDED (replaces top-level isPopular, isTrial, isEnterprise)
  createdAt?: Date;
  updatedAt?: Date;
}

const FeatureSchema = new Schema<IFeature>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  included: { type: Boolean, required: true, default: false },
}, { _id: false });

const LimitsSchema = new Schema<ILimits>({
  maxEvents: { type: Number, default: -1 },
  maxAttendeesPerEvent: { type: Number, default: -1 },
  maxFileUploads: { type: Number, default: -1 },
  maxImageSize: { type: Number, default: -1 }, // Assuming MB
  maxVideoLength: { type: Number, default: -1 }, // Assuming minutes
  customDomain: { type: Boolean, default: false },
  analytics: { type: String, enum: ['basic', 'advanced', 'premium'], default: 'basic' },
  support: { type: String, enum: ['email', 'priority', '24/7'], default: 'email' },
  eventTypes: [{ type: String }],
}, { _id: false });

// New schema for metadata
const MetadataSchema = new Schema<IMetadata>({
  isPopular: { type: Boolean, default: false },
  isTrial: { type: Boolean, default: false },
  isEnterpriseFlag: { type: Boolean, default: false },
}, { _id: false });

const SubscriptionPlanSchema: Schema<ISubscriptionPlan> = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true }, // unique:true creates an index
  description: { type: String },
  price: { type: Number, required: true, min: 0 }, // Back to Number
  durationDays: { type: Number, required: true, min: 0 }, // ADDED
  features: [FeatureSchema], // Using the new FeatureSchema
  limits: { type: LimitsSchema, default: () => ({}) }, // Using the new LimitsSchema
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }, // ADDED with a default
  metadata: { type: MetadataSchema, default: () => ({}) }, // ADDED with a default
}, {
  timestamps: true,
  collection: 'planDefinitions'
});

SubscriptionPlanSchema.index({ isActive: 1 });
SubscriptionPlanSchema.index({ displayOrder: 1 }); // Index for sorting by displayOrder

export const SubscriptionPlan = 
  (models.SubscriptionPlan as Model<ISubscriptionPlan, {}, {}, {}>) || 
  mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema); 