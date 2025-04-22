import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Role } from "@/models/Role";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for GET user by ID...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const userId = params.id;
    console.log('Fetching user with ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const user = await User.findById(userId).select("-password");
    console.log('User found:', !!user);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user has an admin role in the role collection
    if (user) {
      const roleRecord = await Role.findOne({ email: user.email });
      if (roleRecord && roleRecord.role) {
        // If user has an admin role, override the role from user collection
        user.role = roleRecord.role;
      }
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for PATCH user...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const userId = params.id;
    console.log('Updating user with ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const updateData: Record<string, any> = {};
    
    // Only allow updating specific fields
    const allowedFields = ['name', 'email', 'role', 'isActive'];
    
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });
    
    // If role is being set to 'user', ensure requirePasswordChange is false
    if (body.role === 'user') {
      updateData.requirePasswordChange = false;
    } 
    // Otherwise, if requirePasswordChange was provided, use that value
    else if (body.requirePasswordChange !== undefined) {
      updateData.requirePasswordChange = body.requirePasswordChange;
    }
    
    // Handle password update separately with hashing
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
      updateData.lastPasswordChange = new Date();
      
      // If we're updating password, only set requirePasswordChange to false
      // if the role is 'user' or if explicitly set to false
      if (body.role === 'user' || body.requirePasswordChange === false) {
        updateData.requirePasswordChange = false;
      }
    }
    
    // Set updatedAt
    updateData.updatedAt = new Date();
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password");
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for DELETE user...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const userId = params.id;
    console.log('Deleting user with ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 