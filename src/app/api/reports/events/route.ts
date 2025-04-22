import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for event reports...');
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
    
    console.log(`Generating event reports for period: ${period} (${startDate.toISOString()} to ${currentDate.toISOString()})`);
    
    // For demo purposes, we'll create sample event data since we don't have an event collection
    const sampleEventData = generateSampleEventData(startDate, currentDate);
    
    return NextResponse.json(sampleEventData);
  } catch (error) {
    console.error("Error generating event reports:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to generate event reports" },
      { status: 500 }
    );
  }
}

// Event categories for demo data
const EVENT_CATEGORIES = [
  'Conference', 'Workshop', 'Webinar', 'Meetup', 'Seminar', 
  'Concert', 'Exhibition', 'Festival', 'Charity', 'Other'
];

// Helper function to generate sample event report data
function generateSampleEventData(startDate: Date, endDate: Date) {
  // Generate date range
  const daysBetween = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Create daily event trend
  const eventTrend = [];
  const attendanceTrend = [];
  
  let totalEvents = 0;
  let totalAttendees = 0;
  let totalRevenue = 0;
  
  // Create category data
  const categoryData = EVENT_CATEGORIES.map(category => {
    const count = Math.floor(Math.random() * 50) + 10;
    const attendees = count * (Math.floor(Math.random() * 50) + 20);
    const avgTicketPrice = Math.floor(Math.random() * 50) + 10;
    
    return {
      category,
      count,
      attendees,
      revenue: attendees * avgTicketPrice
    };
  });
  
  // Calculate totals from categories
  categoryData.forEach(cat => {
    totalEvents += cat.count;
    totalAttendees += cat.attendees;
    totalRevenue += cat.revenue;
  });
  
  // Generate daily data
  for (let i = 0; i <= daysBetween; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    
    // Format date as YYYY-MM-DD
    const dateStr = currentDay.toISOString().split('T')[0];
    
    // Random events between 1-15 per day
    const dailyEvents = Math.floor(Math.random() * 15) + 1;
    
    // Random attendees between 20-200 per event
    const dailyAttendees = dailyEvents * (Math.floor(Math.random() * 180) + 20);
    
    // Random revenue $10-$50 per attendee
    const dailyRevenue = dailyAttendees * (Math.floor(Math.random() * 40) + 10);
    
    eventTrend.push({
      date: dateStr,
      events: dailyEvents,
      categories: Math.min(Math.floor(Math.random() * 5) + 1, EVENT_CATEGORIES.length)
    });
    
    attendanceTrend.push({
      date: dateStr,
      attendees: dailyAttendees,
      revenue: dailyRevenue,
      avg_ticket_price: Math.round(dailyRevenue / dailyAttendees)
    });
  }
  
  // Generate time distribution (when events are typically scheduled)
  const timeDistribution = [
    { time: 'Morning (6am-12pm)', percentage: Math.random() * 0.3 + 0.1 },
    { time: 'Afternoon (12pm-5pm)', percentage: Math.random() * 0.3 + 0.2 },
    { time: 'Evening (5pm-9pm)', percentage: Math.random() * 0.4 + 0.3 },
    { time: 'Night (9pm-6am)', percentage: Math.random() * 0.2 }
  ];
  
  // Normalize percentages to sum to 100%
  const totalPercentage = timeDistribution.reduce((sum, item) => sum + item.percentage, 0);
  timeDistribution.forEach(item => {
    item.percentage = item.percentage / totalPercentage;
  });
  
  // Generate engagement metrics
  const engagement = {
    avg_satisfaction: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 rating
    repeat_attendees: Math.random() * 0.3 + 0.1, // 10%-40% of attendees are repeat visitors
    social_shares: Math.floor(totalAttendees * (Math.random() * 0.3 + 0.1)), // 10%-40% of attendees share on social
    avg_duration: Math.floor(Math.random() * 90) + 30 // 30-120 minutes average duration
  };
  
  return {
    period: {
      start: startDate,
      end: endDate
    },
    summary: {
      total_events: totalEvents,
      total_attendees: totalAttendees,
      avg_attendance: Math.round(totalAttendees / totalEvents),
      total_revenue: totalRevenue,
      avg_ticket_price: Math.round(totalRevenue / totalAttendees)
    },
    trends: {
      events: eventTrend,
      attendance: attendanceTrend
    },
    categories: categoryData.sort((a, b) => b.count - a.count), // Sort by most popular
    time_distribution: timeDistribution,
    engagement,
    generatedAt: new Date()
  };
} 