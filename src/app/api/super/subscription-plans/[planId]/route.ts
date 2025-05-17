import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SubscriptionPlan, ISubscriptionPlan } from '@/models/SubscriptionPlan';
import { subscriptionPlanPayloadSchema } from '../route'; // Import Zod schema from the parent route
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt'; // Added for authentication
import { NextRequest } from 'next/server'; // Import NextRequest

// Helper function for Superadmin Authentication (assuming it's defined above or imported)
async function checkSuperadminAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  if (token.role !== 'super-admin') {
    return NextResponse.json({ message: 'Forbidden: Superadmin access required' }, { status: 403 });
  }
  return null; 
}

interface RouteParams {
  planId: string; // This will be the slug or MongoDB _id
}

// Helper to find a plan by ID or Slug
async function findPlan(planId: string): Promise<ISubscriptionPlan | null> {
  if (mongoose.Types.ObjectId.isValid(planId)) {
    const planById = await SubscriptionPlan.findById(planId);
    if (planById) return planById;
  }
  // If not a valid ObjectId or not found by ID, try finding by slug
  return SubscriptionPlan.findOne({ slug: planId });
}

// GET - Fetch a single Subscription Plan by slug or ID
export const GET = async (request: Request, { params }: { params: RouteParams }) => {
  try {
    await connectToDatabase();
    const { planId } = params;

    const plan = await findPlan(planId);

    if (!plan) {
      return NextResponse.json({ message: 'Subscription plan not found' }, { status: 404 });
    }
    return NextResponse.json({ plan }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error fetching subscription plan:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error fetching subscription plan", error: errorMessage }, { status: 500 });
  }
};

// PUT - Update an existing Subscription Plan by slug or ID
export const PUT = async (request: Request, { params }: { params: RouteParams }) => {
  try {
    await connectToDatabase();
    const { planId } = params;
    const body = await request.json();

    const validationResult = subscriptionPlanPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const planToUpdate = await findPlan(planId);
    if (!planToUpdate) {
      return NextResponse.json({ message: 'Subscription plan not found for update' }, { status: 404 });
    }

    const { slug: newSlug, ...updateData } = validationResult.data;

    // If slug is being changed, ensure the new slug is unique (excluding the current document)
    if (newSlug && newSlug !== planToUpdate.slug) {
      const existingPlanWithNewSlug = await SubscriptionPlan.findOne({ slug: newSlug, _id: { $ne: planToUpdate._id } });
      if (existingPlanWithNewSlug) {
        return NextResponse.json({ message: `Another subscription plan with slug '${newSlug}' already exists.` }, { status: 409 });
      }
      planToUpdate.slug = newSlug; // Update slug separately if it passed validation
    }

    // Update other properties
    Object.assign(planToUpdate, updateData);
    
    await planToUpdate.save();

    return NextResponse.json({ message: 'Subscription plan updated successfully', plan: planToUpdate }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error updating subscription plan:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('E11000 duplicate key error collection') && errorMessage.includes('slug')) {
        return NextResponse.json({ message: 'A plan with this slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating subscription plan", error: errorMessage }, { status: 500 });
  }
};

// DELETE - Toggles isActive status of a Subscription Plan by slug or ID
export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  // Ensure checkSuperadminAuth is defined only once in the file, ideally at the top.
  // This is a re-declaration if it's also above. For this edit, assume it's defined elsewhere or will be deduplicated.
  const authError = await checkSuperadminAuth(request); 
  if (authError) {
    return authError;
  }

  try {
    await connectToDatabase();
    const { planId } = params;

    const plan = await findPlan(planId); // findPlan should already be defined in the file

    if (!plan) {
      return NextResponse.json({ message: 'Subscription plan not found' }, { status: 404 });
    }

    plan.isActive = !plan.isActive; // Toggle current status
    await plan.save();

    return NextResponse.json({ 
      message: `Subscription plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`, 
      plan: plan.toObject() 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error toggling subscription plan status:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error toggling subscription plan status", error: errorMessage }, { status: 500 });
  }
} 