"use client";

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { KeyRound, Users, AlertTriangle, Globe, Smartphone, Filter, RefreshCw, ChevronDown, ChevronUp, ArrowRight, MapPin, ShieldCheck, ShieldOff } from 'lucide-react';

// Interfaces
interface AuthEvent {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress: string;
  location?: string; // e.g., "City, Country" - can be enriched via IP lookup
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_SUCCESS' | 'MFA_CHALLENGE' | 'MFA_SUCCESS' | 'MFA_FAILURE';
  status: 'success' | 'failure' | 'info' | 'warning';
  details?: Record<string, any>; // e.g., { failureReason: "Invalid credentials", attempts: 3 }
}

interface AuthStats {
  activeSessions: number;
  failedLoginsToday: number;
  successfulLoginsToday: number;
  newDeviceLoginsToday: number;
  alerts: number;
}

interface AuthFilters {
  dateFrom?: string;
  dateTo?: string;
  userName?: string;
  ipAddress?: string;
  eventType?: AuthEvent['eventType'] | '';
  status?: AuthEvent['status'] | '';
}

// Mock Data Generation
const generateMockAuthEvents = (count: number): AuthEvent[] => {
  const events: AuthEvent[] = [];
  const users = [
    { id: 'usr_alice_b', name: 'Alice Brown', email: 'alice.brown@example.com' },
    { id: 'usr_bob_c', name: 'Bob Charles', email: 'bob.charles@example.com' },
    { id: 'usr_eve_d', name: 'Eve Davis', email: 'eve.davis@example.com' },
    { name: 'Unknown User' } // For failed attempts with no user context
  ];
  const eventTypes: AuthEvent['eventType'][] = [
    'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_RESET_REQUEST', 
    'PASSWORD_RESET_SUCCESS', 'MFA_CHALLENGE', 'MFA_SUCCESS', 'MFA_FAILURE'
  ];
  const deviceTypes: AuthEvent['deviceType'][] = ['desktop', 'mobile', 'tablet', 'unknown'];
  const locations = ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Berlin, Germany', 'Paris, France', 'Unknown Location'];

  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const randomPastMilliseconds = Math.random() * 7 * 24 * 60 * 60 * 1000; // up to 7 days ago
    let status: AuthEvent['status'] = 'info';
    let details: AuthEvent['details'] = {};

    if (eventType.includes('SUCCESS') || eventType === 'LOGOUT') status = 'success';
    if (eventType.includes('FAILURE')) status = 'failure';
    if (eventType.includes('MFA_CHALLENGE')) status = 'info';
    if (eventType.includes('PASSWORD_RESET_REQUEST')) status = 'warning';
    
    if (eventType === 'LOGIN_FAILURE') {
        details.failureReason = Math.random() > 0.5 ? "Invalid credentials" : "Account locked";
        details.attempts = Math.floor(Math.random() * 5) + 1;
    }
     if (eventType === 'LOGIN_SUCCESS' && Math.random() > 0.8) {
        details.isNewDevice = true;
    }


    events.push({
      id: `auth_${Date.now()}_${i}`,
      timestamp: new Date(Date.now() - randomPastMilliseconds).toISOString(),
      userId: user.id,
      userName: user.name,
      userEmail: user.id ? user.email : undefined,
      ipAddress: `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      userAgent: Math.random() > 0.6 ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36' : 'MyApp/1.0 (iPhone; iOS 14.7.1; Scale/3.00)',
      deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      eventType: eventType,
      status: status,
      details: Object.keys(details).length > 0 ? details : undefined,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const mockStats: AuthStats = {
  activeSessions: Math.floor(Math.random() * 200) + 50,
  failedLoginsToday: Math.floor(Math.random() * 50),
  successfulLoginsToday: Math.floor(Math.random() * 300) + 100,
  newDeviceLoginsToday: Math.floor(Math.random() * 20),
  alerts: Math.floor(Math.random() * 5),
};

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// API Simulation
const fetchAuthEvents = async (filters: AuthFilters, page: number = 1, limit: number = 15): Promise<{ events: AuthEvent[], totalCount: number, stats: AuthStats }> => {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  let mockEvents = generateMockAuthEvents(200);

  if (filters.userName) {
    mockEvents = mockEvents.filter(event => event.userName?.toLowerCase().includes(filters.userName!.toLowerCase()));
  }
  if (filters.ipAddress) {
    mockEvents = mockEvents.filter(event => event.ipAddress.includes(filters.ipAddress!));
  }
  if (filters.eventType) {
    mockEvents = mockEvents.filter(event => event.eventType === filters.eventType);
  }
  if (filters.status) {
    mockEvents = mockEvents.filter(event => event.status === filters.status);
  }
  if (filters.dateFrom) {
    mockEvents = mockEvents.filter(event => new Date(event.timestamp) >= new Date(filters.dateFrom!));
  }
  if (filters.dateTo) {
    mockEvents = mockEvents.filter(event => new Date(event.timestamp) <= new Date(filters.dateTo!));
  }
  
  const totalCount = mockEvents.length;
  const paginatedEvents = mockEvents.slice((page - 1) * limit, page * limit);
  
  // In a real scenario, stats might be recalculated based on filters or be separate
  return { events: paginatedEvents, totalCount, stats: mockStats }; 
};

const UserDisplay: React.FC<{ event: AuthEvent }> = ({ event }) => {
  if (!event.userName && event.eventType.includes('FAILURE')) {
    return <span className="text-gray-500 dark:text-gray-400 italic">Unknown / Invalid</span>;
  }
  if (!event.userName) {
     return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
  }
  const title = event.userEmail ? `${event.userName} <${event.userEmail}> (ID: ${event.userId || 'N/A'})` : event.userName;
  return (
    <div className="flex items-center" title={title}>
      <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[150px]">{event.userName}</span>
      {event.userId && (
        <Link href={`/super-admin/users/edit/${event.userId}`} className="ml-1.5 p-0.5 rounded-full text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-700/30" title="View User Profile">
          <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
};

const EventStatusIcon: React.FC<{ status: AuthEvent['status'], eventType: AuthEvent['eventType'] }> = ({ status, eventType }) => {
  if (eventType === 'LOGIN_SUCCESS') return <ShieldCheck className="h-4 w-4 text-green-500" />;
  if (eventType === 'LOGIN_FAILURE') return <ShieldOff className="h-4 w-4 text-red-500" />;
  if (status === 'success') return <ShieldCheck className="h-4 w-4 text-green-500" />;
  if (status === 'failure') return <ShieldOff className="h-4 w-4 text-red-500" />;
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <KeyRound className="h-4 w-4 text-gray-400" />;
};


export default function AuthMonitoringPage() {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [stats, setStats] = useState<AuthStats>(mockStats); // Initial mock stats
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AuthFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const eventsPerPage = 15;

  const loadAuthData = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const { events: fetchedEvents, totalCount: fetchedTotalCount, stats: fetchedStats } = await fetchAuthEvents(filters, page, eventsPerPage);
      setEvents(fetchedEvents);
      setTotalCount(fetchedTotalCount);
      setStats(fetchedStats); // Update stats
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch authentication events:", error);
      setEvents([]);
      setTotalCount(0);
      // TODO: User-friendly error notification
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuthData(1);
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(totalCount / eventsPerPage)) {
      loadAuthData(newPage);
    }
  };

  const totalPages = Math.ceil(totalCount / eventsPerPage);
  const toggleExpandRow = (eventId: string) => setExpandedRowId(prevId => (prevId === eventId ? null : eventId));

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color?: string, description?: string }> = ({ title, value, icon: Icon, color = 'text-gray-700 dark:text-gray-200', description }) => (
    <div className="p-5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color} opacity-70`} />
      </div>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
    </div>
  );
  
  const renderEventType = (eventType: AuthEvent['eventType']) => {
      const typeMap: Record<AuthEvent['eventType'], { text: string, color: string }> = {
        LOGIN_SUCCESS: { text: "Login Success", color: "text-green-600 dark:text-green-400" },
        LOGIN_FAILURE: { text: "Login Failure", color: "text-red-600 dark:text-red-400" },
        LOGOUT: { text: "Logout", color: "text-gray-600 dark:text-gray-400" },
        PASSWORD_RESET_REQUEST: { text: "Pwd Reset Req.", color: "text-yellow-600 dark:text-yellow-400" },
        PASSWORD_RESET_SUCCESS: { text: "Pwd Reset OK", color: "text-blue-600 dark:text-blue-400" },
        MFA_CHALLENGE: { text: "MFA Challenge", color: "text-indigo-600 dark:text-indigo-400" },
        MFA_SUCCESS: { text: "MFA Success", color: "text-purple-600 dark:text-purple-400" },
        MFA_FAILURE: { text: "MFA Failure", color: "text-pink-600 dark:text-pink-400" },
      };
      const { text, color } = typeMap[eventType] || { text: eventType.replace(/_/g, ' '), color: "text-gray-500" };
      return <span className={`font-medium ${color}`}>{text}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-full lg:max-w-7xl xl:max-w-screen-xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <KeyRound className="h-8 w-8 mr-3 text-purple-600 dark:text-purple-400" />
            Authentication Monitoring
          </h1>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Track login attempts, active sessions, and identify suspicious authentication patterns.
          </p>
        </div>
         <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            <Filter className="h-5 w-5" />
          </button>
          <button onClick={() => loadAuthData(currentPage)} title="Refresh data" className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <StatCard title="Active Sessions" value={stats.activeSessions} icon={Users} color="text-blue-600 dark:text-blue-400" description="Currently active user sessions." />
        <StatCard title="Successful Logins (24h)" value={stats.successfulLoginsToday} icon={ShieldCheck} color="text-green-600 dark:text-green-400" description="Successful authentications." />
        <StatCard title="Failed Logins (24h)" value={stats.failedLoginsToday} icon={ShieldOff} color="text-red-600 dark:text-red-400" description="Failed login attempts." />
        <StatCard title="New Device Logins (24h)" value={stats.newDeviceLoginsToday} icon={Smartphone} color="text-yellow-500 dark:text-yellow-400" description="Logins from unrecognized devices."/>
        <StatCard title="Security Alerts" value={stats.alerts} icon={AlertTriangle} color="text-orange-500 dark:text-orange-400" description="Active security alerts." />
      </div>
      
      {showFilters && (
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Filter Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Name/Email</label>
              <input type="text" name="userName" id="userName" placeholder="User Name/Email" value={filters.userName || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" />
            </div>
            <div>
              <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
              <input type="text" name="ipAddress" id="ipAddress" placeholder="IP Address" value={filters.ipAddress || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" />
            </div>
            <div>
              <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
              <select name="eventType" id="eventType" value={filters.eventType || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option value="">All Event Types</option>
                {(['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'MFA_CHALLENGE', 'MFA_SUCCESS', 'MFA_FAILURE'] as AuthEvent['eventType'][]).map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select name="status" id="status" value={filters.status || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option value="">All Statuses</option>
                {(['success', 'failure', 'info', 'warning'] as AuthEvent['status'][]).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
              <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
              <input type="date" name="dateTo" id="dateTo" value={filters.dateTo || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" />
            </div>
          </div>
           <div className="mt-4 flex justify-end">
             <button onClick={() => { setFilters({}); loadAuthData(1); }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md shadow-sm">Clear Filters</button>
           </div>
        </div>
      )}

      {/* Auth Events Table */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-x-auto">
         {isLoading && events.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400"> {/* Loading state */}
            <svg className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading authentication events...
          </div>
        ) : !isLoading && events.length === 0 ? (
           <p className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">No authentication events found matching your criteria.</p>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/80 sticky top-0">
                <tr>
                  <th className="w-10 px-2 py-3.5"></th> {/* Expand */}
                  <th className="pl-3 pr-4 sm:pl-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Timestamp</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Event Type</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">IP Address</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Location</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell">Device</th>
                  <th className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {events.map((event) => (
                  <Fragment key={event.id}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${expandedRowId === event.id ? 'bg-gray-50 dark:bg-gray-700/40' : ''}`}>
                      <td className="px-2 py-3 text-center">
                        <button onClick={() => toggleExpandRow(event.id)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                          {expandedRowId === event.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="pl-3 pr-4 sm:pl-5 py-3 whitespace-nowrap text-sm tabular-nums">{formatDate(event.timestamp)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm"><UserDisplay event={event} /></td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">{renderEventType(event.eventType)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm hidden md:table-cell">{event.ipAddress}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm hidden lg:table-cell">
                        {event.location !== 'Unknown Location' && <MapPin className="h-3.5 w-3.5 mr-1.5 inline-block text-gray-400" />}
                        {event.location || 'N/A'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm hidden xl:table-cell capitalize">
                        {event.deviceType !== 'unknown' && (event.deviceType === 'desktop' ? <Globe className="h-4 w-4 mr-1.5 inline-block text-gray-400" /> : <Smartphone className="h-4 w-4 mr-1.5 inline-block text-gray-400" />)}
                        {event.deviceType}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <EventStatusIcon status={event.status} eventType={event.eventType} />
                      </td>
                    </tr>
                    {expandedRowId === event.id && (
                      <tr className="bg-gray-100 dark:bg-gray-700/60">
                        <td colSpan={8} className="p-0">
                          <div className="px-5 py-4 space-y-3">
                            <h4 className="text-sm font-semibold">Event Details:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                              <div><strong>Event ID:</strong> {event.id}</div>
                              {event.userId && <div><strong>User ID:</strong> {event.userId}</div>}
                              {event.userEmail && <div><strong>User Email:</strong> {event.userEmail}</div>}
                              <div><strong>Full User Agent:</strong> <span className="break-all">{event.userAgent}</span></div>
                              {event.details && Object.entries(event.details).map(([key, value]) => (
                                <div key={key}><strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}</div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">Page {currentPage} of {totalPages} (Total: {totalCount} events)</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1 || isLoading} 
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages || isLoading} 
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Common input class (example, adjust as needed for your project's styling)
// For this example, I'll apply Tailwind classes directly in the filter inputs for brevity
// but in a real app, you'd define .input-class in your global CSS
// const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm";
// Remember to apply these classes or your equivalent to the filter inputs.
// For the sake of this example, I have added them directly. If you have a global .input-class, these would just be className="input-class"

// Helper for classNames, if you use a utility like clsx or classnames:
// import clsx from 'clsx';

