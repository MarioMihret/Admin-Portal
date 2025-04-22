import { OrganizerApplication, ApplicationStats, ApplicationStatus } from '@/types/applications';

// Update API_URL to ensure correct endpoint
const API_URL = '/api/applications';

// Get all applications with optional filtering
export async function getApplications(filters = {}): Promise<OrganizerApplication[]> {
  try {
    // Log that we're fetching applications
    console.log('Fetching organizer applications with filters:', filters);
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching applications: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API response for applications:', data);
    
    // Ensure the correct collection name is being used in the API
    // This won't directly change the collection name, but helps for debugging
    console.log('Expected collection name: organizer_applications');
    
    const mappedApplications = mapApiApplications(data.applications || []);
    console.log(`Loaded ${mappedApplications.length} organizer applications`);
    
    return mappedApplications;
  } catch (error) {
    console.error("Error in getApplications service:", error);
    return [];
  }
}

// Get application by ID
export async function getApplicationById(id: string | number): Promise<OrganizerApplication | null> {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching application: ${response.statusText}`);
    }
    
    const data = await response.json();
    return mapApiApplication(data.application);
  } catch (error) {
    console.error(`Error in getApplicationById service for id ${id}:`, error);
    throw error;
  }
}

// Get application statistics
export async function getApplicationStats(): Promise<ApplicationStats> {
  try {
    console.log('Fetching application statistics...');
    const response = await fetch('/api/applications/stats');
    
    if (!response.ok) {
      throw new Error(`Error fetching application stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Application stats data:', data);
    
    // Map API stats to our interface
    return {
      total: data.stats.total || 0,
      pending: data.stats.pending || 0,
      approved: data.stats.approved || 0,
      rejected: data.stats.rejected || 0
    };
  } catch (error) {
    console.error("Error in getApplicationStats service:", error);
    
    // Return fallback stats to prevent UI crashes
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };
  }
}

// Update application status
export async function updateApplicationStatus(
  id: string | number, 
  status: 'Approved' | 'Rejected', 
  reviewNotes?: string
): Promise<OrganizerApplication> {
  try {
    // Convert status to the format expected by the API
    const apiStatus = status === 'Approved' ? 'accepted' : 'rejected';
    
    const response = await fetch(`/api/applications/status/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: apiStatus,
        feedback: reviewNotes // Updated to use feedback as the field name
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating application: ${response.statusText}`);
    }
    
    const data = await response.json();
    const mappedApplication = mapApiApplication(data.application);
    
    if (!mappedApplication) {
      throw new Error('Failed to map updated application data');
    }
    
    return mappedApplication;
  } catch (error) {
    console.error(`Error in updateApplicationStatus service for id ${id}:`, error);
    throw error;
  }
}

// Create a new application
export async function createApplication(applicationData: Omit<OrganizerApplication, 'id' | 'status' | 'submittedDate'>): Promise<OrganizerApplication> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });
    
    if (!response.ok) {
      throw new Error(`Error creating application: ${response.statusText}`);
    }
    
    const data = await response.json();
    const mappedApplication = mapApiApplication(data.application);
    
    if (!mappedApplication) {
      throw new Error('Failed to map created application data');
    }
    
    return mappedApplication;
  } catch (error) {
    console.error("Error in createApplication service:", error);
    throw error;
  }
}

// Delete an application
export async function deleteApplication(id: string | number): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting application: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error in deleteApplication service for id ${id}:`, error);
    throw error;
  }
}

// Add this utility function for processing image URLs
const processImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // If it's already a data URL or absolute URL, return as is
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's already using our media API, return as is
  if (url.startsWith('/api/media/')) {
    return url;
  }

  // If it contains cloudinary identifiers, ensure it goes through our media endpoint
  if (url.includes('cloudinary.com') || url.includes('upload/')) {
    // Extract filename or last part of path
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return `/api/media/${encodeURIComponent(filename)}`;
  }
  
  // Assume it's a local file path, return URL to our media API endpoint
  // Extract filename from path
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  
  // Return URL to our media API endpoint
  return `/api/media/${encodeURIComponent(filename)}`;
};

// Helper function to process image or document URLs or base64 data
const processFileData = (data: string | undefined, type: 'image' | 'document'): string => {
  if (!data) return '';
  
  // If it's already a URL or data URI, return as is
  if (data.startsWith('http') || data.startsWith('data:')) {
    return data;
  }
  
  // Add appropriate data URI prefix based on type
  if (type === 'image') {
    return `data:image/jpeg;base64,${data}`;
  } else {
    // Assume PDF for documents
    return `data:application/pdf;base64,${data}`;
  }
};

// Helper function to map API application data to our interface
function mapApiApplication(apiApplication: any): OrganizerApplication | null {
  if (!apiApplication) return null;
  
  try {
    // Create a base application object with fallbacks for all fields
    const application: OrganizerApplication = {
      id: apiApplication._id || apiApplication.id || '',
      name: apiApplication.fullName || apiApplication.name || '',
      email: apiApplication.email || '',
      phone: apiApplication.phone || '',
      dateOfBirth: apiApplication.dateOfBirth ? new Date(apiApplication.dateOfBirth).toLocaleDateString() : undefined,
      organization: apiApplication.university || apiApplication.organization || '',
      website: apiApplication.website || '',
      department: apiApplication.department || '',
      role: apiApplication.role || '',
      yearOfStudy: apiApplication.yearOfStudy || '',
      studentId: apiApplication.studentId || '',
      experience: apiApplication.experience || '',
      reason: apiApplication.reason || '',
      availability: apiApplication.availability || '',
      // Process images and documents as base64 data with proper URIs
      idDocumentUrl: processFileData(apiApplication.idDocument || apiApplication.idDocumentUrl, 'document'),
      profilePhotoUrl: processFileData(apiApplication.profilePhoto || apiApplication.profilePhotoUrl, 'image'),
      termsAccepted: apiApplication.termsAccepted || false,
      newsletterSubscription: apiApplication.newsletterSubscription || false,
      submittedDate: apiApplication.createdAt 
        ? new Date(apiApplication.createdAt).toLocaleDateString() 
        : apiApplication.submittedDate || new Date().toLocaleDateString(),
      status: mapStatus(apiApplication.status),
      description: apiApplication.reason || apiApplication.experience || apiApplication.description || '',
      reviewNotes: apiApplication.feedback || apiApplication.adminFeedback || apiApplication.reviewNotes || '',
      reviewedBy: apiApplication.reviewedBy || '',
      reviewedAt: apiApplication.updatedAt ? new Date(apiApplication.updatedAt).toLocaleDateString() : undefined
    };
    
    // Add optional fields only if they exist in the API response
    if (apiApplication.skills && Array.isArray(apiApplication.skills)) {
      application.skills = apiApplication.skills;
    }
    
    // Handle previousEvents if present
    if (apiApplication.previousEvents && Array.isArray(apiApplication.previousEvents)) {
      application.previousEvents = apiApplication.previousEvents;
    }
    
    // Handle socialMedia if any social fields are present
    const socialFields = ['twitter', 'linkedin', 'facebook', 'instagram'];
    const hasSocialMedia = socialFields.some(field => apiApplication[field]);
    
    if (hasSocialMedia || apiApplication.socialMedia) {
      application.socialMedia = {
        ...(apiApplication.socialMedia || {}),
        twitter: apiApplication.twitter || apiApplication.socialMedia?.twitter || undefined,
        linkedin: apiApplication.linkedin || apiApplication.socialMedia?.linkedin || undefined,
        facebook: apiApplication.facebook || apiApplication.socialMedia?.facebook || undefined,
        instagram: apiApplication.instagram || apiApplication.socialMedia?.instagram || undefined
      };
    }
    
    return application;
  } catch (error) {
    console.error("Error mapping application data:", error, apiApplication);
    // Return a fallback object with minimal data to prevent UI crashes
    return {
      id: apiApplication._id || apiApplication.id || 'unknown',
      name: 'Unknown Applicant',
      email: 'unknown@example.com',
      organization: 'Unknown Organization',
      submittedDate: new Date().toLocaleDateString(),
      status: 'Pending',
      description: 'Error retrieving application details',
    } as OrganizerApplication;
  }
}

// Helper function to map array of API applications
function mapApiApplications(apiApplications: any[]): OrganizerApplication[] {
  if (!apiApplications || !Array.isArray(apiApplications)) return [];
  return apiApplications
    .map(mapApiApplication)
    .filter((app): app is OrganizerApplication => app !== null);
}

// Map API status values to our interface values
function mapStatus(apiStatus: string): ApplicationStatus {
  switch (apiStatus) {
    case 'pending': return 'Pending';
    case 'accepted': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return 'Pending';
  }
}

export async function findApplicationByEmail(email: string): Promise<OrganizerApplication | null> {
  try {
    // Adding a specific endpoint to search by email
    const response = await fetch(`${API_URL}/find-by-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error finding application by email: ${response.statusText}`);
    }
    
    const data = await response.json();
    return mapApiApplication(data.application);
  } catch (error) {
    console.error(`Error in findApplicationByEmail service for email ${email}:`, error);
    return null;
  }
} 