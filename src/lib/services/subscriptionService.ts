import { connectToDatabase } from '@/lib/db'; // Or your DB connection utility
import { SubscriptionPlan, ISubscriptionPlan } from '@/models/SubscriptionPlan'; // Import the Mongoose model and interface

// ... other potential imports and service methods ...

export const subscriptionService = {
  // ... other existing service methods ...

  async getPlan(planSlug: string): Promise<ISubscriptionPlan | null> { // Return type is ISubscriptionPlan (or its lean version)
    try {
      await connectToDatabase(); // Ensure database connection

      // Fetch an active plan by its slug directly from the SubscriptionPlan model
      // .lean() is recommended to get a plain JavaScript object
      const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true })
                                         .lean<ISubscriptionPlan | null>();
                                         // Using lean<ISubscriptionPlan | null> for type safety.
                                         // ISubscriptionPlan should represent the structure with number price/durationDays.

      if (!plan) {
        console.warn(`Active plan with slug "${planSlug}" not found.`);
        return null;
      }
      
      // The 'plan' object will now directly have fields like:
      // plan.name (string)
      // plan.slug (string)
      // plan.price (number)       -- as per ISubscriptionPlan via SubscriptionPlan model
      // plan.durationDays (number) -- as per ISubscriptionPlan via SubscriptionPlan model
      // plan.isActive (boolean)
      // plan.features (array)
      // plan.limits (object)
      // etc.

      return plan;
    } catch (error) {
      console.error(`Error fetching plan with slug "${planSlug}":`, error);
      // Consider re-throwing a more specific error or a generic one
      throw new Error(`Failed to fetch plan details for slug "${planSlug}"`);
    }
  },

  // ... other methods like createSubscription, getCurrentSubscription ...
};