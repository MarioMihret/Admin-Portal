import { connectToDatabase } from "@/lib/db";
import { Role } from "@/models/Role";
import { NextResponse } from "next/server";

// Get all roles
export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all roles
    const roles = await Role.find({});
    
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
} 