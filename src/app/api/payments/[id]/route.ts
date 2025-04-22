import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { NextResponse } from "next/server";

// GET a single payment by ID (either MongoDB _id or tx_ref)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database to fetch payment...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const id = params.id;
    console.log('Fetching payment with ID:', id);
    
    // Try to find payment by either MongoDB _id or tx_ref
    let payment;
    
    // Check if it might be a MongoDB ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      payment = await Payment.findById(id);
    }
    
    // If not found by _id, try tx_ref
    if (!payment) {
      payment = await Payment.findOne({ tx_ref: id });
    }
    
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }
    
    // Ensure payment has all required fields
    const paymentData = {
      _id: payment._id || null,
      tx_ref: payment.tx_ref || `unknown-${Date.now()}`,
      amount: payment.amount || 0,
      currency: payment.currency || "USD",
      email: payment.email || "unknown@example.com",
      first_name: payment.first_name || "Unknown",
      last_name: payment.last_name || "User",
      status: payment.status || "pending",
      payment_date: payment.payment_date || new Date(),
      callback_response: payment.callback_response || null,
      createdAt: payment.createdAt || new Date(),
      updatedAt: payment.updatedAt || new Date()
    };
    
    console.log('Payment found:', payment._id);
    return NextResponse.json({ payment: paymentData });
  } catch (error) {
    console.error("Error fetching payment:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

// PATCH - Update payment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database to update payment...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const id = params.id;
    const body = await request.json();
    console.log('Updating payment with ID:', id);
    
    // Fields that can be updated
    const {
      status,
      callback_response
    } = body;
    
    // Create update object
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Only add fields that are provided
    if (status) updateData.status = status;
    if (callback_response) updateData.callback_response = callback_response;
    
    // Find and update the payment
    let payment;
    
    // Check if it might be a MongoDB ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      payment = await Payment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
    }
    
    // If not found by _id, try tx_ref
    if (!payment) {
      payment = await Payment.findOneAndUpdate(
        { tx_ref: id },
        { $set: updateData },
        { new: true }
      );
    }
    
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }
    
    // Ensure payment has all required fields
    const paymentData = {
      _id: payment._id || null,
      tx_ref: payment.tx_ref || `unknown-${Date.now()}`,
      amount: payment.amount || 0,
      currency: payment.currency || "USD",
      email: payment.email || "unknown@example.com",
      first_name: payment.first_name || "Unknown",
      last_name: payment.last_name || "User",
      status: payment.status || "pending",
      payment_date: payment.payment_date || new Date(),
      callback_response: payment.callback_response || null,
      createdAt: payment.createdAt || new Date(),
      updatedAt: payment.updatedAt || new Date()
    };
    
    console.log('Payment updated successfully:', payment._id);
    return NextResponse.json({ payment: paymentData });
  } catch (error) {
    console.error("Error updating payment:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete payment (usually soft-delete or only for admins)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database to delete payment...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const id = params.id;
    console.log('Deleting payment with ID:', id);
    
    // Find and delete the payment
    let result;
    
    // Check if it might be a MongoDB ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await Payment.findByIdAndDelete(id);
    }
    
    // If not found by _id, try tx_ref
    if (!result) {
      result = await Payment.findOneAndDelete({ tx_ref: id });
    }
    
    if (!result) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }
    
    console.log('Payment deleted successfully');
    return NextResponse.json(
      { message: "Payment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payment:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
} 