import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt'; // Re-import getToken
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Subscription } from '@/models/Subscription';
import { User } from '@/models/User';
import { z } from 'zod';

// Define the type for the handler that will be wrapped
type AuthenticatedHandler = (
  request: NextRequest,
  context: { params: { subscriptionId: string } }, // context includes params
  token: any // The decoded token
) => Promise<NextResponse>;

export function withSuperadminAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params: { subscriptionId: string } } // This is what Next.js passes to route handlers
  ): Promise<NextResponse> => {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    if (token.role !== 'super-admin') {
      return NextResponse.json({ message: 'Forbidden: Superadmin access required' }, { status: 403 });
    }
    // Call the original handler with the request, context (which contains params), and the token
    return handler(request, context, token);
  };
}

const updateStatusSchema = z.object({
  status: z.string().min(1, { message: "Status cannot be empty" }),
});

// For PopulatedSubscriptionObject to type the response correctly
interface MappedUser {
  _id: string;
  email: string;
  name?: string;
}

interface PopulatedSubscriptionObject {
  _id: string;
  userId: MappedUser | null;
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

// Adjust the handler to accept context and token as per the HOF
const actualPatchHandler = async (
  request: NextRequest, 
  context: { params: { subscriptionId: string } }, // Context object from HOF
  token: any // Token from HOF (unused in this example if auth logic is solely in HOF)
): Promise<NextResponse> => {
  const { subscriptionId } = context.params; // Extract subscriptionId from context.params

  if (!subscriptionId || !mongoose.Types.ObjectId.isValid(subscriptionId)) {
    return NextResponse.json({ message: 'Invalid Subscription ID format' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const validationResult = updateStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status } = validationResult.data;

    const updatedSubDoc = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { $set: { status: status } },
      { new: true, runValidators: true }
    );

    if (!updatedSubDoc) {
      return NextResponse.json({ message: 'Subscription not found or failed to update status' }, { status: 404 });
    }

    let mappedUserId: MappedUser | null = null;
    if (updatedSubDoc.userId && mongoose.Types.ObjectId.isValid(updatedSubDoc.userId.toString())) {
      try {
        const user = await User.findById(updatedSubDoc.userId.toString())
          .select('_id name email')
          .lean() as MappedUser | null;
        if (user) {
          mappedUserId = {
            _id: user._id.toString(),
            name: user.name || undefined,
            email: user.email,
          };
        }
      } catch (userError) {
        console.warn(`[PATCH Status] Failed to populate userId ${updatedSubDoc.userId} after status update:`, userError);
      }
    }

    const toISO = (date: any): string | undefined => date instanceof Date ? date.toISOString() : undefined;
    const responseSubscription: PopulatedSubscriptionObject = {
      _id: updatedSubDoc._id!.toString(),
      userId: mappedUserId,
      planId: updatedSubDoc.planId,
      status: updatedSubDoc.status,
      paymentStatus: updatedSubDoc.paymentStatus,
      startDate: toISO(updatedSubDoc.startDate),
      endDate: toISO(updatedSubDoc.endDate),
      expiryDate: toISO(updatedSubDoc.expiryDate),
      amount: updatedSubDoc.amount,
      currency: updatedSubDoc.currency,
      transactionRef: updatedSubDoc.transactionRef,
      createdAt: toISO(updatedSubDoc.createdAt),
      updatedAt: toISO(updatedSubDoc.updatedAt),
    };

    return NextResponse.json({ message: `Subscription status updated to ${status}`, subscription: responseSubscription }, { status: 200 });

  } catch (error: unknown) {
    console.error("[PATCH Status] Error updating subscription status:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error updating subscription status", error: errorMessage }, { status: 500 });
  }
};

// Export the HOF-wrapped handler
export const PATCH = withSuperadminAuth(actualPatchHandler); 