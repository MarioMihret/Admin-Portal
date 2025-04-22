import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    console.log(`Checking user status for email: ${email}`);
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findOne({ email }).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error checking user by email:", error);
    
    return NextResponse.json(
      { error: "Failed to check user status" },
      { status: 500 }
    );
  }
} 