import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for user reports...');
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
    
    console.log(`Generating user reports for period: ${period} (${startDate.toISOString()} to ${currentDate.toISOString()})`);
    
    // For demo purposes, we'll create sample user data since we don't have a user collection
    const sampleUserData = generateSampleUserData(startDate, currentDate);
    
    return NextResponse.json(sampleUserData);
  } catch (error) {
    console.error("Error generating user reports:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to generate user reports" },
      { status: 500 }
    );
  }
}

// Helper function to generate sample user report data
function generateSampleUserData(startDate: Date, endDate: Date) {
  // Generate date range
  const daysBetween = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Create daily registration trend
  const registrationTrend = [];
  const activityTrend = [];
  let totalUsers = 5000 + Math.floor(Math.random() * 2000); // Starting point
  
  for (let i = 0; i <= daysBetween; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    
    // Format date as YYYY-MM-DD
    const dateStr = currentDay.toISOString().split('T')[0];
    
    // Random registrations between 10-100 per day
    const newUsers = Math.floor(Math.random() * 90) + 10;
    totalUsers += newUsers;
    
    // Random active users between 100-500 per day
    const activeUsers = Math.floor(Math.random() * 400) + 100;
    
    registrationTrend.push({
      date: dateStr,
      new_users: newUsers,
      total_users: totalUsers
    });
    
    activityTrend.push({
      date: dateStr,
      active_users: activeUsers,
      sessions: activeUsers * (Math.floor(Math.random() * 3) + 1), // 1-4 sessions per user
      avg_session_duration: Math.floor(Math.random() * 10) + 5 // 5-15 minutes
    });
  }
  
  // Demographics (sample data)
  const demographics = {
    gender: [
      { category: "Male", count: Math.floor(totalUsers * 0.48) },
      { category: "Female", count: Math.floor(totalUsers * 0.46) },
      { category: "Other", count: Math.floor(totalUsers * 0.04) },
      { category: "Prefer not to say", count: Math.floor(totalUsers * 0.02) }
    ],
    age: [
      { category: "18-24", count: Math.floor(totalUsers * 0.22) },
      { category: "25-34", count: Math.floor(totalUsers * 0.35) },
      { category: "35-44", count: Math.floor(totalUsers * 0.25) },
      { category: "45-54", count: Math.floor(totalUsers * 0.10) },
      { category: "55+", count: Math.floor(totalUsers * 0.08) }
    ],
    location: [
      { category: "North America", count: Math.floor(totalUsers * 0.45) },
      { category: "Europe", count: Math.floor(totalUsers * 0.30) },
      { category: "Asia", count: Math.floor(totalUsers * 0.15) },
      { category: "Other", count: Math.floor(totalUsers * 0.10) }
    ]
  };
  
  // User retention (sample data)
  const retention = {
    "1day": Math.random() * 0.2 + 0.7, // 70-90%
    "7days": Math.random() * 0.3 + 0.5, // 50-80%
    "30days": Math.random() * 0.3 + 0.3, // 30-60%
    "90days": Math.random() * 0.3 + 0.2, // 20-50%
  };
  
  return {
    period: {
      start: startDate,
      end: endDate
    },
    summary: {
      total_users: totalUsers,
      new_users: registrationTrend.reduce((sum, day) => sum + day.new_users, 0),
      active_users: Math.floor(totalUsers * (Math.random() * 0.3 + 0.2)), // 20-50% of total users are active
      avg_session_duration: Math.floor(Math.random() * 10) + 5 // 5-15 minutes
    },
    trends: {
      registration: registrationTrend,
      activity: activityTrend
    },
    demographics: demographics,
    retention: retention,
    generatedAt: new Date()
  };
} 