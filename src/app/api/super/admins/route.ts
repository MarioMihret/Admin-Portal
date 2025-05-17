import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db';
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { Role } from '@/models/Role';

const BCRYPT_SALT_ROUNDS = 10;

// Interface for leaned Role document
interface IRole {
  _id: mongoose.Types.ObjectId | string; // Mongoose _id can be ObjectId or string after .toString()
  name: string;
  email: string;
  // password is selected out, so it's not in the lean object here
  role: 'admin' | 'super-admin';
  isActive: boolean;
  requirePasswordChange: boolean;
  failedLoginAttempts: number;
  lastPasswordChange: Date;
  createdAt: Date;
  updatedAt: Date;
  university?: string; // Added university field, assuming it's in the Role model
}

// Zod schema for creating an Admin User
const adminUserCreateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  university: z.string().min(1, { message: "University is required" }), // Admins are tied to a university
  status: z.enum(['Active', 'Inactive', 'Pending']).default('Active'),
  // Role is implicitly 'Admin' for this collection/table, or could be made a field if multiple admin roles exist
});

// Interface for Admin User Document
export interface IAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string; // e.g., 'Admin', 'University Admin'
  university: string;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose Schema for Admin User
const AdminUserSchema: Schema<IAdminUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'Admin', required: true }, // Defaulting to 'Admin'
  university: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
}, { timestamps: true });

// ADD Compound unique index for email and university
AdminUserSchema.index({ email: 1, university: 1 }, { unique: true });

// Prevent model recompilation in Next.js dev environment
const AdminUser = (models.AdminUser as Model<IAdminUser, {}, {}, {}>) || 
                   mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);

export { AdminUser }; 

// GET /api/super/admins - Fetches admin users primarily from Role collection, filtered by university
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const university = searchParams.get('university');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    // If university is a required filter for this endpoint.
    // This behavior (returning empty if no university specified) should be confirmed.
    // For now, it's kept, assuming university is a mandatory filter.
    if (!university) {
      return NextResponse.json([], { status: 200 });
    }

    // Query the 'Role' collection for admin or super-admin records matching the university.
    // This assumes 'university' field has been added to the Role schema and is populated.
    const queryConditions: any = {
      role: { $in: ['admin', 'super-admin'] },
      university: university, // Filter by the university query parameter
    };
    
    const adminRoles = await Role.find(queryConditions)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean<IRole[]>(); // IRole now expects 'university'

    if (!adminRoles || adminRoles.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Format the results.
    const formattedAdmins = adminRoles.map((roleUser: IRole) => {
      const formatDt = (date: Date | undefined) => date ? date.toISOString() : undefined;
      return {
        _id: roleUser._id.toString(),
        id: roleUser._id.toString(),
        name: roleUser.name,
        email: roleUser.email,
        role: roleUser.role,
        university: roleUser.university, // From the Role document itself
        status: roleUser.isActive ? 'Active' : 'Inactive',
        createdAt: formatDt(roleUser.createdAt),
        updatedAt: formatDt(roleUser.updatedAt),
      };
    });
    
    return NextResponse.json(formattedAdmins, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching admin users:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error fetching admin users", error: errorMessage }, { status: 500 });
  }
}

// POST /api/super/admins - Creates a new admin user
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Use a more specific Zod schema for creation that includes university
    const createAdminPayloadSchema = z.object({
      name: z.string().min(1, { message: "Name is required" }),
      email: z.string().email({ message: "Invalid email address" }).toLowerCase(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      university: z.string().min(1, { message: "University is required" }),
      status: z.enum(['Active', 'Inactive', 'Pending']).default('Active'),
      // Role is implicitly 'Admin' when creating through this endpoint
    });

    const validation = createAdminPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input for Admin user", errors: validation.error.format() }, { status: 400 });
    }

    const { name, email, password, university, status } = validation.data;
    const now = new Date();

    // 1. Check if user already exists in the Role collection
    const existingRoleUser = await Role.findOne({ email });
    if (existingRoleUser && existingRoleUser.role === 'admin') {
      // If user exists in Role collection as an admin, we might not want to allow re-creation through this endpoint,
      // or this endpoint could be used to *link* an existing admin role to a new university via AdminUser.
      // For now, let's assume we prevent creating a duplicate Admin role if one already exists.
      return NextResponse.json({ message: "An admin with this email already exists in the central role system." }, { status: 409 });
    } else if (existingRoleUser && existingRoleUser.role === 'super-admin') {
      return NextResponse.json({ message: "This email is registered as a super-admin. Cannot create a university admin role." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    let newRoleUser;
    if (!existingRoleUser) {
      // 2. Create new entry in Role collection if user doesn't exist at all
      newRoleUser = new Role({
        name,
        email,
        password: passwordHash, // Store hashed password in Role collection
        role: 'admin',         // Explicitly set role to 'admin'
        university: university, // Add the university field from validated data
        isActive: status === 'Active', // isActive in Role based on form status
        requirePasswordChange: true, // New admins should change their password
        failedLoginAttempts: 0,
        lastPasswordChange: now, // Set to now, as it's a new password
        createdAt: now,
        updatedAt: now,
      });
      await newRoleUser.save();
    } else {
      // This case implies an existing user in Role table but not as 'admin' or 'super-admin'. 
      // This scenario needs clear definition: are we upgrading them? For now, this path is less likely given above checks.
      // If existingRoleUser.role is e.g. 'user', this endpoint shouldn't silently make them an admin without more specific logic.
      // Given the checks above, this path should ideally not be hit if we prevent creation if existingRoleUser is an admin/super-admin.
      // If we wanted to allow associating a non-admin role (from Role table) with an AdminUser record, the logic would be different.
      // For safety, let's return an error for this unhandled edge case.
       return NextResponse.json({ message: "User with this email exists but is not an admin. Operation not supported by this endpoint." }, { status: 409 });
    }

    // Prepare response: use data from the Role collection as the primary source
    // newRoleUser is guaranteed to be defined here because the else block above returns early.
    const userResponse = {
      _id: newRoleUser!._id.toString(),
      id: newRoleUser!._id.toString(),
      name: newRoleUser!.name,
      email: newRoleUser!.email,
      role: newRoleUser!.role,
      university: university, // From validated request data
      status: status,         // From validated request data (which determined newRoleUser.isActive)
      isActive: newRoleUser!.isActive, // Directly from the new Role object
      createdAt: newRoleUser!.createdAt.toISOString(),
      updatedAt: newRoleUser!.updatedAt.toISOString(),
      // Do not include passwordHash or other sensitive fields from Role in the response
    };

    return NextResponse.json(userResponse, { status: 201 });

  } catch (error: unknown) {
    console.error("Error creating admin user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error for Admin user", errors: error.format() }, { status: 400 });
    }
    return NextResponse.json({ message: "Error creating admin user", error: errorMessage }, { status: 500 });
  }
} 