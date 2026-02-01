"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  eventService, 
  Event, 
  EventCategory, 
  EventStatus, 
  EventVisibility, 
  EventSkillLevel,
  StreamingPlatform,
  EventLocation,
  EventOrganizer,
  EventTicket,
  EventAgendaItem,
  ImageObject
} from '@/services/eventService';
import { ArrowLeft, Save, Trash2, Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: 'Other' as EventCategory,
    date: '',
    endDate: '',
    duration: 60,
    time: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      venueDetails: '',
      coordinates: {
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined
      }
    },
    isVirtual: false,
    meetingLink: '',
    streamingPlatform: undefined as StreamingPlatform | undefined,
    organizerId: '',
    organizer: {
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      logo: ''
    } as EventOrganizer,
    price: 0,
    currency: 'USD',
    tickets: [] as EventTicket[],
    attendees: 0,
    maxAttendees: 100,
    minimumAttendees: 0,
    status: 'Draft' as EventStatus,
    visibility: 'Public' as EventVisibility,
    skillLevel: 'All Levels' as EventSkillLevel,
    requirements: [] as string[],
    targetAudience: [] as string[],
    agenda: [] as EventAgendaItem[],
    tags: [] as string[],
    image: '',
    imageUrl: '',
    coverImage: {
      url: '',
      alt: '',
      attribution: '',
      height: undefined as number | undefined,
      width: undefined as number | undefined
    } as ImageObject,
    logo: {
      url: '',
      alt: '',
      attribution: ''
    } as ImageObject,
    registrationDeadline: '',
    earlyBirdDeadline: '',
    refundPolicy: '',
    metadata: {
      createdBy: undefined,
      updatedBy: undefined,
      featured: false,
      promoted: false,
      views: 0,
      shares: 0,
      likes: 0
    },
    isActive: true,
    isFeatured: false
  });
  const [tagInput, setTagInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');
  const [ticketInput, setTicketInput] = useState({
    type: '',
    name: '',
    price: 0,
    currency: 'USD',
    quantity: 0,
    description: '',
    isEarlyBird: false
  });
  const [agendaItemInput, setAgendaItemInput] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    speaker: '',
    location: ''
  });
  
  const router = useRouter();
  const eventId = params.id;
  const isNewEvent = eventId === 'create';

  // Fetch event details if not creating new event
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (isNewEvent) {
        setLoading(false);
        setIsEditing(true);
        return;
      }
      
      try {
        setLoading(true);
        const response = await eventService.getEventById(eventId);
        setEvent(response.event);
        
        // Initialize form data
        const eventDate = new Date(response.event.date);
        const endDate = response.event.endDate ? new Date(response.event.endDate) : '';
        const registrationDeadline = response.event.registrationDeadline ? new Date(response.event.registrationDeadline) : '';
        const earlyBirdDeadline = response.event.earlyBirdDeadline ? new Date(response.event.earlyBirdDeadline) : '';
        
        setFormData({
          title: response.event.title || '',
          shortDescription: response.event.shortDescription || '',
          description: response.event.description || '',
          category: (response.event.category || 'Other') as EventCategory,
          date: eventDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: endDate ? endDate.toISOString().split('T')[0] : '',
          duration: response.event.duration || 60,
          location: {
            address: response.event.location?.address || '',
            city: response.event.location?.city || '',
            state: response.event.location?.state || '',
            country: response.event.location?.country || '',
            postalCode: response.event.location?.postalCode || '',
            venueDetails: response.event.location?.venueDetails || '',
            coordinates: {
              latitude: response.event.location?.coordinates?.latitude,
              longitude: response.event.location?.coordinates?.longitude
            }
          },
          isVirtual: response.event.isVirtual || false,
          meetingLink: response.event.meetingLink || '',
          streamingPlatform: response.event.streamingPlatform,
          organizerId: response.event.organizerId || '',
          organizer: {
            name: response.event.organizer?.name || '',
            description: response.event.organizer?.description || '',
            contactEmail: response.event.organizer?.contactEmail || '',
            contactPhone: response.event.organizer?.contactPhone || '',
            website: response.event.organizer?.website || '',
            logo: response.event.organizer?.logo || ''
          },
          price: response.event.price || 0,
          currency: response.event.currency || 'USD',
          tickets: response.event.tickets || [],
          attendees: response.event.attendees || 0,
          maxAttendees: response.event.maxAttendees || 100,
          minimumAttendees: response.event.minimumAttendees || 0,
          status: (response.event.status || 'Draft') as EventStatus,
          visibility: (response.event.visibility || 'Public') as EventVisibility,
          skillLevel: (response.event.skillLevel || 'All Levels') as EventSkillLevel,
          requirements: response.event.requirements || [],
          targetAudience: response.event.targetAudience || [],
          agenda: response.event.agenda || [],
          tags: response.event.tags || [],
          image: response.event.image || '',
          imageUrl: response.event.imageUrl || '',
          coverImage: response.event.coverImage || {
            url: '',
            alt: '',
            attribution: '',
            height: undefined,
            width: undefined
          },
          logo: response.event.logo || {
            url: '',
            alt: '',
            attribution: ''
          },
          registrationDeadline: registrationDeadline ? registrationDeadline.toISOString().split('T')[0] : '',
          earlyBirdDeadline: earlyBirdDeadline ? earlyBirdDeadline.toISOString().split('T')[0] : '',
          refundPolicy: response.event.refundPolicy || '',
          metadata: response.event.metadata || {
            createdBy: undefined,
            updatedBy: undefined,
            featured: false,
            promoted: false,
            views: 0,
            shares: 0,
            likes: 0
          },
          isActive: response.event.isActive,
          isFeatured: response.event.isFeatured || false
        });
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, isNewEvent]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle nested object properties (e.g., location.address)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: type === 'number' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : type === 'number' 
            ? parseInt(value) 
            : value
      }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Clean up data before sending to avoid CastErrors and ValidationErrors
      const dataToSubmit = { ...formData };
      
      // 1. Remove organizerId if empty
      if (!dataToSubmit.organizerId) {
        delete (dataToSubmit as any).organizerId;
      }
      
      // 2. Remove empty nested objects (logo, coverImage) if no URL
      if (dataToSubmit.logo && !dataToSubmit.logo.url) {
        delete (dataToSubmit as any).logo;
      }
      if (dataToSubmit.coverImage && !dataToSubmit.coverImage.url) {
        delete (dataToSubmit as any).coverImage;
      }
      
      // 3. Ensure Enums are correct case (Schema expects Title Case)
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      
      if (dataToSubmit.visibility) {
        // Handle "Public", "Private", "Unlisted"
        dataToSubmit.visibility = capitalize(dataToSubmit.visibility) as EventVisibility;
      }
      
      if (dataToSubmit.status) {
        // Handle "Draft", "Published", etc.
        // Special case for 'Sold Out' which has a space
        if (dataToSubmit.status.toLowerCase() === 'sold out') {
           dataToSubmit.status = 'Sold Out' as EventStatus;
        } else {
           dataToSubmit.status = capitalize(dataToSubmit.status) as EventStatus;
        }
      }

       if (dataToSubmit.skillLevel) {
        // Handle "Beginner", "Intermediate", "Advanced", "All Levels"
         if (dataToSubmit.skillLevel.toLowerCase() === 'all levels') {
           dataToSubmit.skillLevel = 'All Levels' as EventSkillLevel;
        } else {
           dataToSubmit.skillLevel = capitalize(dataToSubmit.skillLevel) as EventSkillLevel;
        }
      }
      
      // 4. Handle optional fields that might be empty strings
      if (!dataToSubmit.streamingPlatform) {
        delete (dataToSubmit as any).streamingPlatform;
      }
      
      // Log payload for debugging
      console.log('Submitting event data:', dataToSubmit);

      if (isNewEvent) {
        await eventService.createEvent(dataToSubmit);
        router.push('/admin/events');
      } else {
        await eventService.updateEvent(eventId, dataToSubmit);
        
        // Refresh event data
        const response = await eventService.getEventById(eventId);
        setEvent(response.event);
        
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle event deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        setLoading(true);
        await eventService.deleteEvent(eventId);
        router.push('/admin/events');
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Failed to delete event.');
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  const pageTitle = isNewEvent ? "Create New Event" : isEditing ? "Edit Event" : event?.title;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/admin/events')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
        
        {!isNewEvent && !isEditing && (
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              Edit Event
            </button>
            <button 
              onClick={handleDelete}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {isEditing || isNewEvent ? (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* 1. Basic Information section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description <span className="text-xs text-gray-500">(Summary for card view)</span>
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Description*
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category*
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select a category</option>
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Networking">Networking</option>
                    <option value="Social">Social</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill Level
                  </label>
                  <select
                    name="skillLevel"
                    value={formData.skillLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* 2. Time & Date section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Date & Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date*
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time*
                  </label>
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    placeholder="e.g. 7:00 PM - 9:00 PM"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>
            
            {/* 3. Location section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Location</h3>
              
              <div className="flex items-center mb-4">
                 <input
                    type="checkbox"
                    id="isVirtual"
                    name="isVirtual"
                    checked={formData.isVirtual}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isVirtual" className="ml-2 block text-sm text-gray-900">
                    This is a virtual event
                  </label>
              </div>

              {formData.isVirtual ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Streaming Platform
                      </label>
                      <select
                        name="streamingPlatform"
                        value={formData.streamingPlatform}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select Platform</option>
                        <option value="Zoom">Zoom</option>
                        <option value="Google Meet">Google Meet</option>
                        <option value="Microsoft Teams">Microsoft Teams</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Other">Other</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Link
                      </label>
                      <input
                        type="url"
                        name="meetingLink"
                        value={formData.meetingLink}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address*
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleChange}
                      required={!formData.isVirtual}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Details
                    </label>
                    <input
                      type="text"
                      name="location.venueDetails"
                      value={formData.location.venueDetails}
                      onChange={handleChange}
                      placeholder="e.g. Room 304"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* 4. Settings & Media section */}
            <div className="space-y-4">
               <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Settings & Media</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Postponed">Postponed</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Completed">Completed</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                      <option value="Unlisted">Unlisted</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="ETB">ETB</option>
                    </select>
                 </div>
                 
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (Max Attendees)
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

               <div className="md:col-span-2 mt-4">
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Tags
                 </label>
                 <div className="flex">
                   <input
                     type="text"
                     value={tagInput}
                     onChange={(e) => setTagInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                     placeholder="Add tags and press Enter"
                     className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                   />
                   <button
                     type="button"
                     onClick={handleAddTag}
                     className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg"
                   >
                     Add
                   </button>
                 </div>
                 <div className="flex flex-wrap gap-2 mt-2">
                   {formData.tags.map((tag, index) => (
                     <div 
                       key={index} 
                       className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                     >
                       {tag}
                       <button
                         type="button"
                         onClick={() => handleRemoveTag(tag)}
                         className="ml-2 text-blue-600 hover:text-blue-800"
                       >
                         &times;
                       </button>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Active events are visible to users</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
                        Featured
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Featured events are highlighted</p>
                  </div>
               </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
              {!isNewEvent && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isNewEvent ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    {isNewEvent ? 'Create Event' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Event Details View */
          <div className="divide-y divide-gray-200">
            {/* Event Header */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{event?.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {event?.category}
                    </span>
                    {event?.isActive ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    {event?.isFeatured && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                
                {event?.imageUrl && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Event Details */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Date</div>
                    <div className="mt-1 text-gray-900">{formatDate(event?.date || '')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Time</div>
                    <div className="mt-1 text-gray-900">{event?.time}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Location</div>
                    <div className="mt-1 text-gray-900">{event?.location?.address || 'No address specified'}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Capacity</div>
                    <div className="mt-1 text-gray-900">{event?.attendees || 0} / {event?.maxAttendees} Registered</div>
                  </div>
                </div>
                
                {event?.tags && event.tags.length > 0 && (
                  <div className="flex items-start md:col-span-2">
                    <Tag className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Tags</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Event Description */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{event?.description}</p>
            </div>
            
            {/* Event Metadata */}
            <div className="p-6">
              <div className="flex justify-between text-sm text-gray-500">
                <div>
                  Created: {event?.createdAt && formatDate(event.createdAt)}
                </div>
                <div>
                  Updated: {event?.updatedAt && formatDate(event.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 