import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { withSuperadminAuth } from '@/app/api/super/withSuperadminAuth';
import { z } from 'zod';

interface RouteParams {
  planId: string;
}

const featureUpdateSchema = z.object({
  features: z.record(z.object({
    included: z.boolean(),
    limit: z.number().optional()
  }))
});

export const PUT = withSuperadminAuth(async (request: Request, { params }: { params: RouteParams }) => {
  try {
    await connectToDatabase();
    const { planId } = params;
    const body = await request.json();

    const validationResult = featureUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    // Update each feature's included status and limit
    const updatedFeatures = plan.features.map(feature => {
      const updateData = validationResult.data.features[feature.id];
      if (updateData) {
        return {
          ...feature,
          included: updateData.included,
          limit: updateData.limit
        };
      }
      return feature;
    });

    plan.features = updatedFeatures;
    await plan.save();

    return NextResponse.json({ message: 'Features updated successfully', plan }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating plan features:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error updating plan features", error: errorMessage }, { status: 500 });
  }
}); 