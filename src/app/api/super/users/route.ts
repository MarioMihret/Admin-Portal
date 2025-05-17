import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db'; // Assuming this utility exists
// import { SuperAdminUser } from '@/models/SuperAdminUser'; // Model is now defined locally
import mongoose, { Schema, Document, models, Model } from 'mongoose';

const BCRYPT_SALT_ROUNDS = 10;

const superAdminUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  // Role is implicitly 'Super Admin' for this collection/table
  status: z.enum(['Active', 'Inactive', 'Pending']).default('Active'), // Simplified statuses for SA
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // TODO: Implement pagination and search if needed for super admins, similar to api/users
    const superAdmins = await SuperAdminUser.find({}).select("-passwordHash").sort({ createdAt: -1 });

    return NextResponse.json(superAdmins, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching super admin users:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Log more details for server-side debugging
    if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ message: "Error fetching super admin users", error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const validation = superAdminUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input for Super Admin", errors: validation.error.format() }, { status: 400 });
    }

    const { name, email, status, password } = validation.data;

    const existingSuperAdmin = await SuperAdminUser.findOne({ email });
    if (existingSuperAdmin) {
      return NextResponse.json({ message: "Super Admin with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const newSuperAdmin = new SuperAdminUser({
      name,
      email,
      passwordHash,
      role: 'Super Admin', // Fixed role
      status: status || 'Active',
    });

    await newSuperAdmin.save();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userResponse } = newSuperAdmin.toObject();

    return NextResponse.json(userResponse, { status: 201 });

  } catch (error: unknown) {
    console.error("Error creating super admin user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log more details for server-side debugging
    if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    }
    // Check if ZodError specifically, otherwise handle as general error
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error for Super Admin", errors: error.format() }, { status: 400 });
    }
    return NextResponse.json({ message: "Error creating super admin user", error: errorMessage }, { status: 500 });
  }
}

export interface ISuperAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'Super Admin';
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt?: Date;
  updatedAt?: Date;
}

const SuperAdminUserSchema: Schema<ISuperAdminUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'Super Admin', enum: ['Super Admin'] },
  status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
}, { timestamps: true });

// Prevent model recompilation in Next.js dev environment
const SuperAdminUser = (models.SuperAdminUser as Model<ISuperAdminUser, {}, {}, {}>) || 
                       mongoose.model<ISuperAdminUser>('SuperAdminUser', SuperAdminUserSchema);

export { SuperAdminUser }; 