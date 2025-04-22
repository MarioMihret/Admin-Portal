import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for analytics reports...');
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
    
    console.log(`Generating analytics reports for period: ${period} (${startDate.toISOString()} to ${currentDate.toISOString()})`);
    
    // For demo purposes, we'll create sample analytics data
    const analyticsData = generateSampleAnalyticsData(startDate, currentDate);
    
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error generating analytics reports:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to generate analytics reports" },
      { status: 500 }
    );
  }
}

// Helper function to generate sample analytics data
function generateSampleAnalyticsData(startDate: Date, endDate: Date) {
  // Generate date range
  const daysBetween = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Create traffic trends
  const trafficTrend = [];
  const conversionTrend = [];
  
  // Random starting point for traffic
  let totalVisits = 0;
  let totalPageViews = 0;
  let totalNewUsers = 0;
  let totalSignups = 0;
  let totalRevenue = 0;
  
  // Generate daily data
  for (let i = 0; i <= daysBetween; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    
    // Format date as YYYY-MM-DD
    const dateStr = currentDay.toISOString().split('T')[0];
    
    // Traffic metrics - random numbers for demo
    const visits = Math.floor(Math.random() * 500) + 1000; // 1000-1500 visits per day
    const pageViews = visits * (Math.random() + 1.5); // 1.5-2.5 pages per visit
    const newUsers = Math.floor(visits * (Math.random() * 0.3 + 0.1)); // 10-40% new users
    
    totalVisits += visits;
    totalPageViews += pageViews;
    totalNewUsers += newUsers;
    
    trafficTrend.push({
      date: dateStr,
      visits,
      page_views: Math.round(pageViews),
      new_users: newUsers,
      bounce_rate: Math.random() * 0.4 + 0.2 // 20-60% bounce rate
    });
    
    // Conversion metrics
    const signups = Math.floor(visits * (Math.random() * 0.05 + 0.01)); // 1-6% signup rate
    const purchases = Math.floor(signups * (Math.random() * 0.3 + 0.1)); // 10-40% of signups make a purchase
    const revenue = purchases * (Math.random() * 50 + 30); // $30-80 per purchase
    
    totalSignups += signups;
    totalRevenue += revenue;
    
    conversionTrend.push({
      date: dateStr,
      signups,
      conversion_rate: signups / visits,
      purchases,
      revenue
    });
  }
  
  // Traffic sources
  const trafficSources = [
    { source: 'Direct', visits: Math.floor(totalVisits * (Math.random() * 0.2 + 0.2)) }, // 20-40%
    { source: 'Organic Search', visits: Math.floor(totalVisits * (Math.random() * 0.2 + 0.15)) }, // 15-35%
    { source: 'Social Media', visits: Math.floor(totalVisits * (Math.random() * 0.15 + 0.1)) }, // 10-25%
    { source: 'Referral', visits: Math.floor(totalVisits * (Math.random() * 0.1 + 0.05)) }, // 5-15%
    { source: 'Email', visits: Math.floor(totalVisits * (Math.random() * 0.1 + 0.05)) }, // 5-15%
    { source: 'Paid Search', visits: Math.floor(totalVisits * (Math.random() * 0.1 + 0.05)) }, // 5-15%
    { source: 'Other', visits: Math.floor(totalVisits * (Math.random() * 0.05 + 0.02)) } // 2-7%
  ];
  
  // Ensure the sum of visits equals totalVisits
  const calculatedTotal = trafficSources.reduce((sum, source) => sum + source.visits, 0);
  const adjustment = totalVisits - calculatedTotal;
  trafficSources[0].visits += adjustment; // Adjust the direct traffic to make sum equal totalVisits
  
  // Devices
  const devices = [
    { device: 'Mobile', percentage: Math.random() * 0.2 + 0.45 }, // 45-65%
    { device: 'Desktop', percentage: Math.random() * 0.2 + 0.25 }, // 25-45%
    { device: 'Tablet', percentage: Math.random() * 0.1 + 0.05 } // 5-15%
  ];
  
  // Normalize to ensure percentages add up to 1
  const totalDevicePercentage = devices.reduce((sum, device) => sum + device.percentage, 0);
  devices.forEach(device => {
    device.percentage = device.percentage / totalDevicePercentage;
  });
  
  // Popular pages
  const popularPages = [
    { path: '/', pageviews: Math.floor(totalPageViews * (Math.random() * 0.2 + 0.1)) }, // 10-30%
    { path: '/events', pageviews: Math.floor(totalPageViews * (Math.random() * 0.2 + 0.05)) }, // 5-25%
    { path: '/signup', pageviews: Math.floor(totalPageViews * (Math.random() * 0.15 + 0.05)) }, // 5-20%
    { path: '/login', pageviews: Math.floor(totalPageViews * (Math.random() * 0.1 + 0.05)) }, // 5-15%
    { path: '/about', pageviews: Math.floor(totalPageViews * (Math.random() * 0.1 + 0.03)) }, // 3-13%
    { path: '/pricing', pageviews: Math.floor(totalPageViews * (Math.random() * 0.1 + 0.03)) }, // 3-13%
    { path: '/contact', pageviews: Math.floor(totalPageViews * (Math.random() * 0.05 + 0.02)) } // 2-7%
  ];
  
  // Engagement metrics
  const avgSessionDuration = Math.floor(Math.random() * 180) + 120; // 2-5 minutes
  const avgPageViews = (totalPageViews / totalVisits).toFixed(2);
  const avgTimeOnPage = Math.floor(Math.random() * 90) + 30; // 30-120 seconds
  
  return {
    period: {
      start: startDate,
      end: endDate
    },
    summary: {
      total_visits: totalVisits,
      total_pageviews: Math.round(totalPageViews),
      avg_session_duration: avgSessionDuration,
      bounce_rate: Math.random() * 0.4 + 0.2, // 20-60%
      new_users: totalNewUsers,
      returning_users: totalVisits - totalNewUsers
    },
    trends: {
      traffic: trafficTrend,
      conversion: conversionTrend
    },
    traffic_sources: trafficSources.sort((a, b) => b.visits - a.visits), // Sort by most visits first
    devices: devices,
    popular_pages: popularPages.sort((a, b) => b.pageviews - a.pageviews), // Sort by most pageviews first
    engagement: {
      avg_session_duration: avgSessionDuration,
      avg_page_views: parseFloat(avgPageViews),
      avg_time_on_page: avgTimeOnPage,
      total_signups: totalSignups,
      conversion_rate: totalSignups / totalVisits,
      total_revenue: totalRevenue
    },
    generatedAt: new Date()
  };
} 