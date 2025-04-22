import { connectToDatabase } from "@/lib/db";
import { Event } from "@/models/Event";
import { NextResponse } from "next/server";
import { EventTicket } from "@/services/eventService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for GET event by ID...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const eventId = params.id;
    console.log('Fetching event with ID:', eventId);
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    const event = await Event.findById(eventId);
    console.log('Event found:', !!event);
    
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for PATCH event...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const eventId = params.id;
    console.log('Updating event with ID:', eventId);
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Process date fields to ensure they're Date objects
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
      body.tickets = body.tickets.map((ticket: EventTicket) => {
        if (ticket.salesStart) {
          try {
            ticket.salesStart = new Date(ticket.salesStart).toISOString();
          } catch (e) {
            console.error('Error converting ticket salesStart to Date:', e);
          }
        }
        if (ticket.salesEnd) {
          try {
            ticket.salesEnd = new Date(ticket.salesEnd).toISOString();
          } catch (e) {
            console.error('Error converting ticket salesEnd to Date:', e);
          }
        }
        return ticket;
      });
    }
    
    // Set updatedAt
    body.updatedAt = new Date();
    
    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!updatedEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database for DELETE event...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const eventId = params.id;
    console.log('Deleting event with ID:', eventId);
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    
    if (!deletedEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
} 