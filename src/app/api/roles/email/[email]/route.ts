import { connectToDatabase } from "@/lib/db";
import { Role } from "@/models/Role";
import { NextResponse } from "next/server";

// Get a user's role from the roles collection by email
export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    await connectToDatabase();
    
    const email = params.email;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Decode the email if it's URL encoded
    const decodedEmail = decodeURIComponent(email);
    
    const roleRecord = await Role.findOne({ email: decodedEmail });
    
    if (!roleRecord) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ role: roleRecord });
  } catch (error) {
    console.error("Error fetching role by email:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
} 