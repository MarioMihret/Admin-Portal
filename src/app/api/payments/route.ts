import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for payments...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Get query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    console.log('Querying payments with params:', { search, status, limit, page, skip });
    
    // Create a query object for searching
    let query: any = {};
    
    // Add status filter if provided
    if (status && status !== "all") {
      query.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { tx_ref: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } }
      ];
    }
    
    console.log('Executing query on payments collection:', query);
    
    // Fetch payments with pagination
    const payments = await Payment.find(query)
      .sort({ payment_date: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${payments.length} payments`);
    
    // Process payments to ensure all have the required fields
    const processedPayments = payments.map(payment => ({
      _id: payment._id || null,
      tx_ref: payment.tx_ref || `unknown-${Date.now()}`,
      amount: payment.amount || 0,
      currency: payment.currency || "USD",
      email: payment.email || "unknown@example.com",
      first_name: payment.first_name || "Unknown",
      last_name: payment.last_name || "User",
      status: payment.status || "pending",
      payment_date: payment.payment_date || new Date(),
      callback_response: payment.callback_response || null
    }));
    
    // Get total count for pagination
    const total = await Payment.countDocuments(query);
    console.log('Total payments count:', total);
    
    // Get summary metrics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).then(result => result[0]?.total || 0);
    
    // Get individual counts for each status - more reliable than aggregate
    const successCount = await Payment.countDocuments({ ...query, status: "success" });
    const pendingCount = await Payment.countDocuments({ ...query, status: "pending" });
    const failedCount = await Payment.countDocuments({ ...query, status: "failed" });
    
    // Use direct counts instead of aggregate
    const statusCounts = {
      success: successCount,
      pending: pendingCount,
      failed: failedCount
    };
    
    return NextResponse.json({
      payments: processedPayments,
      metrics: {
        totalRevenue,
        statusCounts
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Connecting to database for creating payment...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const body = await request.json();
    const { 
      tx_ref, 
      amount, 
      currency,
      email,
      first_name,
      last_name,
      status, 
      payment_date,
      callback_response
    } = body;
    
    // Basic validation
    if (!tx_ref || !amount || !email || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Missing required payment fields" },
        { status: 400 }
      );
    }
    
    // Check if payment with tx_ref already exists
    const existingPayment = await Payment.findOne({ tx_ref });
    if (existingPayment) {
      console.log('Payment with this tx_ref already exists:', tx_ref);
      return NextResponse.json(
        { error: "Payment with this tx_ref already exists" },
        { status: 409 }
      );
    }
    
    // Create new payment
    console.log('Creating new payment in database...');
    const newPayment = await Payment.create({
      tx_ref,
      amount,
      currency: currency || "USD",
      email,
      first_name,
      last_name,
      status: status || "pending",
      payment_date: payment_date || new Date(),
      callback_response
    });
    
    console.log('Payment created successfully with ID:', newPayment._id);
    
    return NextResponse.json({ payment: newPayment }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
} 