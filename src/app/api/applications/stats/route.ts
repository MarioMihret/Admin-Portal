import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

// Added constant for collection name to ensure consistency
const COLLECTION_NAME = 'organizer_applications';

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for GET application stats...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Ensure database connection is established
    if (!connection || !connection.db) {
      throw new Error("Database connection failed");
    }
    
    console.log('Getting application statistics from collection:', COLLECTION_NAME);
    
    // Get total count
    const total = await connection.db.collection(COLLECTION_NAME).countDocuments({});
    
    // Get pending count
    const pending = await connection.db.collection(COLLECTION_NAME).countDocuments({ status: 'pending' });
    
    // Get approved count
    const approved = await connection.db.collection(COLLECTION_NAME).countDocuments({ status: 'accepted' });
    
    // Get rejected count
    const rejected = await connection.db.collection(COLLECTION_NAME).countDocuments({ status: 'rejected' });
    
    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await connection.db.collection(COLLECTION_NAME).countDocuments({
      createdAt: { $gte: today }
    });
    
    const stats = {
      total,
      pending,
      approved,
      rejected,
      today: todayCount
    };
    
    console.log('Application stats:', stats);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error getting application stats:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to get application statistics" },
      { status: 500 }
    );
  }
} 