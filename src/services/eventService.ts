// Type definitions
export type EventCategory = 'Conference' | 'Workshop' | 'Seminar' | 'Meetup' | 'Webinar' | 'Training' | 'Networking' | 'Social' | 'Other';
export type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Postponed' | 'Sold Out' | 'Completed' | 'Upcoming';
export type EventVisibility = 'Public' | 'Private' | 'Unlisted';
export type EventSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type StreamingPlatform = 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Webex' | 'YouTube' | 'Facebook' | 'Twitch' | 'Other';

export interface Coordinates {
  latitude?: number;
  longitude?: number;
}

export interface EventLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  venueDetails?: string;
  coordinates?: Coordinates;
}

export interface EventOrganizer {
  name?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logo?: string;
}

export interface EventTicket {
  type?: string;
  name?: string;
  price: number;
  currency?: string;
  quantity?: number;
  available?: number;
  description?: string;
  salesStart?: string;
  salesEnd?: string;
  isEarlyBird?: boolean;
}

export interface EventAgendaItem {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  speaker?: string;
  location?: string;
}

export interface ImageObject {
  url: string;
  alt?: string;
  attribution?: string;
  height?: number;
  width?: number;
}

export interface EventMetadata {
  createdBy?: string;
  updatedBy?: string;
  featured?: boolean;
  promoted?: boolean;
  views?: number;
  shares?: number;
  likes?: number;
}

export interface Event {
  _id: string;
  title: string;
  shortDescription?: string;
  description: string;
  category: EventCategory;
  date: string;
  endDate?: string;
  duration?: number;
  location?: EventLocation;
  isVirtual: boolean;
  meetingLink?: string;
  streamingPlatform?: StreamingPlatform;
  organizerId: string;
  organizer: EventOrganizer;
  price: number;
  currency: string;
  tickets?: EventTicket[];
  attendees: number;
  maxAttendees?: number;
  minimumAttendees?: number;
  status: EventStatus;
  visibility: EventVisibility;
  skillLevel?: EventSkillLevel;
  requirements?: string[];
  targetAudience?: string[];
  agenda?: EventAgendaItem[];
  tags?: string[];
  
  // Legacy image field as string URL
  image?: string;
  imageUrl?: string;
  
  // New image fields as objects with attribution
  coverImage?: ImageObject;
  logo?: ImageObject;
  
  registrationDeadline?: string;
  earlyBirdDeadline?: string;
  refundPolicy?: string;
  metadata: EventMetadata;
  
  // System fields
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface EventsResponse {
  events: Event[];
  pagination: PaginationResult;
}

export interface EventResponse {
  event: Event;
}

export interface CreateEventInput {
  title: string;
  shortDescription?: string;
  description: string;
  category: EventCategory;
  date: string;
  endDate?: string;
  duration?: number;
  location?: EventLocation;
  isVirtual?: boolean;
  meetingLink?: string;
  streamingPlatform?: StreamingPlatform;
  organizerId?: string;
  organizer?: EventOrganizer;
  price?: number;
  currency?: string;
  tickets?: EventTicket[];
  maxAttendees?: number;
  minimumAttendees?: number;
  status?: EventStatus;
  visibility?: EventVisibility;
  skillLevel?: EventSkillLevel;
  requirements?: string[];
  targetAudience?: string[];
  agenda?: EventAgendaItem[];
  tags?: string[];
  image?: string;
  imageUrl?: string;
  coverImage?: ImageObject;
  logo?: ImageObject;
  registrationDeadline?: string;
  earlyBirdDeadline?: string;
  refundPolicy?: string;
  metadata?: EventMetadata;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

// API methods
export const eventService = {
  // Get all events with pagination and search
  getEvents: async (search: string = '', page: number = 1, limit: number = 10, category: string = '', status: string = ''): Promise<EventsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (category && category !== 'All') queryParams.append('category', category);
      if (status && status !== 'All') queryParams.append('status', status);

      const response = await fetch(`/api/events?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching events: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getEvents service:', error);
      throw error;
    }
  },
  
  // Get a single event by ID
  getEventById: async (id: string): Promise<EventResponse> => {
    try {
      const response = await fetch(`/api/events/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching event: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getEventById service:', error);
      throw error;
    }
  },
  
  // Create a new event
  createEvent: async (eventData: CreateEventInput): Promise<EventResponse> => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error creating event: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in createEvent service:', error);
      throw error;
    }
  },
  
  // Update an existing event
  updateEvent: async (id: string, eventData: UpdateEventInput): Promise<EventResponse> => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error updating event: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in updateEvent service:', error);
      throw error;
    }
  },
  
  // Delete an event
  deleteEvent: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error deleting event: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in deleteEvent service:', error);
      throw error;
    }
  },
}; 