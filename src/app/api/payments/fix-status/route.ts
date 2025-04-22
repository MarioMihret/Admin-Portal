import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { NextResponse } from "next/server";

// A route to fix any payments with invalid status values
// This can be run once to clean up the database
export async function GET(request: Request) {
  try {
    // Check for admin authorization - this would use your actual auth logic
    // For example:
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Connect to the database
    console.log('Connecting to database to fix payment statuses...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');

    // Get all payments with invalid status
    const validStatuses = ["pending", "success", "failed"];
    const invalidPayments = await Payment.find({
      status: { $nin: validStatuses }
    });

    if (invalidPayments.length === 0) {
      return NextResponse.json({
        message: "No payments with invalid status found",
        fixed: 0
      });
    }

    console.log(`Found ${invalidPayments.length} payments with invalid status`);
    
    // Fix the status - map any invalid status to "pending"
    const updatePromises = invalidPayments.map(payment => {
      console.log(`Fixing payment ${payment._id} with invalid status: "${payment.status}"`);
      
      return Payment.updateOne(
        { _id: payment._id },
        { $set: { status: "pending", updatedAt: new Date() } }
      );
    });

    // Execute all updates
    const updateResults = await Promise.all(updatePromises);
    
    // Count modified documents
    const totalFixed = updateResults.reduce((sum, result) => sum + result.modifiedCount, 0);

    return NextResponse.json({
      message: "Fixed payments with invalid status",
      found: invalidPayments.length,
      fixed: totalFixed,
      details: invalidPayments.map(p => ({ id: p._id, tx_ref: p.tx_ref, oldStatus: p.status }))
    });
  } catch (error) {
    console.error("Error fixing payment statuses:", error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fix payment statuses" },
      { status: 500 }
    );
  }
} 