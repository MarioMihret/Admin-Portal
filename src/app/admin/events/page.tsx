"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search,
  Plus,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Star,
  Clock,
  Users,
  Download,
  Filter
} from 'lucide-react';
import { eventService, Event, PaginationResult, EventCategory, EventStatus } from '@/services/eventService';

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationResult>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  
  const router = useRouter();

  // Function to fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      console.log('Fetching events with params:', { searchQuery, page: pagination.page, limit: pagination.limit, category: categoryFilter, status: statusFilter });
      
      const response = await eventService.getEvents(searchQuery, pagination.page, pagination.limit, categoryFilter, statusFilter);
      console.log('Event API response:', response);
      
      if (!response.events || !Array.isArray(response.events)) {
        setDebugInfo(`Invalid response format: ${JSON.stringify(response)}`);
        throw new Error('Invalid response from API');
      }
      
      setEvents(response.events);
      setPagination(response.pagination);
      
      console.log(`Loaded ${response.events.length} events`);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
      setDebugInfo(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    setMounted(true);
    fetchEvents();
  }, []);

  // Fetch events when search or pagination changes
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        fetchEvents();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, pagination.page, pagination.limit, categoryFilter, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(eventId);
        fetchEvents(); // Refresh the list
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Failed to delete event. Please try again.');
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

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your events and registrations
          </p>
        </div>
        <button 
          onClick={() => router.push('/admin/events/create')}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
           <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-blue-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">All Categories</option>
            <option value="Conference">Conference</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Networking">Networking</option>
            <option value="Social">Social</option>
            <option value="Other">Other</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-blue-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Postponed">Postponed</option>
            <option value="Sold Out">Sold Out</option>
            <option value="Completed">Completed</option>
          </select>

          <button 
            onClick={async () => {
              try {
                setExporting(true);
                const response = await eventService.getEvents(searchQuery, 1, 10000, categoryFilter, statusFilter);
                if (response.events) {
                  const headers = ['Title', 'Date', 'Status', 'Category', 'Attendees', 'Price', 'Currency'];
                  const csvContent = [
                    headers.join(','),
                    ...response.events.map(event => {
                      const date = new Date(event.date).toLocaleDateString();
                      return [
                        `"${event.title.replace(/"/g, '""')}"`,
                        date,
                        event.status,
                        event.category,
                        event.attendees,
                        event.price,
                        event.currency
                      ].join(',');
                    })
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `events_export_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed. Please try again.');
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center justify-center disabled:opacity-50"
          >
             {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          {debugInfo && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto">
              {debugInfo}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      )}

      {/* Events list */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full p-8 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 text-center">
              <p className="text-gray-500">No events found.</p>
              <button 
                onClick={() => router.push('/admin/events/create')}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event._id} className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Event Image */}
                <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                  {event.coverImage?.url ? (
                    <img 
                      src={event.coverImage.url} 
                      alt={event.coverImage.alt || event.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : event.imageUrl ? (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  {/* Featured badge */}
                  {event.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </div>
                  )}
                  {/* Status badge */}
                  <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-semibold flex items-center ${
                    event.status === 'Published' 
                      ? 'bg-green-100 text-green-800' 
                      : event.status === 'Draft'
                      ? 'bg-gray-100 text-gray-800'
                      : event.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : event.status === 'Postponed'
                      ? 'bg-yellow-100 text-yellow-800'
                      : event.status === 'Sold Out'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {event.status || (event.isActive ? 'Active' : 'Inactive')}
                  </div>
                </div>
                
                {/* Event Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{event.title}</h3>
                  
                  {event.shortDescription && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {event.shortDescription}
                    </p>
                  )}
                  
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <div className="flex items-start">
                      <Calendar className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-start">
                      <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        {(event as any).time || (event.duration ? `${event.duration} mins` : 'TBD')}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {event.isVirtual 
                          ? `Virtual - ${event.streamingPlatform || 'Online'}` 
                          : event.location?.address || event.location?.city 
                            ? `${event.location.address ? event.location.address + ', ' : ''}${event.location.city || ''} ${event.location.state || ''}`
                            : 'Location TBD'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <Users className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{event.attendees || 0} / {event.maxAttendees || '∞'} Registered</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {event.category}
                    </span>
                    
                    {event.price > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: event.currency || 'USD'
                        }).format(event.price)}
                      </span>
                    )}
                    
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => router.push(`/admin/events/${event._id}`)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {event.tags.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                          +{event.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && events.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Previous
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className={`px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg ${pagination.page >= pagination.pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}