import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db'; 
// Only import Subscription and ISubscription, as other types caused errors
import { Subscription, ISubscription } from '@/models/Subscription'; 
import { User } from '@/models/User'; // Ensure User model is imported
import { z } from 'zod'; // For request validation in PUT/DELETE
import { getToken, JWT } from 'next-auth/jwt'; // Import JWT for token type
import mongoose from 'mongoose';
// Removed ISubscriptionMetadata, IVerificationResponse from here if not used or defined below
// Ensure MongoSubscription and MongoUser are not imported if defined locally

// It is ASSUMED that the base JWT type (from 'next-auth/jwt') has been augmented 
// elsewhere in your project (e.g., in a next-auth.d.ts file) to include a 'role' property.
// For example, the augmentation might look like:
// declare module 'next-auth/jwt' {
//   interface JWT {
//     role?: "super-admin" | "admin" | "user"; // Or your specific AppRole type
//   }
// }
// By not redeclaring 'role' here, DecodedSuperadminToken inherits it from the augmented JWT.
interface DecodedSuperadminToken extends JWT {
  // Add any *additional* properties specific to DecodedSuperadminToken if they 
  // are not already part of your augmented JWT type.
}

// Define a new HOF structure, providing a generic context
type AuthenticatedCollectionHandler = (
  request: NextRequest,
  context: { params: Record<string, string | string[]> }, // Handler expects params property
  token: DecodedSuperadminToken // Use the specific token type
) => Promise<NextResponse>;

function withSuperadminAuth(handler: AuthenticatedCollectionHandler) {
  return async (
    request: NextRequest,
    context: { params: Record<string, string | string[]> } // What Next.js passes (params will be {} for this route)
  ): Promise<NextResponse> => {
    const token = await getToken({ req: request }) as DecodedSuperadminToken | null; // Cast to specific token type
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    // Check for role, ensuring it matches your token structure
    if (token.role !== 'super-admin') { 
      return NextResponse.json({ message: 'Forbidden: Superadmin access required' }, { status: 403 });
    }
    // Pass context directly, as in the working HOF
    return handler(request, context, token);
  };
}

// Updated MappedUser interface for populated user data
interface MappedUser {
  _id: string;
  email: string; // Assuming email is always present
  name?: string;  // Name might be optional
}

// Interface for the shape of a subscription object after populate() and lean()
interface PopulatedLeanSubscription {
  _id: mongoose.Types.ObjectId; // from lean(), typically ObjectId
  planId: string;
  status: string;
  paymentStatus: string;
  startDate: Date;
  endDate: Date;
  expiryDate?: Date;
  amount: number;
  currency: string;
  transactionRef?: string;
  // metadata?: ISubscriptionMetadata; // Commented out: Cannot find name 'ISubscriptionMetadata'.
  // verificationResponse?: IVerificationResponse; // Commented out: Cannot find name 'IVerificationResponse'.
  createdAt?: Date; 
  updatedAt?: Date; 
  userId: MappedUser | null; // from populate
}

// Updated PopulatedSubscriptionObject interface
interface PopulatedSubscriptionObject {
  _id: string;
  userId: MappedUser | null; // User data will be populated or null
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

// Local definitions for MongoDB document shapes, if not imported
interface MongoUser { // As used by .lean() from User model
  _id: mongoose.Types.ObjectId;
  name?: string;
  email: string;
}

interface MongoSubscription { // As used by .lean() from Subscription model
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | MongoUser; 
  planId: string;
  status: string;
  paymentStatus: string;
  startDate: Date;
  endDate: Date;
  expiryDate?: Date;
  amount: number;
  currency: string;
  transactionRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (subscriptionId) {
      // Logic to fetch a single subscription by ID
      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return NextResponse.json({ message: 'Invalid Subscription ID format for single fetch' }, { status: 400 });
      }
      // Explicitly type here if MongoSubscription is well-defined
      const subscriptionDoc = await Subscription.findById(subscriptionId).lean() as MongoSubscription | null;
      if (!subscriptionDoc) {
        return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
      }
      
      let userData: MappedUser | null = null;
      if (subscriptionDoc.userId) {
         try {
            // Determine if userId is an ObjectId or already a populated-like structure from .lean()
            let userIdToQuery: string | null = null;
            if (typeof subscriptionDoc.userId === 'string') {
                userIdToQuery = subscriptionDoc.userId;
            } else if (subscriptionDoc.userId instanceof mongoose.Types.ObjectId) {
                userIdToQuery = subscriptionDoc.userId.toString();
            } else if (typeof subscriptionDoc.userId === 'object' && (subscriptionDoc.userId as MongoUser)._id) {
                // It might be a MongoUser-like structure if .lean() behaved that way or due to schema
                userIdToQuery = (subscriptionDoc.userId as MongoUser)._id.toString();
            }

            if (userIdToQuery && mongoose.Types.ObjectId.isValid(userIdToQuery)) {
                const user = await User.findById(userIdToQuery)
                .select('_id name email')
                .lean() as MongoUser | null;

                if (user) {
                    userData = {
                        _id: user._id.toString(),
                        name: user.name || undefined, // Use undefined for optional fields if that\'s preferred over null
                        email: user.email
                    };
                }
            } else {
                console.warn(`[GET single] Invalid userId format or missing _id for subscription ${subscriptionDoc._id}:`, subscriptionDoc.userId);
            }
        } catch (error) {
            console.warn(`[GET single] Failed to fetch user data for subscription ${subscriptionDoc._id}, userId: ${subscriptionDoc.userId}`, error);
        }
      }
      const toISO = (date: any): string | undefined => date instanceof Date ? date.toISOString() : undefined;
      // Make sure PopulatedSubscriptionObject matches what the frontend expects for a single subscription
      const populatedSubscription: PopulatedSubscriptionObject = {
            _id: subscriptionDoc._id.toString(),
            userId: userData,
            planId: subscriptionDoc.planId,
            status: subscriptionDoc.status,
            paymentStatus: subscriptionDoc.paymentStatus,
            startDate: toISO(subscriptionDoc.startDate),
            endDate: toISO(subscriptionDoc.endDate),
            expiryDate: toISO(subscriptionDoc.expiryDate),
            amount: subscriptionDoc.amount,
            currency: subscriptionDoc.currency,
            transactionRef: subscriptionDoc.transactionRef,
            createdAt: toISO(subscriptionDoc.createdAt),
            updatedAt: toISO(subscriptionDoc.updatedAt)
      };
      return NextResponse.json({ subscription: populatedSubscription }, { status: 200 });
    }

    // --- Existing logic for fetching a list of subscriptions --- 
    const planId = searchParams.get('planId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let query: any = {};
    if (planId) query.planId = planId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    // Note: searchTerm applied post-population for user fields for now

    const subscriptionsFromDB = (await Subscription.find(query).lean()) as unknown as MongoSubscription[];

    const mappedSubscriptions = await Promise.all(subscriptionsFromDB.map(async (sub) => {
      let userData: MappedUser | null = null;
      if (sub.userId) {
        try {
          let userIdToQuery: string | null = null;
          if (typeof sub.userId === 'string') {
            userIdToQuery = sub.userId;
          } else if (sub.userId instanceof mongoose.Types.ObjectId) {
            userIdToQuery = sub.userId.toString();
          } else if (typeof sub.userId === 'object' && (sub.userId as MongoUser)._id) {
            userIdToQuery = (sub.userId as MongoUser)._id.toString();
          }

          if (userIdToQuery && mongoose.Types.ObjectId.isValid(userIdToQuery)) {
            const user = await User.findById(userIdToQuery).select('_id name email').lean() as MongoUser | null;
            if (user) {
              userData = { _id: user._id.toString(), name: user.name || undefined, email: user.email };
            }
          } else {
            console.warn(`[GET list] Invalid userId format for subscription ${sub._id}:`, sub.userId);
          }
        } catch (error) {
          console.warn(`[GET list] Failed to fetch user data for subscription ${sub._id}, userId: ${sub.userId}`, error);
        }
      }
      const toISO = (date: any): string | undefined => date instanceof Date ? date.toISOString() : undefined;
      return {
        _id: sub._id.toString(),
        userId: userData,
        planId: sub.planId,
        status: sub.status,
        paymentStatus: sub.paymentStatus,
        startDate: toISO(sub.startDate),
        endDate: toISO(sub.endDate),
        expiryDate: toISO(sub.expiryDate),
        amount: sub.amount,
        currency: sub.currency,
        transactionRef: sub.transactionRef,
        createdAt: toISO(sub.createdAt),
        updatedAt: toISO(sub.updatedAt)
      } as PopulatedSubscriptionObject; // ensure mapped object matches PopulatedSubscriptionObject
    }));

    let finalSubscriptions = mappedSubscriptions;
    if (searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i');
        finalSubscriptions = mappedSubscriptions.filter(sub => {
            let matches = false;
            if (mongoose.Types.ObjectId.isValid(searchTerm) && sub._id === searchTerm) matches = true;
            if (!matches && sub.planId?.match(searchRegex)) matches = true;
            if (!matches && sub.status?.match(searchRegex)) matches = true;
            if (!matches && sub.userId?.name?.match(searchRegex)) matches = true;
            if (!matches && sub.userId?.email?.match(searchRegex)) matches = true;
            return matches;
        });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSubscriptions = finalSubscriptions.slice(startIndex, endIndex);

    return NextResponse.json({
      subscriptions: paginatedSubscriptions,
      pagination: {
        total: finalSubscriptions.length,
        page,
        limit,
        pages: Math.ceil(finalSubscriptions.length / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("[GET Subscriptions] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      message: "Error fetching subscriptions", 
      error: errorMessage 
    }, { status: 500 });
  }
}

// Define Zod schema for PUT request body (kept for when we restore the handler)
const updateSubscriptionSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  planId: z.string().optional(),
});

// actualPutHandler updated to accept the new context argument
const actualPutHandler = async (
  request: NextRequest,
  context: { params: Record<string, string | string[]> }, // Expects params property
  token: DecodedSuperadminToken // Use specific token type
): Promise<NextResponse> => {
  // context.params is not used here, but the signature matches the HOF
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    if (!subscriptionId) return NextResponse.json({ message: 'Subscription ID is required' }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) return NextResponse.json({ message: 'Invalid Subscription ID format' }, { status: 400 });
    const body = await request.json();
    const validationResult = updateSubscriptionSchema.safeParse(body);
    if (!validationResult.success) return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    const updateData = validationResult.data as any;
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    const updatedSubDoc = await Subscription.findByIdAndUpdate(subscriptionId, { $set: updateData }, { new: true, runValidators: true }).lean() as MongoSubscription | null;
    if (!updatedSubDoc) return NextResponse.json({ message: 'Subscription not found or failed to update' }, { status: 404 });
    let mappedUserId: MappedUser | null = null;
    if (updatedSubDoc.userId) {
        let userIdToQuery: string | null = null;
        if (typeof updatedSubDoc.userId === 'string') userIdToQuery = updatedSubDoc.userId;
        else if (updatedSubDoc.userId instanceof mongoose.Types.ObjectId) userIdToQuery = updatedSubDoc.userId.toString();
        else if (typeof updatedSubDoc.userId === 'object' && (updatedSubDoc.userId as MongoUser)._id) userIdToQuery = (updatedSubDoc.userId as MongoUser)._id.toString();
        if (userIdToQuery && mongoose.Types.ObjectId.isValid(userIdToQuery)) {
            try {
                const user = await User.findById(userIdToQuery).select('_id name email').lean() as MongoUser | null;
                if (user) mappedUserId = { _id: user._id.toString(), name: user.name || undefined, email: user.email };
            } catch (userError) { console.warn(`[PUT] Failed to populate userId ${userIdToQuery} after update:`, userError); }
        }
    }
    const toISO = (date: any): string | undefined => date instanceof Date ? date.toISOString() : undefined;
    const responseSubscription: PopulatedSubscriptionObject = { _id: updatedSubDoc._id.toString(), userId: mappedUserId, planId: updatedSubDoc.planId, status: updatedSubDoc.status, paymentStatus: updatedSubDoc.paymentStatus, startDate: toISO(updatedSubDoc.startDate), endDate: toISO(updatedSubDoc.endDate), expiryDate: toISO(updatedSubDoc.expiryDate), amount: updatedSubDoc.amount, currency: updatedSubDoc.currency, transactionRef: updatedSubDoc.transactionRef, createdAt: toISO(updatedSubDoc.createdAt), updatedAt: toISO(updatedSubDoc.updatedAt) };
    return NextResponse.json({ message: 'Subscription updated successfully', subscription: responseSubscription }, { status: 200 });
  } catch (error: unknown) {
    console.error("[PUT Subscriptions] Error updating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error updating subscription", error: errorMessage }, { status: 500 });
  }
};
export const PUT = withSuperadminAuth(actualPutHandler);

// actualDeleteHandler updated to accept the new context argument
const actualDeleteHandler = async (
  request: NextRequest,
  context: { params: Record<string, string | string[]> }, // Expects params property
  token?: DecodedSuperadminToken // Use specific token type (optional if not always used)
): Promise<NextResponse> => {
  // context.params is not used here, but the signature matches the HOF
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    if (!subscriptionId) return NextResponse.json({ message: 'Subscription ID is required' }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) return NextResponse.json({ message: 'Invalid Subscription ID format' }, { status: 400 });
    const cancelledSubscription = await Subscription.findByIdAndUpdate(subscriptionId, { $set: { status: 'cancelled', paymentStatus: 'cancelled' } }, { new: true });
    if (!cancelledSubscription) return NextResponse.json({ message: 'Subscription not found or failed to cancel' }, { status: 404 });
    return NextResponse.json({ message: 'Subscription cancelled successfully', subscription: cancelledSubscription }, { status: 200 });
  } catch (error: unknown) {
    console.error("[DELETE Subscriptions] Error cancelling subscription:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error cancelling subscription", error: errorMessage }, { status: 500 });
  }
};
export const DELETE = withSuperadminAuth(actualDeleteHandler);
