import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SubscriptionPlan, ISubscriptionPlan } from '@/models/SubscriptionPlan';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { 
    subscriptionPlanPayloadSchema, 
    SubscriptionPlanPayload, 
    featureEntrySchema 
} from '@/schemas/subscriptionPlanSchemas';

// Helper function for Superadmin Authentication (can be moved to a shared lib later)
async function checkSuperadminAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  if (token.role !== 'super-admin') {
    return NextResponse.json({ message: 'Forbidden: Superadmin access required' }, { status: 403 });
  }
  return null; // null means authenticated and authorized
}

// POST - Create a new Subscription Plan
export async function POST(request: NextRequest) {
  const authError = await checkSuperadminAuth(request);
  if (authError) {
    return authError;
  }
  try {
    await connectToDatabase();
    const body = await request.json();

    const validationResult = subscriptionPlanPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { slug } = validationResult.data;
    const existingPlan = await SubscriptionPlan.findOne({ slug });
    if (existingPlan) {
      return NextResponse.json({ message: `Subscription plan with slug '${slug}' already exists.` }, { status: 409 });
    }

    const newPlan = new SubscriptionPlan(validationResult.data);
    await newPlan.save();

    return NextResponse.json({ message: 'Subscription plan created successfully', plan: newPlan.toObject() }, { status: 201 });

  } catch (error: unknown) {
    console.error("Error creating subscription plan:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('E11000 duplicate key error collection') && errorMessage.includes('slug')) {
        return NextResponse.json({ message: 'A plan with this slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating subscription plan", error: errorMessage }, { status: 500 });
  }
}

// GET - List all Subscription Plans
export async function GET(request: NextRequest) {
  const authError = await checkSuperadminAuth(request);
  if (authError) {
    return authError;
  }
  try {
    await connectToDatabase();
    const plans = await SubscriptionPlan.find({}).lean();
    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("Error in subscription-plans GET:", error);
    return NextResponse.json({ message: "Error fetching subscription plans", error: String(error) }, { status: 500 });
  }
}

export type { SubscriptionPlanPayload };
export { subscriptionPlanPayloadSchema };
export { featureEntrySchema }; 