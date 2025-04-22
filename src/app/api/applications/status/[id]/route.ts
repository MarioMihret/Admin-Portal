import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// Added constant for collection name to ensure consistency
const COLLECTION_NAME = 'organizer_applications';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for PATCH application status...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    const applicationId = params.id;
    console.log('Updating status for application with ID:', applicationId);
    
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
    console.log('Status update data:', body);
    
    // Validate status
    if (!body.status || !['pending', 'accepted', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'accepted', or 'rejected'." },
        { status: 400 }
      );
    }
    
    // Make sure feedback is provided for rejections
    if (body.status === 'rejected' && (!body.feedback || body.feedback.trim() === '')) {
      return NextResponse.json(
        { error: "Feedback is required when rejecting an application" },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      status: body.status,
      updatedAt: new Date()
    };
    
    // Add feedback if provided
    if (body.feedback) {
      updateData.feedback = body.feedback;
    }
    
    // Update the application status
    const result = await connection.db.collection(COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(applicationId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    
    if (!result) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Application status updated to ${body.status}`,
      application: result
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
} 