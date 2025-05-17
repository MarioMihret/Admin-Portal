import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db';
import { SuperAdminUser } from '../route'; // Adjusted import path
// import { SuperAdminUser } from '@/models/SuperAdminUser'; // Original failing import

const BCRYPT_SALT_ROUNDS = 10;

const superAdminUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  // Role is not updatable for super admins, it remains 'Super Admin'
});

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: "Invalid Super Admin ID format" }, { status: 400 });
    }

    const superAdmin = await SuperAdminUser.findById(id).select("-passwordHash");

    if (!superAdmin) {
      return NextResponse.json({ message: "Super Admin user not found" }, { status: 404 });
    }
    return NextResponse.json(superAdmin, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error fetching super admin user ${params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ message: "Error fetching super admin user", error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: "Invalid Super Admin ID format" }, { status: 400 });
    }

    const body = await request.json();
    const validation = superAdminUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input for Super Admin update", errors: validation.error.format() }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    const validatedFields = validation.data;

    if (validatedFields.name) updateData.name = validatedFields.name;
    if (validatedFields.email) updateData.email = validatedFields.email;
    if (validatedFields.status) updateData.status = validatedFields.status;
    
    if (validatedFields.password) {
      updateData.passwordHash = await bcrypt.hash(validatedFields.password, BCRYPT_SALT_ROUNDS);
      // updateData.lastPasswordChange = new Date(); // Optional: if you track this for super admins
    }
    
    // Ensure role is not accidentally changed if present in body but not in schema for update
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: "No valid fields provided for update" }, { status: 400 });
    }

    updateData.updatedAt = new Date(); // Manage updatedAt timestamp

    const updatedSuperAdmin = await SuperAdminUser.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-passwordHash");

    if (!updatedSuperAdmin) {
      return NextResponse.json({ message: "Super Admin user not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSuperAdmin, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error updating super admin user ${params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error for Super Admin update", errors: error.format() }, { status: 400 });
    }
    if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ message: "Error updating super admin user", error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: "Invalid Super Admin ID format" }, { status: 400 });
    }

    const deletedSuperAdmin = await SuperAdminUser.findByIdAndDelete(id);

    if (!deletedSuperAdmin) {
      return NextResponse.json({ message: "Super Admin user not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Super Admin user deleted successfully" }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error deleting super admin user ${params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
     if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ message: "Error deleting super admin user", error: errorMessage }, { status: 500 });
  }
} 