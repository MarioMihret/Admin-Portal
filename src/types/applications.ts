export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PreviousEvent {
  name: string;
  date: string;
  attendees: number;
  location: string;
}

export interface SocialMedia {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

export interface OrganizerApplication {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  organization: string;
  website?: string;
  department?: string;
  role?: string;
  yearOfStudy?: string;
  studentId?: string;
  experience?: string;
  reason?: string;
  availability?: string;
  idDocumentUrl?: string;
  profilePhotoUrl?: string;
  termsAccepted?: boolean;
  newsletterSubscription?: boolean;
  submittedDate: string;
  status: ApplicationStatus;
  description: string;
  previousEvents?: PreviousEvent[];
  socialMedia?: SocialMedia;
  skills?: string[];
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
} 