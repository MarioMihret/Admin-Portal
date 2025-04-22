"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Mail, Phone, Globe, Building, Calendar, Clock, Loader2, Image as ImageIcon, FileText, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import StatusBadge from '@/components/admin/applications/StatusBadge';
import { getApplicationById, updateApplicationStatus } from '@/services/applications';
import { OrganizerApplication } from '@/types/applications';
import ChartCard from '@/components/admin/dashboard/ChartCard';

// Placeholder image when uploads are missing
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjOTRhM2I4Ij5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
const PLACEHOLDER_DOCUMENT = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjOTRhM2I4Ij5Eb2N1bWVudCBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

// CustomImage component that tries the actual URL first
const CustomImage = ({ 
  url, 
  alt, 
  placeholderImage, 
  className 
}: { 
  url: string | undefined; 
  alt: string; 
  placeholderImage: string;
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState(url || placeholderImage);

  useEffect(() => {
    // Update the image source if the url prop changes
    setImgSrc(url || placeholderImage);
  }, [url, placeholderImage]);

  const handleError = () => {
    // If the actual URL fails, fall back to the placeholder
    console.warn(`Failed to load image from ${url}. Using placeholder.`);
    setImgSrc(placeholderImage);
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <img 
        key={imgSrc} // Add key to force re-render on src change
        src={imgSrc} 
        alt={alt} 
        className={className || "max-h-full max-w-full object-contain"} 
        onError={handleError}
      />
    </div>
  );
};

// Helper to check if a URL is an image
const isImagePath = (path: string | undefined): boolean => {
  if (!path) return false;
  return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(path);
};

// Helper function to get the correct social media icon
const getSocialIcon = (platform: string): JSX.Element => {
  switch (platform.toLowerCase()) {
    case 'twitter':
      return <Twitter className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    case 'linkedin':
      return <Linkedin className="w-4 h-4 text-blue-700 flex-shrink-0" />;
    case 'facebook':
      return <Facebook className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    case 'instagram':
      return <Instagram className="w-4 h-4 text-pink-600 flex-shrink-0" />;
    default:
      return <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }
};

// Helper function to construct the correct social media URL
const getSocialUrl = (platform: string, value: string): string => {
  if (!value) return '#'; // Return placeholder if value is empty
  if (value.startsWith('http')) return value; // Already a full URL
  
  switch (platform.toLowerCase()) {
    case 'twitter':
      return `https://twitter.com/${value.replace('@', '')}`;
    case 'linkedin':
      // Handle cases where it might be a full URL or just a username/path
      if (value.includes('linkedin.com')) return value;
      return `https://www.linkedin.com/in/${value}`;
    case 'facebook':
      return `https://facebook.com/${value}`;
    case 'instagram':
      return `https://instagram.com/${value.replace('@', '')}`;
    default:
      // Attempt to make it a valid URL if it doesn't start with http
      return value.startsWith('http') ? value : `https://${value}`;
  }
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const action = searchParams.get('action');
  
  // State for data, loading, and error
  const [application, setApplication] = useState<OrganizerApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for review action
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(action === 'approve' || action === 'reject');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : null
  );
  
  // Fetch application data
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getApplicationById(id);
        
        if (!data) {
          throw new Error('Application not found');
        }
        
        setApplication(data);
      } catch (err) {
        console.error("Failed to fetch application:", err);
        setError("Could not load application details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplication();
  }, [id]);
  
  // Handle approve/reject actions
  const handleApprove = () => {
    setReviewAction('approve');
    setIsReviewModalOpen(true);
    // Clear URL parameter after modal is shown
    router.replace(`/admin/applications/${id}`);
  };
  
  const handleReject = () => {
    setReviewAction('reject');
    setIsReviewModalOpen(true);
    // Clear URL parameter after modal is shown
    router.replace(`/admin/applications/${id}`);
  };
  
  const handleSubmitReview = async () => {
    if (!application || !reviewAction) return;
    
    try {
      setIsSubmitting(true);
      await updateApplicationStatus(
        application.id,
        reviewAction === 'approve' ? 'Approved' : 'Rejected',
        reviewNotes
      );
      
      // Update local state
      setApplication({
        ...application,
        status: reviewAction === 'approve' ? 'Approved' : 'Rejected',
        reviewNotes,
        reviewedAt: new Date().toISOString().split('T')[0],
        reviewedBy: 'Admin User', // Would come from session in real app
      });
      
      // Close modal and show success message
      setIsReviewModalOpen(false);
      // Could add toast notification here
    } catch (err) {
      console.error("Failed to update application status:", err);
      // Could show error in the form
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelReview = () => {
    setIsReviewModalOpen(false);
    setReviewAction(null);
    setReviewNotes('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }
  
  if (error || !application) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/admin/applications" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Applications
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Application</h2>
          <p className="text-red-700">{error || 'Application not found'}</p>
          <button
            onClick={() => router.refresh()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <Link href="/admin/applications" className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Applications
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border">
              <CustomImage 
                url={application?.profilePhotoUrl} // This will show placeholder if URL fails
                alt={application?.name || 'Applicant'}
                placeholderImage={PLACEHOLDER_IMAGE} // Defined placeholder SVG
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{application?.name || 'Applicant Details'}</h1>
              <p className="text-sm text-gray-500">{application?.organization || 'No Organization Provided'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-3">
          <StatusBadge status={application?.status || 'Pending'} size="lg" />
          {application?.status === 'Pending' && (
            <div className="flex space-x-3">
              <button 
                onClick={handleReject}
                className="flex items-center px-3 py-1.5 bg-white border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </button>
              <button 
                onClick={handleApprove}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Card */}
          <ChartCard title="Applicant Information">
            {/* Personal & Contact Info Section */}
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal & Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="flex items-center col-span-2 sm:col-span-1">
                  <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <a href={`mailto:${application?.email || ''}`} className="text-gray-700 hover:text-blue-600 truncate" title={application?.email}>{application?.email || '--'}</a>
                </div>
                <div className="flex items-center col-span-2 sm:col-span-1">
                  <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{application?.phone || '--'}</span>
                </div>
                <div className="flex items-center col-span-2 sm:col-span-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Born: {application?.dateOfBirth || '--'}</span>
                </div>
                {application?.website && (
                  <div className="flex items-center col-span-2 sm:col-span-1">
                    <Globe className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate" title={application.website}>
                      {application.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Academic Info Section */}
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic & Organization</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="flex items-center col-span-2 sm:col-span-1">
                  <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{application?.organization || 'Not specified'}</span>
                </div>
                {application?.department && (
                  <div className="flex items-center col-span-2 sm:col-span-1">
                    <span className="text-gray-400 mr-2 w-4 text-center">🏢</span>
                    <span className="text-gray-700">Dept: {application.department}</span>
                  </div>
                )}
                {application?.role && (
                  <div className="flex items-center col-span-2 sm:col-span-1">
                    <span className="text-gray-400 mr-2 w-4 text-center">👤</span>
                    <span className="text-gray-700">Role: {application.role}</span>
                  </div>
                )}
                {application?.yearOfStudy && (
                  <div className="flex items-center col-span-2 sm:col-span-1">
                    <span className="text-gray-400 mr-2 w-4 text-center">🎓</span>
                    <span className="text-gray-700">Year: {application.yearOfStudy}</span>
                  </div>
                )}
                {application?.studentId && (
                  <div className="flex items-center col-span-2 sm:col-span-1">
                    <span className="text-gray-400 mr-2 w-4 text-center">🆔</span>
                    <span className="text-gray-700">ID: {application.studentId}</span>
                  </div>
                )}
                {application?.availability && (
                  <div className="flex items-center col-span-2 sm:col-span-1">
                    <Clock className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Avail: {application.availability}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Documents Section */}
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-white flex flex-col items-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Profile Photo</h4>
                  <div className="flex items-center justify-center h-48 w-full bg-gray-50 rounded-md overflow-hidden mb-2">
                    <CustomImage 
                      url={application?.profilePhotoUrl}
                      alt="Profile Photo"
                      placeholderImage={PLACEHOLDER_IMAGE}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <a 
                    href={application?.profilePhotoUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-full px-3 py-1 text-xs font-medium rounded-md mt-1 ${application?.profilePhotoUrl ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                    onClick={(e) => !application?.profilePhotoUrl && e.preventDefault()}
                  >
                    <ImageIcon className="w-3 h-3 mr-1.5" />
                    View Photo
                  </a>
                  {!application?.profilePhotoUrl && (
                    <p className="text-xs text-gray-400 mt-1.5">(No file provided)</p>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-white flex flex-col items-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">ID Document</h4>
                  <div className="flex items-center justify-center h-48 w-full bg-gray-50 rounded-md overflow-hidden mb-2">
                    <CustomImage 
                      url={application?.idDocumentUrl}
                      alt="ID Document"
                      placeholderImage={PLACEHOLDER_DOCUMENT}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <a 
                    href={application?.idDocumentUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-full px-3 py-1 text-xs font-medium rounded-md mt-1 ${application?.idDocumentUrl ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                    onClick={(e) => !application?.idDocumentUrl && e.preventDefault()}
                  >
                    <FileText className="w-3 h-3 mr-1.5" />
                    View Document
                  </a>
                  {!application?.idDocumentUrl && (
                    <p className="text-xs text-gray-400 mt-1.5">(No file provided)</p>
                  )}
                </div>
              </div>
            </div>

            {/* About & Experience Section */}
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">About & Experience</h3>
              <div className="space-y-4 text-sm">
                {application?.description && (
                  <div>
                    <h4 className="font-medium text-gray-600 mb-1">About</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{application.description}</p>
                  </div>
                )}
                {application?.experience && (
                  <div>
                    <h4 className="font-medium text-gray-600 mb-1">Experience</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{application.experience}</p>
                  </div>
                )}
                {application?.reason && (
                  <div>
                    <h4 className="font-medium text-gray-600 mb-1">Motivation</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{application.reason}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Skills Section */}
            {application?.skills && application.skills.length > 0 && (
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {skill || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Previous Events Section */}
            {application?.previousEvents && application.previousEvents.length > 0 && (
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Previous Events Attended</h3>
                <div className="space-y-3">
                  {application.previousEvents.map((event, index) => (
                    <div key={index} className="border border-gray-100 rounded-md p-3 bg-gray-50 text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-800">{event?.name || 'Unnamed Event'}</h4>
                          <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            {event?.date || '--'}
                            <span className="mx-2">|</span>
                            <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                            {event?.location || '--'}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5 flex-shrink-0 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                          <Clock className="w-3 h-3 mr-1" />
                          {event?.attendees || 0} attendees
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Terms & Agreements</h3>
              <div className="space-y-3 bg-gray-50 rounded-md p-4 border border-gray-100">
                <div className="flex items-center text-sm">
                  <span className={`w-5 h-5 mr-2 flex-shrink-0 rounded-full flex items-center justify-center border ${application?.termsAccepted ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                    {application?.termsAccepted ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                    )}
                  </span>
                  <span className="text-gray-700">Terms and Conditions Accepted</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className={`w-5 h-5 mr-2 flex-shrink-0 rounded-full flex items-center justify-center border ${application?.newsletterSubscription ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
                    {application?.newsletterSubscription ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </span>
                  <span className="text-gray-700">Newsletter Subscription</span>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="space-y-6">
          <ChartCard title="Application Status">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Submitted:</span>
                <span className="font-medium text-gray-700">{application?.submittedDate || '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Current Status:</span>
                <StatusBadge status={application?.status || 'Pending'} size="sm" />
              </div>
              {application?.status !== 'Pending' && (
                <>
                  <hr className="my-3 border-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Reviewed By:</span>
                    <span className="font-medium text-gray-700">{application?.reviewedBy || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Reviewed On:</span>
                    <span className="font-medium text-gray-700">{application?.reviewedAt || '--'}</span>
                  </div>
                </>
              )}
            </div>
            
            {application?.reviewNotes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Review Notes</h3>
                <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {application.reviewNotes}
                </div>
              </div>
            )}
          </ChartCard>

          {application?.socialMedia && Object.keys(application.socialMedia).length > 0 && (
            <ChartCard title="Social Media">
              <div className="space-y-3">
                {Object.entries(application.socialMedia)
                  .filter(([_, url]) => url) // Filter out empty URLs
                  .map(([platform, url]) => (
                    <div key={platform} className="flex items-center text-sm">
                      {getSocialIcon(platform)}
                      <a 
                        href={getSocialUrl(platform, url!)}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline ml-2 truncate"
                        title={url}
                      >
                        {url}
                      </a>
                    </div>
                  ))}
              </div>
            </ChartCard>
          )}
        </div>
      </div>
      
      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'}
            </h2>
            <p className="text-gray-700 mb-4">
              {reviewAction === 'approve' 
                ? 'This will grant organizer status to this applicant.' 
                : 'This will reject the organization application.'}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Notes {reviewAction === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder={reviewAction === 'approve' 
                  ? 'Optional notes about this approval' 
                  : 'Please provide a reason for rejection'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                required={reviewAction === 'reject'}
              />
              {reviewAction === 'reject' && !reviewNotes && (
                <p className="mt-1 text-xs text-red-600">Please provide a reason for rejection</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleCancelReview}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmitting || (reviewAction === 'reject' && !reviewNotes)}
                className={`px-4 py-2 rounded-lg shadow-sm text-white ${
                  reviewAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 