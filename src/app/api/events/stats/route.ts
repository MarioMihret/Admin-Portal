import { connectToDatabase } from "@/lib/db";
import { Event } from "@/models/Event";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for event statistics...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Get date range parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") || null;
    const endDate = url.searchParams.get("endDate") || null;
    
    // Build date filter if dates are provided
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Basic statistics
    const totalEventsPromise = Event.countDocuments({});
    const upcomingEventsPromise = Event.countDocuments({ 
      date: { $gt: new Date() },
      status: { $nin: ['Cancelled', 'Completed'] }
    });
    const pastEventsPromise = Event.countDocuments({ 
      date: { $lt: new Date() }
    });
    const featuredEventsPromise = Event.countDocuments({ isFeatured: true });
    
    // Events by status
    const statusStatsPromise = Event.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Events by category
    const categoryStatsPromise = Event.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Virtual vs In-person events
    const virtualStatsPromise = Event.aggregate([
      { $group: { _id: "$isVirtual", count: { $sum: 1 } } }
    ]);
    
    // Recent events (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEventsPromise = Event.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Total attendees
    const totalAttendeesPromise = Event.aggregate([
      { $group: { _id: null, total: { $sum: "$attendees" } } }
    ]);
    
    // Most popular events (by attendees)
    const popularEventsPromise = Event.find({})
      .sort({ attendees: -1 })
      .limit(5)
      .select('title attendees maxAttendees date category');
    
    // Events timeline (count by month)
    const timelinePromise = Event.aggregate([
      {
        $group: {
          _id: { 
            year: { $year: "$date" }, 
            month: { $month: "$date" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Execute all promises
    const [
      totalEvents,
      upcomingEvents,
      pastEvents,
      featuredEvents,
      statusStats,
      categoryStats,
      virtualStats,
      recentEvents,
      totalAttendees,
      popularEvents,
      timeline
    ] = await Promise.all([
      totalEventsPromise,
      upcomingEventsPromise,
      pastEventsPromise,
      featuredEventsPromise,
      statusStatsPromise,
      categoryStatsPromise,
      virtualStatsPromise,
      recentEventsPromise,
      totalAttendeesPromise,
      popularEventsPromise,
      timelinePromise
    ]);
    
    // Process virtual stats for clearer output
    const virtualEventsMap = virtualStats.reduce((acc: any, curr: any) => {
      acc[curr._id ? 'virtual' : 'inPerson'] = curr.count;
      return acc;
    }, { virtual: 0, inPerson: 0 });
    
    // Format timeline data
    const formattedTimeline = timeline.map((item: any) => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      count: item.count
    }));
    
    return NextResponse.json({
      summary: {
        totalEvents,
        upcomingEvents,
        pastEvents,
        featuredEvents,
        recentEvents,
        totalAttendees: totalAttendees[0]?.total || 0
      },
      timeline: formattedTimeline,
      popularEvents,
      categoriesDistribution: categoryStats,
      statusDistribution: statusStats,
      virtualDistribution: virtualEventsMap
    });
    
  } catch (error) {
    console.error("Error fetching event statistics:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch event statistics" },
      { status: 500 }
    );
  }
} 