import mongoose, { Schema, Document } from 'mongoose';

// Image object schema
const imageObjectSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String },
  attribution: { type: String },
  height: { type: Number },
  width: { type: Number }
}, { _id: false });

// Coordinates schema
const coordinatesSchema = new Schema({
  latitude: { type: Number },
  longitude: { type: Number }
}, { _id: false });

// Location schema
const locationSchema = new Schema({
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  venueDetails: { type: String },
  coordinates: { type: coordinatesSchema }
}, { _id: false });

// Organizer schema
const organizerSchema = new Schema({
  name: { type: String },
  description: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  website: { type: String },
  logo: { type: String }
}, { _id: false });

// Ticket schema
const ticketSchema = new Schema({
  type: { type: String },
  name: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  quantity: { type: Number },
  available: { type: Number },
  description: { type: String },
  salesStart: { type: Date },
  salesEnd: { type: Date },
  isEarlyBird: { type: Boolean, default: false }
}, { _id: false });

// Event agenda item schema
const agendaItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: String, required: true },
  endTime: { type: String },
  speaker: { type: String },
  location: { type: String }
}, { _id: false });

// Metadata schema
const metadataSchema = new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  featured: { type: Boolean, default: false },
  promoted: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, { _id: false });

// Event schema
const eventSchema = new Schema({
  title: { type: String, required: true, index: true },
  shortDescription: { type: String },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Conference', 'Workshop', 'Seminar', 'Meetup', 'Webinar', 'Training', 'Networking', 'Social', 'Other'],
    default: 'Other'
  },
  date: { type: Date, required: true, index: true },
  endDate: { type: Date },
  duration: { type: Number }, // Duration in minutes
  time: { type: String },
  location: { type: locationSchema },
  isVirtual: { type: Boolean, default: false },
  meetingLink: { type: String },
  streamingPlatform: { 
    type: String,
    enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Webex', 'YouTube', 'Facebook', 'Twitch', 'Other'],
  },
  organizerId: { type: Schema.Types.ObjectId, ref: 'User' },
  organizer: { type: organizerSchema },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  tickets: [ticketSchema],
  attendees: { type: Number, default: 0 },
  maxAttendees: { type: Number },
  minimumAttendees: { type: Number },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Cancelled', 'Postponed', 'Sold Out', 'Completed'],
    default: 'Draft'
  },
  visibility: { 
    type: String, 
    enum: ['Public', 'Private', 'Unlisted'],
    default: 'Public'
  },
  skillLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'All Levels'
  },
  requirements: [{ type: String }],
  targetAudience: [{ type: String }],
  agenda: [agendaItemSchema],
  tags: [{ type: String, index: true }],
  
  // Legacy image fields
  image: { type: String },
  imageUrl: { type: String },
  
  // New image fields
  coverImage: { type: imageObjectSchema },
  logo: { type: imageObjectSchema },
  
  registrationDeadline: { type: Date },
  earlyBirdDeadline: { type: Date },
  refundPolicy: { type: String },
  metadata: { type: metadataSchema, default: {} },
  
  // System fields
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  versionKey: false
});

// Create text index for search functionality
eventSchema.index({ 
  title: 'text', 
  description: 'text',
  shortDescription: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    shortDescription: 5,
    tags: 3,
    description: 1
  },
  name: 'TextSearchIndex'
});

// Check if the model exists before creating
export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema); 