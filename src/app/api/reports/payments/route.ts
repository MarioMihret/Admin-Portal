import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for payment reports...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "30days"; // 7days, 30days, 90days, thisMonth, lastMonth, thisYear
    
    // Calculate date ranges based on period
    const currentDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "7days":
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(currentDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(currentDate.getDate() - 90);
        break;
      case "thisMonth":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      case "lastMonth":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        currentDate.setDate(lastDayOfLastMonth);
        currentDate.setMonth(currentDate.getMonth() - 1);
        break;
      case "thisYear":
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(currentDate.getDate() - 30);
    }
    
    console.log(`Generating payment reports for period: ${period} (${startDate.toISOString()} to ${currentDate.toISOString()})`);
    
    // Query parameters
    const dateQuery = {
      payment_date: {
        $gte: startDate,
        $lte: currentDate
      }
    };
    
    // Get overall metrics
    const totalPayments = await Payment.countDocuments(dateQuery);
    
    // Get payment status counts
    const successfulPayments = await Payment.countDocuments({
      ...dateQuery,
      status: "success"
    });
    
    const pendingPayments = await Payment.countDocuments({
      ...dateQuery,
      status: "pending"
    });
    
    const failedPayments = await Payment.countDocuments({
      ...dateQuery,
      status: "failed"
    });
    
    // Get revenue metrics
    const revenueData = await Payment.aggregate([
      { $match: { ...dateQuery, status: "success" } },
      { $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" }
        }
      }
    ]).then(result => result[0] || { totalRevenue: 0, averageAmount: 0, maxAmount: 0, minAmount: 0 });
    
    // Get daily payment trends
    let trendQuery = [];
    
    // Set the appropriate grouping based on period
    let dateFormat;
    if (period === "7days" || period === "30days") {
      // Daily grouping for shorter periods
      dateFormat = { 
        year: { $year: "$payment_date" }, 
        month: { $month: "$payment_date" }, 
        day: { $dayOfMonth: "$payment_date" }
      };
    } else if (period === "90days" || period === "thisYear") {
      // Weekly grouping for longer periods
      dateFormat = { 
        year: { $year: "$payment_date" }, 
        week: { $week: "$payment_date" }
      };
    } else {
      // Daily grouping for other periods
      dateFormat = { 
        year: { $year: "$payment_date" }, 
        month: { $month: "$payment_date" }, 
        day: { $dayOfMonth: "$payment_date" }
      };
    }
    
    trendQuery = [
      { $match: dateQuery },
      { $group: {
          _id: dateFormat,
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
          successful: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ];
    
    const paymentTrends = await Payment.aggregate(trendQuery);
    
    // Format trend data for visualization
    const formattedTrends = paymentTrends.map(day => {
      let dateStr;
      if (day._id.week) {
        // Format as Week X of YYYY
        dateStr = `Week ${day._id.week} of ${day._id.year}`;
      } else {
        // Format as YYYY-MM-DD
        const month = day._id.month.toString().padStart(2, '0');
        const dayNum = day._id.day?.toString().padStart(2, '0') || '01';
        dateStr = `${day._id.year}-${month}-${dayNum}`;
      }
      
      return {
        date: dateStr,
        total: day.count,
        revenue: day.revenue,
        successful: day.successful,
        failed: day.failed,
        pending: day.pending,
      };
    });
    
    // Get payment method/currency distribution
    const currencyDistribution = await Payment.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: "$currency",
          count: { $sum: 1 },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return NextResponse.json({
      period,
      dateRange: {
        from: startDate,
        to: currentDate
      },
      summary: {
        totalPayments,
        successfulPayments,
        pendingPayments,
        failedPayments,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
      },
      revenue: {
        total: revenueData.totalRevenue || 0,
        average: revenueData.averageAmount || 0,
        max: revenueData.maxAmount || 0,
        min: revenueData.minAmount || 0
      },
      trends: formattedTrends,
      distribution: {
        currency: currencyDistribution,
      },
      generatedAt: new Date()
    });
  } catch (error) {
    console.error("Error generating payment reports:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to generate payment reports" },
      { status: 500 }
    );
  }
} 