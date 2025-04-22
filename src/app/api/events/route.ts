import { connectToDatabase } from "@/lib/db";
import { Event } from "@/models/Event";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database for events...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Get query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const category = url.searchParams.get("category") || null;
    const status = url.searchParams.get("status") || null;
    const startDate = url.searchParams.get("startDate") || null;
    const endDate = url.searchParams.get("endDate") || null;
    const isVirtual = url.searchParams.get("isVirtual") || null;
    const skillLevel = url.searchParams.get("skillLevel") || null;
    const featured = url.searchParams.get("featured") || null;
    const visibility = url.searchParams.get("visibility") || null;
    const sortBy = url.searchParams.get("sortBy") || "date";
    const sortOrder = url.searchParams.get("sortOrder") || "asc";
    const tags = url.searchParams.get("tags") ? url.searchParams.get("tags")?.split(',') : null;
    
    console.log('Querying events with params:', { 
      search, limit, page, skip, category, status, 
      startDate, endDate, isVirtual, featured, tags 
    });
    
    // Create base query object
    let query: any = {};
    
    // Apply text search if provided
    if (search && search.trim() !== '') {
      // Use the text index if it's a simple search
      query.$text = { $search: search };
    }
    
    // Apply filters if provided
    if (category) query.category = category;
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;
    if (skillLevel) query.skillLevel = skillLevel;
    if (isVirtual === 'true') query.isVirtual = true;
    if (isVirtual === 'false') query.isVirtual = false;
    if (featured === 'true') query.isFeatured = true;
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Tags filter (match any of the provided tags)
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    
    console.log('Executing query on events collection:', JSON.stringify(query));
    
    // Determine sort configuration
    const sortConfig: any = {};
    
    // Map frontend sort values to DB fields
    const sortFieldMap: Record<string, string> = {
      'date': 'date',
      'title': 'title',
      'createdAt': 'createdAt',
      'attendees': 'attendees',
      'price': 'price'
    };
    
    // Set sort field and order
    const sortField = sortFieldMap[sortBy] || 'date';
    sortConfig[sortField] = sortOrder === 'desc' ? -1 : 1;
    
    // Add secondary sort (date always second, createdAt third for consistency)
    if (sortField !== 'date') sortConfig.date = 1;
    if (sortField !== 'createdAt' && sortField !== 'date') sortConfig.createdAt = -1;
    
    // Fetch events with pagination and sorting
    const events = await Event.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${events.length} events`);
    
    // Get total count for pagination
    const total = await Event.countDocuments(query);
    console.log('Total events count:', total);
    
    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Connecting to database for creating event...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const body = await request.json();
    
    console.log('Creating event with title:', body.title);
    
    // Basic validation for required fields
    if (!body.title || !body.description || !body.category || !body.date) {
      return NextResponse.json(
        { error: "Title, description, category, and date are required" },
        { status: 400 }
      );
    }
    
    // Convert date fields to Date objects
    const dateFields = ['date', 'endDate', 'registrationDeadline', 'earlyBirdDeadline'];
    dateFields.forEach(field => {
      if (body[field]) {
        try {
          body[field] = new Date(body[field]);
        } catch (e) {
          console.error(`Error converting ${field} to Date:`, e);
        }
      }
    });
    
    // Process ticket dates if present
    if (body.tickets && Array.isArray(body.tickets)) {
      body.tickets = body.tickets.map((ticket: any) => {
        if (ticket.salesStart) {
          try {
            ticket.salesStart = new Date(ticket.salesStart);
          } catch (e) {
            console.error('Error converting ticket salesStart to Date:', e);
          }
        }
        if (ticket.salesEnd) {
          try {
            ticket.salesEnd = new Date(ticket.salesEnd);
          } catch (e) {
            console.error('Error converting ticket salesEnd to Date:', e);
          }
        }
        return ticket;
      });
    }
    
    // Set timestamps
    body.createdAt = new Date();
    body.updatedAt = new Date();
    
    // Create new event
    console.log('Creating new event in database...');
    const newEvent = await Event.create(body);
    
    console.log('Event created successfully with ID:', newEvent._id);
    
    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
} 