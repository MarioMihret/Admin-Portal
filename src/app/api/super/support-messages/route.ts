import { NextRequest, NextResponse } from 'next/server';
import { getToken, JWT } from 'next-auth/jwt';
import mongoose, { Model } from 'mongoose';
import { connectToDatabase } from '@/lib/db';

// Define the structure of a contact message
// IMPORTANT: Adjust this interface and the schema below to match your actual ContactMessage model
interface IContactMessage extends mongoose.Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'archived' | 'replied'; // Example statuses
  createdAt: Date;
  updatedAt: Date;
  // Add any other fields your model has
}

// Define a Mongoose schema and model (or import your existing one)
// If you have an existing model, import it instead of defining it here.
const ContactMessageSchema = new mongoose.Schema<IContactMessage>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'archived', 'replied'], default: 'new' },
}, { timestamps: true });

// Try to retrieve the existing model or create a new one, specifying the collection name
const ContactMessage: Model<IContactMessage> = mongoose.models.ContactMessage || 
                                              mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema, 'contacts');

// --- Authentication HOF (similar to other super-admin routes) ---
interface DecodedSuperadminToken extends JWT {
  // Assuming your JWT (after augmentation) has a 'role' property
  // e.g., role?: "super-admin" | "admin" | "user";
}

type AuthenticatedHandler = (
  request: NextRequest,
  token: DecodedSuperadminToken
) => Promise<NextResponse>;

function withSuperadminAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = await getToken({ req: request }) as DecodedSuperadminToken | null;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    if (token.role !== 'super-admin') {
      return NextResponse.json({ message: 'Forbidden: Superadmin access required' }, { status: 403 });
    }
    return handler(request, token);
  };
}
// --- End Authentication HOF ---

const actualGetHandler = async (request: NextRequest, token: DecodedSuperadminToken): Promise<NextResponse> => {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status'); // For filtering by status

    let query: any = {};
    if (status && status !== 'All') { // Assuming 'All' means no status filter
      query.$or = [
        { status: status },
        // If status is 'new', also include documents where status field doesn't exist
        ...(status === 'new' ? [{ status: { $exists: false } }] : []) 
      ];
    } else if (status === 'new') { 
        // Default case if status param is not present but frontend defaults to 'new'
        query.$or = [
            { status: 'new' },
            { status: { $exists: false } }
        ];
    }

    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalMessages = await ContactMessage.countDocuments(query);

    return NextResponse.json({
      messages,
      pagination: {
        total: totalMessages,
        page,
        limit,
        pages: Math.ceil(totalMessages / limit),
      },
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("[API/super/support-messages GET] Error fetching support messages:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error fetching support messages", error: errorMessage }, { status: 500 });
  }
};

export const GET = withSuperadminAuth(actualGetHandler);

// You can add POST, PUT, DELETE handlers here later if needed
// For example, to update message status or delete messages. 