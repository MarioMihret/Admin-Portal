import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// Added constant for collection name to ensure consistency
const COLLECTION_NAME = 'organizer_applications';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for GET application by ID...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    const applicationId = params.id;
    console.log('Fetching application with ID:', applicationId);
    
    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }
    
    const application = await connection.db.collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(applicationId) });
    
    console.log('Application found:', !!application);
    
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ application });
  } catch (error) {
    console.error("Error fetching application:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for PATCH application...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    const applicationId = params.id;
    console.log('Updating application with ID:', applicationId);
    
    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log('Update data:', body);
    
    // Normalize field names for compatibility between systems
    if (body.idDocumentUrl && !body.idDocument) {
      body.idDocument = body.idDocumentUrl;
    }
    
    if (body.profilePhotoUrl && !body.profilePhoto) {
      body.profilePhoto = body.profilePhotoUrl;
    }
    
    // Process date fields
    if (body.dateOfBirth) {
      try {
        body.dateOfBirth = new Date(body.dateOfBirth);
      } catch (e) {
        console.error('Error converting dateOfBirth to Date:', e);
      }
    }
    
    // Set updated timestamp
    body.updatedAt = new Date();
    
    // Update the application
    const result = await connection.db.collection(COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(applicationId) },
        { $set: body },
        { returnDocument: 'after' }
      );
    
    if (!result) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ application: result });
  } catch (error) {
    console.error("Error updating application:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for DELETE application...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    const applicationId = params.id;
    console.log('Deleting application with ID:', applicationId);
    
    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }
    
    const result = await connection.db.collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(applicationId) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
} 