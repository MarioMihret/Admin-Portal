import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

// Added constant for collection name to ensure consistency
const COLLECTION_NAME = 'organizer_applications';

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for GET applications...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    
    console.log('Fetching applications with params:', { searchQuery, status, page, limit });
    
    // Create filter based on search and status
    let filter: any = {};
    
    if (searchQuery) {
      filter.$or = [
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { organization: { $regex: searchQuery, $options: 'i' } },
        { university: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }
    
    console.log('Using collection:', COLLECTION_NAME);
    console.log('Filter:', filter);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get applications with pagination
    const [applications, total] = await Promise.all([
      connection.db.collection(COLLECTION_NAME)
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      connection.db.collection(COLLECTION_NAME).countDocuments(filter)
    ]);
    
    console.log(`Found ${applications.length} applications out of ${total} total`);
    
    // Prepare pagination data
    const pages = Math.ceil(total / limit);
    
    return NextResponse.json({
      applications,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// Add endpoint to find application by email
export async function POST(request: Request) {
  try {
    console.log('Connecting to database for POST application...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    const body = await request.json();
    console.log('Creating new application with data:', body);
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'organization', 'experience', 'reason'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if email already exists
    const existingApplication = await connection.db.collection(COLLECTION_NAME)
      .findOne({ email: body.email });
    
    if (existingApplication) {
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 409 }
      );
    }
    
    // Prepare the application data
    const now = new Date();
    const applicationData = {
      ...body,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    
    // Insert new application
    const result = await connection.db.collection(COLLECTION_NAME)
      .insertOne(applicationData);
    
    if (!result.insertedId) {
      throw new Error("Failed to insert application");
    }
    
    // Get the created application
    const createdApplication = await connection.db.collection(COLLECTION_NAME)
      .findOne({ _id: result.insertedId });
    
    return NextResponse.json({ 
      success: true, 
      message: "Application submitted successfully",
      application: createdApplication
    });
  } catch (error) {
    console.error("Error creating application:", error);
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
} 