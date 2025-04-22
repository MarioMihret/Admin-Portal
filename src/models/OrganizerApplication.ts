import mongoose from 'mongoose';

const organizerApplicationSchema = new mongoose.Schema({
  // Personal Information
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  
  // Academic Information
  university: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  yearOfStudy: String,
  studentId: String,
  
  // Experience & Motivation
  experience: { type: String, required: true },
  reason: { type: String, required: true },
  skills: [String],
  availability: { type: String, required: true },
  
  // Files
  idDocumentUrl: { type: String, required: true },
  profilePhotoUrl: { type: String, required: true },
  
  // Terms
  termsAccepted: { type: Boolean, required: true },
  newsletterSubscription: { type: Boolean, default: false },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  adminFeedback: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create text index for search functionality
organizerApplicationSchema.index({ 
  fullName: 'text', 
  email: 'text',
  university: 'text',
  department: 'text',
  experience: 'text',
  reason: 'text'
}, {
  weights: {
    fullName: 10,
    email: 8,
    university: 6,
    department: 5,
    experience: 4,
    reason: 3
  },
  name: 'TextSearchIndex'
});

export default mongoose.models.OrganizerApplication || 
  mongoose.model('OrganizerApplication', organizerApplicationSchema); 