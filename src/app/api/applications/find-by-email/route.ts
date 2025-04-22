import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

// Added constant for collection name to ensure consistency
const COLLECTION_NAME = 'organizer_applications';

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for GET application by email...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get email parameter
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    console.log('Searching for application with email:', email);
    
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }
    
    // Find application by email
    const application = await connection.db.collection(COLLECTION_NAME)
      .findOne({ email: email });
    
    console.log('Application found:', !!application);
    
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ application });
  } catch (error) {
    console.error("Error finding application by email:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to find application" },
      { status: 500 }
    );
  }
} 