import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";
import OrganizerApplication from "@/models/OrganizerApplication";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for GET applications...');
    await connectToDatabase();
    
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
        { university: { $regex: searchQuery, $options: 'i' } },
        { department: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }
    
    console.log('DEBUG - Model Info:', {
      collectionName: OrganizerApplication.collection.name,
      dbName: OrganizerApplication.db.name,
      modelName: OrganizerApplication.modelName,
      filter: JSON.stringify(filter)
    });
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get applications with pagination using Mongoose model
    const [applications, total] = await Promise.all([
      OrganizerApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance
      OrganizerApplication.countDocuments(filter)
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
    await connectToDatabase();
    
    const body = await request.json();
    console.log('Creating new application with data:', body);
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'university', 'experience', 'reason'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if email already exists
    const existingApplication = await OrganizerApplication.findOne({ email: body.email });
    
    if (existingApplication) {
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 409 }
      );
    }
    
    // Create new application using Mongoose
    const newApplication = await OrganizerApplication.create({
      ...body,
      status: 'pending'
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Application submitted successfully",
      application: newApplication
    });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
 