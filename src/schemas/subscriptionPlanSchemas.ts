import { z } from 'zod';

// Zod schema for individual features
export const featureEntrySchema = z.object({
  id: z.string().min(1, 'Feature ID is required'),
  name: z.string().min(1, 'Feature name is required'),
  description: z.string().optional(),
  included: z.boolean().default(false),
});

// Zod schema for limits
export const limitsSchema = z.object({
  maxEvents: z.number().int('Max events must be an integer').default(-1).optional(),
  maxAttendeesPerEvent: z.number().int('Max attendees must be an integer').default(-1).optional(),
  maxFileUploads: z.number().int('Max file uploads must be an integer').default(-1).optional(),
  maxImageSize: z.number().int('Max image size must be an integer').default(-1).optional(), // Assuming MB
  maxVideoLength: z.number().int('Max video length must be an integer').default(-1).optional(), // Assuming minutes
  customDomain: z.boolean().default(false).optional(),
  analytics: z.enum(['basic', 'advanced', 'premium']).default('basic').optional(),
  support: z.enum(['email', 'priority', '24/7']).default('email').optional(),
  eventTypes: z.array(z.string()).default([]).optional(),
});

// New Zod schema for metadata
export const metadataSchema = z.object({
  isPopular: z.boolean().default(false).optional(),
  isTrial: z.boolean().default(false).optional(),
  isEnterpriseFlag: z.boolean().default(false).optional(),
  // Add other metadata fields here if they become part of admin management
});

export const subscriptionPlanPayloadSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  durationDays: z.number().int('Duration days must be an integer').min(0, 'Duration days cannot be negative'),
  features: z.array(featureEntrySchema).optional().default([]),
  limits: limitsSchema.optional().default({}),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int('Display order must be an integer').default(0).optional(),
  metadata: metadataSchema.optional().default({}),
});

export type SubscriptionPlanPayload = z.infer<typeof subscriptionPlanPayloadSchema>; 