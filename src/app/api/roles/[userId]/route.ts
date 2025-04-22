import { connectToDatabase } from "@/lib/db";
import { Role } from "@/models/Role";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcrypt';

// Get a user's role from the roles collection
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();
    
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Get the user to find their email
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Find role by email, matching our seed format
    const roleRecord = await Role.findOne({ email: user.email });
    
    if (!roleRecord) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ role: roleRecord });
  } catch (error) {
    console.error("Error fetching role:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// Update or create a user's role in the roles collection
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();
    
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Verify the user exists and get all user details
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate the role
    if (!body.role || !["admin", "super-admin"].includes(body.role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'super-admin'" },
        { status: 400 }
      );
    }
    
    // Default password for new admin users
    const defaultPassword = "ChangeMe123!";
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
    
    // For new admin users, we'll need to set requirePasswordChange
    const requirePasswordChange = true;
    
    // Get user data to store in role collection
    const userRecord = user.toObject();
    
    // Check if a role entry already exists
    const existingRoleEntry = await Role.findOne({ email: userRecord.email });
    
    const now = new Date();
    
    if (existingRoleEntry) {
      // Update existing role entry with full user data
      await Role.findByIdAndUpdate(
        existingRoleEntry._id,
        { 
          $set: { 
            userId: user._id,
            name: userRecord.name,
            email: userRecord.email,
            // Only update password if it's not already set (to avoid losing existing password)
            password: existingRoleEntry.password || defaultPasswordHash,
            role: body.role,
            isActive: userRecord.isActive,
            requirePasswordChange: true,
            failedLoginAttempts: existingRoleEntry.failedLoginAttempts || 0,
            lastPasswordChange: existingRoleEntry.lastPasswordChange || now,
            updatedAt: now
            // Keep original createdAt
          } 
        }
      );
    } else {
      // Create new role entry with complete user data
      await Role.create({
        userId: user._id,
        name: userRecord.name,
        email: userRecord.email,
        password: userRecord.password || defaultPasswordHash,
        role: body.role,
        isActive: userRecord.isActive,
        requirePasswordChange: true,
        failedLoginAttempts: 0,
        lastPasswordChange: now,
        createdAt: now,
        updatedAt: now
      });
    }
    
    return NextResponse.json({ 
      message: "Role updated successfully"
    });
  } catch (error) {
    console.error("Error updating role:", error);
    
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// Delete a role record
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();
    
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Get the user to find their email
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Delete role by email, matching our seed format
    const deletedRole = await Role.findOneAndDelete({ email: user.email });
    
    if (!deletedRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }
    
    // Reset the user's role in User collection to "user"
    await User.findByIdAndUpdate(
      userId,
      { $set: { role: "user", updatedAt: new Date() } }
    );
    
    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
} 