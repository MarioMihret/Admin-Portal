"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { FileText, Filter, Search, CalendarDays, UserCircle, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Eye } from 'lucide-react';

// Interfaces
interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail?: string; // Optional, for better display
  actorType: 'user' | 'admin' | 'system' | 'organizer';
  action: string; // e.g., USER_LOGIN, ADMIN_CREATED, EVENT_UPDATED
  entityType?: string; // e.g., User, Admin, Event, University
  entityId?: string;
  entityDescription?: string; // e.g., "Event: Annual Tech Conference"
  details?: Record<string, any> | string; // Can be structured or a simple string
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'pending';
}

interface AuditLogFilters {
  dateFrom?: string;
  dateTo?: string;
  actorName?: string;
  actionType?: string;
  entityType?: string;
  status?: 'success' | 'failure' | 'pending' | '';
}

// Mock Data Generation
const generateMockAuditLogs = (count: number): AuditLogEntry[] => {
  const logs: AuditLogEntry[] = [];
  const actors = [
    { id: 'usr_jane_doe', name: 'Jane Doe', email: 'jane.doe@example.com', type: 'user' as const },
    { id: 'adm_john_smith', name: 'John Smith', email: 'john.smith@admin.co', type: 'admin' as const },
    { id: 'org_eventmakers', name: 'Event Makers Inc.', email: 'contact@eventmakers.com', type: 'organizer' as const },
    { id: 'sys_batch_process', name: 'System Process', type: 'system' as const },
  ];
  const actions = [
    'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS',
    'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_DELETED',
    'EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_PUBLISHED', 'EVENT_CANCELLED',
    'TICKET_PURCHASED', 'SETTINGS_UPDATED', 'PROFILE_VIEWED', 'DATA_EXPORTED'
  ];
  const entityTypes = ['User', 'Admin', 'Event', 'University', 'Ticket', 'Settings'];
  const statuses: AuditLogEntry['status'][] = ['success', 'failure', 'pending'];

  for (let i = 0; i < count; i++) {
    const actor = actors[Math.floor(Math.random() * actors.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const randomPastMilliseconds = Math.random() * 30 * 24 * 60 * 60 * 1000; // up to 30 days ago
    
    logs.push({
      id: `log_${Date.now()}_${i}`,
      timestamp: new Date(Date.now() - randomPastMilliseconds).toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorType: actor.type,
      action: action,
      entityType: entityType,
      entityId: `ent_${Math.random().toString(36).substring(2, 10)}`,
      entityDescription: `${entityType} ID: ${Math.random().toString(36).substring(2, 7)}`,
      details: action.includes('LOGIN') && status === 'failure' ? { attempt: i % 5 + 1, reason: "Invalid credentials" } : { info: `Performed action ${action}` },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      userAgent: Math.random() > 0.5 ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      status: status,
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};


// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// API Simulation
const fetchAuditLogs = async (filters: AuditLogFilters, page: number = 1, limit: number = 15): Promise<{ logs: AuditLogEntry[], totalCount: number }> => {
  console.log("Fetching audit logs with filters:", filters, "Page:", page, "Limit:", limit);
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); // Simulate API call delay
  let mockLogs = generateMockAuditLogs(150); // Generate a larger set to simulate filtering and pagination

  // Apply filters (basic example)
  if (filters.actorName) {
    mockLogs = mockLogs.filter(log => log.actorName.toLowerCase().includes(filters.actorName!.toLowerCase()));
  }
  if (filters.actionType) {
    mockLogs = mockLogs.filter(log => log.action.toLowerCase().includes(filters.actionType!.toLowerCase()));
  }
  if (filters.entityType) {
    mockLogs = mockLogs.filter(log => log.entityType?.toLowerCase().includes(filters.entityType!.toLowerCase()));
  }
  if (filters.status) {
    mockLogs = mockLogs.filter(log => log.status === filters.status);
  }
  if (filters.dateFrom) {
    mockLogs = mockLogs.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom!));
  }
  if (filters.dateTo) {
    mockLogs = mockLogs.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo!));
  }
  
  const totalCount = mockLogs.length;
  const paginatedLogs = mockLogs.slice((page - 1) * limit, page * limit);
  
  return { logs: paginatedLogs, totalCount };
};

const ActorDisplay: React.FC<{ log: AuditLogEntry }> = ({ log }) => {
  let icon;
  let actorTitle = `${log.actorName} (${log.actorType})`;
  if (log.actorEmail) actorTitle += ` <${log.actorEmail}>`;

  switch (log.actorType) {
    case 'admin': icon = <UserCircle className="h-4 w-4 text-purple-500 mr-1.5" />; break;
    case 'user': icon = <UserCircle className="h-4 w-4 text-blue-500 mr-1.5" />; break;
    case 'organizer': icon = <UserCircle className="h-4 w-4 text-green-500 mr-1.5" />; break;
    case 'system': icon = <UserCircle className="h-4 w-4 text-gray-500 mr-1.5" />; break; // Could use a specific system icon
    default: icon = <UserCircle className="h-4 w-4 text-gray-400 mr-1.5" />;
  }
  return (
    <div className="flex items-center" title={actorTitle}>
      {icon}
      <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[150px] sm:max-w-[200px]" title={log.actorName}>{log.actorName}</span>
    </div>
  );
};

const StatusBadge: React.FC<{ status: AuditLogEntry['status'] }> = ({ status }) => {
  let colorClasses = '';
  switch (status) {
    case 'success': colorClasses = 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300'; break;
    case 'failure': colorClasses = 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'; break;
    case 'pending': colorClasses = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300'; break;
    default: colorClasses = 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
  }
  return (
    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} capitalize`}>
      {status}
    </span>
  );
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogRowId, setExpandedLogRowId] = useState<string | null>(null);

  const logsPerPage = 15;

  const loadAuditLogs = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const { logs: fetchedLogs, totalCount: fetchedTotalCount } = await fetchAuditLogs(filters, page, logsPerPage);
      setLogs(fetchedLogs);
      setTotalCount(fetchedTotalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]); // Clear logs on error
      setTotalCount(0);
      // TODO: Add user-friendly error notification
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs(1); // Load initial data or on filter change (debounced)
  }, [filters]); // Consider debouncing this effect if filters change rapidly

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(totalCount / logsPerPage)) {
      loadAuditLogs(newPage);
    }
  };

  const totalPages = Math.ceil(totalCount / logsPerPage);

  const toggleExpandRow = (logId: string) => {
    setExpandedLogRowId(prevId => (prevId === logId ? null : logId));
  };
  
  const renderDetails = (details: AuditLogEntry['details']) => {
    if (!details) return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
    if (typeof details === 'string') return <span className="truncate max-w-xs" title={details}>{details}</span>;
    
    return (
      <div className="space-y-1 text-xs">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-semibold text-gray-600 dark:text-gray-300 mr-1.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
            <span className="text-gray-700 dark:text-gray-200 truncate max-w-[200px]" title={String(value)}>{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-full lg:max-w-7xl xl:max-w-screen-xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <FileText className="h-8 w-8 mr-3 text-purple-600 dark:text-purple-400" />
            Audit Log
          </h1>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Track actions and events across the platform.
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
          <button onClick={() => loadAuditLogs(currentPage)} title="Refresh audit logs" className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Filter Logs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label htmlFor="actorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actor Name</label>
              <input type="text" name="actorName" id="actorName" value={filters.actorName || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" placeholder="e.g., John Doe" />
            </div>
            <div>
              <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action Type</label>
              <input type="text" name="actionType" id="actionType" value={filters.actionType || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" placeholder="e.g., USER_LOGIN" />
            </div>
            <div>
              <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Type</label>
              <input type="text" name="entityType" id="entityType" value={filters.entityType || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" placeholder="e.g., Event, User" />
            </div>
             <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select name="status" id="status" value={filters.status || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option value="">All</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="pending">Pending</option>
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
             <button 
                onClick={() => { setFilters({}); loadAuditLogs(1); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md shadow-sm"
              >
                Clear Filters
              </button>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-x-auto">
        {isLoading && logs.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading audit logs...
          </div>
        ) : !isLoading && logs.length === 0 ? (
          <p className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
            No audit logs found matching your criteria.
          </p>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/80 sticky top-0">
                <tr>
                  <th scope="col" className="px-2 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10"></th> {/* Expand icon */}
                  <th scope="col" className="pl-3 pr-4 sm:pl-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actor</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entity</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">IP Address</th>
                  {/* <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${expandedLogRowId === log.id ? 'bg-gray-50 dark:bg-gray-700/40' : ''}`}>
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        <button onClick={() => toggleExpandRow(log.id)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          {expandedLogRowId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="pl-3 pr-4 sm:pl-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                         <ActorDisplay log={log} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                        <span className="font-medium" title={log.action}>{log.action}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {log.entityType ? (
                          <div className="flex items-center">
                            {/* Could add entity-specific icon here */}
                            <span title={`${log.entityType}: ${log.entityId}`}>{log.entityDescription || log.entityType}</span>
                            {log.entityId && (
                                <Link href={`/super-admin/${log.entityType.toLowerCase()}s/edit/${log.entityId}`} className="ml-2 p-1 rounded-full text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-700/30" title={`View ${log.entityType}`}>
                                  <ArrowRight size={14} />
                                </Link>
                              )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </td>
                       <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{log.ipAddress || 'N/A'}</td>
                      {/* <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{renderDetails(log.details)}</td> */}
                    </tr>
                    {expandedLogRowId === log.id && (
                       <tr className="bg-gray-100 dark:bg-gray-700/60">
                        <td colSpan={7} className="p-0"> {/* Adjusted colSpan */}
                          <div className="px-5 py-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-white">Log Details:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                                <div><strong>Log ID:</strong> <span className="text-gray-600 dark:text-gray-300">{log.id}</span></div>
                                <div><strong>Actor ID:</strong> <span className="text-gray-600 dark:text-gray-300">{log.actorId}</span></div>
                                {log.actorEmail && <div><strong>Actor Email:</strong> <span className="text-gray-600 dark:text-gray-300">{log.actorEmail}</span></div>}
                                <div><strong>Actor Type:</strong> <span className="text-gray-600 dark:text-gray-300 capitalize">{log.actorType}</span></div>
                                {log.entityId && <div><strong>Entity ID:</strong> <span className="text-gray-600 dark:text-gray-300">{log.entityId}</span></div>}
                                {log.userAgent && <div className="col-span-1 sm:col-span-2 lg:col-span-3"><strong>User Agent:</strong> <span className="text-gray-600 dark:text-gray-300 break-all">{log.userAgent}</span></div>}
                                <div className="col-span-1 sm:col-span-2 lg:col-span-3"><strong>Raw Details:</strong> <pre className="whitespace-pre-wrap bg-gray-200 dark:bg-gray-600 p-2 rounded text-xs text-gray-700 dark:text-gray-200 max-h-40 overflow-y-auto">{JSON.stringify(log.details, null, 2)}</pre></div>
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
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages} (Total: {totalCount} logs)
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1 || isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages || isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
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

// Need to ensure Fragment is imported if not already globally available
// import React, { Fragment } from 'react'; 