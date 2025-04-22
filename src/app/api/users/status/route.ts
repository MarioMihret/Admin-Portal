import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    console.log("Checking user status for email:", email);

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }

    // Check user status in the database
    const user = await connection.db.collection("user")
      .findOne(
        { email },
        { 
          projection: { _id: 1, isActive: 1 },
          // Ensure we're getting fresh data from the primary
          readPreference: 'primary'
        }
      );

    console.log("User status check result:", user ? `Found - Active: ${user.isActive !== false}` : "Not found");

    if (!user) {
      // Default to active if user not found in database
      return NextResponse.json({
        success: true,
        isActive: true
      });
    }

    const response = NextResponse.json({
      success: true,
      isActive: user.isActive !== false // Default to true unless explicitly set to false
    });

    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check user status" },
      { status: 500 }
    );
  }
} 