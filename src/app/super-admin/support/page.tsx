"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LifeBuoy, Search, Filter, RefreshCw, AlertTriangle, CheckCircle, Clock,
  XCircle, ChevronDown, Eye, MessageSquare, Info, Bug, Lightbulb, HelpCircle,
  ThumbsUp, ClipboardCopy, Check, Inbox, MailOpen, Archive, Send,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

// Interface for data coming from the API (matches backend model)
interface ApiContactMessage {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status?: 'new' | 'read' | 'archived' | 'replied';
  createdAt: string; // Dates are typically strings in JSON
  updatedAt: string;
}

// Interface for data shape used in the UI
interface ContactMessageDisplay extends ApiContactMessage {}

interface FetchResponse {
  messages: ApiContactMessage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Updated status list to match backend
const MESSAGE_STATUSES: NonNullable<ApiContactMessage['status']>[] = ['new', 'read', 'archived', 'replied'];

// Categories for potential client-side filtering or future use. 
// If not used, this can be removed.
// const SUBMISSION_CATEGORIES = ['Issue Report', 'Suggestion', 'Inquiry', 'Feedback', 'Appreciation'] as const;
// type SubmissionCategory = typeof SUBMISSION_CATEGORIES[number];

// Fetches support messages from the API
const fetchSupportMessages = async (
  page: number,
  limit: number,
  statusFilter: NonNullable<ApiContactMessage['status']> | 'All'
): Promise<FetchResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (statusFilter !== 'All') {
    params.append('status', statusFilter);
  }
  // console.log(`Fetching support messages: /api/super/support-messages?${params.toString()}`);
  const response = await fetch(`/api/super/support-messages?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch support messages' }));
    throw new Error(errorData.message || 'Failed to fetch support messages');
  }
  return response.json();
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getStatusChipClass = (status?: ApiContactMessage['status']) => {
  const currentStatus = status || 'new';
  switch (currentStatus) {
    case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300';
    case 'read': return 'bg-purple-100 text-purple-800 dark:bg-purple-700/30 dark:text-purple-300';
    case 'archived': return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400';
    case 'replied': return 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400';
  }
};

const getStatusIcon = (status?: ApiContactMessage['status']) => {
  const currentStatus = status || 'new';
  switch (currentStatus) {
    case 'new': return <Inbox className="h-4 w-4" />;
    case 'read': return <MailOpen className="h-4 w-4" />;
    case 'archived': return <Archive className="h-4 w-4" />;
    case 'replied': return <Send className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
};

export default function SupportPage() {
  const [messages, setMessages] = useState<ContactMessageDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<NonNullable<ApiContactMessage['status']> | 'All'>('new');
  // const [categoryFilter, setCategoryFilter] = useState<SubmissionCategory | 'All'>('All'); // Category filter removed
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesPerPage = 10;

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageDisplay | null>(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // console.log('loadMessages called with page:', currentPage, 'statusFilter:', statusFilter);
    try {
      const result = await fetchSupportMessages(currentPage, messagesPerPage, statusFilter);
      setMessages(result.messages);
      setTotalPages(result.pagination.pages);
      setTotalMessages(result.pagination.total);
      setCurrentPage(result.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching messages.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, messagesPerPage]); // Added messagesPerPage to dependencies

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const filteredMessages = messages.filter(message => {
    const term = searchTerm.toLowerCase();
    const searchMatch = term === '' ||
      message.name.toLowerCase().includes(term) ||
      message.email.toLowerCase().includes(term) ||
      (message.subject && message.subject.toLowerCase().includes(term)) ||
      message.message.toLowerCase().includes(term) ||
      message._id.toLowerCase().includes(term);
    return searchMatch;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('new');
    // setCategoryFilter('All'); // Category filter removed
    setCurrentPage(1);
  };

  const viewMessageDetails = (message: ContactMessageDisplay) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMessage(null);
  };

  const handleCopyReference = (textToCopy: string, messageId: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading Messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Error Loading Messages</h2>
        <p className="text-red-600 dark:text-red-400 text-center mb-6 px-4">{error}</p>
        <button onClick={loadMessages} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          <RefreshCw className="h-5 w-5 mr-2" /> Try Again
        </button>
      </div>
    );
  }

  const selectBaseClasses = "block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[42px]";

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl space-y-8 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-800 dark:text-white flex items-center">
            <MessageSquare className="h-8 w-8 sm:h-9 sm:w-9 mr-3 text-purple-600 dark:text-purple-400" />
            Support Messages
          </h1>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Review and manage user messages from the contact form.
          </p>
        </div>
        <button onClick={loadMessages} title="Refresh messages" className={`p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors ${isLoading ? 'cursor-not-allowed' : ''}`}>
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 sm:p-5 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end mb-6">
          <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
            <label htmlFor="search-messages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                id="search-messages"
                placeholder="Search by name, email, subject, message, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${selectBaseClasses} pl-10`}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as NonNullable<ApiContactMessage['status']> | 'All'); setCurrentPage(1); }}
              className={selectBaseClasses}
            >
              <option value="All">All Statuses</option>
              {MESSAGE_STATUSES.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <button 
                onClick={handleClearFilters} 
                className="w-full h-[42px] mt-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
                <XCircle className="h-5 w-5 mr-2"/> Clear Filters
            </button>
          </div>
        </div>

        {isLoading && messages.length > 0 && (
            <div className="py-3 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating messages...
            </div>
        )}
        {!isLoading && filteredMessages.length === 0 && (
          <div className="text-center py-16">
            <Inbox className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 opacity-75" />
            <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">No Messages Found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter === 'All' && searchTerm === '' ? 'There are no support messages yet.' : 'Try adjusting your search or filter criteria, or check back later.'}
            </p>
            {(statusFilter !== 'All' || searchTerm !== '') && (
                <button onClick={handleClearFilters} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    Clear All Filters
                </button>
            )}
          </div>
        )}

        {filteredMessages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {filteredMessages.map((message) => (
              <div 
                key={message._id} 
                className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="p-5 space-y-4 flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate" title={message.name}>{message.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={message.email}>{message.email}</p>
                    </div>
                    <span className={`px-3 py-1 inline-flex items-center text-xs leading-tight font-bold rounded-full ${getStatusChipClass(message.status)}`}>
                      {getStatusIcon(message.status)}
                      <span className="ml-1.5">{(message.status || 'new').charAt(0).toUpperCase() + (message.status || 'new').slice(1)}</span>
                    </span>
                  </div>
                  
                  <div className="pt-1 space-y-1">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={message.subject || 'No Subject'}>
                      {message.subject || <span className="italic text-gray-400 dark:text-gray-500">No Subject</span>}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed h-12 overflow-hidden relative group" title={message.message}>
                      {truncateText(message.message, 90)}
                      {message.message.length > 90 && 
                        <span className="absolute bottom-0 right-0 bg-gradient-to-l from-white dark:from-gray-800 via-white/80 dark:via-gray-800/80 to-transparent pr-1 text-xs text-purple-500 group-hover:opacity-0 transition-opacity">more</span>
                      }
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="inline h-3.5 w-3.5 mr-1 opacity-70"/> 
                      {formatDate(message.createdAt)}
                    </p>
                    <div className="flex items-center space-x-1.5">
                      <button 
                        onClick={() => viewMessageDetails(message)} 
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 p-1.5 rounded-md hover:bg-purple-500/10 dark:hover:bg-purple-400/10 transition-all duration-150"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleCopyReference(message._id, message._id)} 
                        className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 p-1.5 rounded-md hover:bg-gray-500/10 dark:hover:bg-gray-400/10 transition-all duration-150" 
                        title="Copy ID"
                      >
                        {copiedId === message._id ? <Check className="h-5 w-5 text-green-500" /> : <ClipboardCopy className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center">
                <div className="text-sm text-gray-700 dark:text-gray-400 mb-2 sm:mb-0">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span> (Total: <span className="font-medium">{totalMessages}</span> messages)
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronsLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border-y border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {currentPage}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 border-y border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronsRight className="h-5 w-5" />
                    </button>
                </nav>
            </div>
        )}
      </div>

      {isDetailModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out opacity-100">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-in-out scale-100 opacity-100">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate flex items-center">
                <Info className="h-5 w-5 mr-2.5 text-purple-500 dark:text-purple-400 shrink-0" />
                <span title={selectedMessage.subject || 'No Subject'}>
                  {selectedMessage.subject || <span className="italic text-gray-500 dark:text-gray-400">No Subject</span>}
                </span>
              </h2>
              <button 
                onClick={closeDetailModal} 
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Close"
              >
                <XCircle className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-sm">
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400 flex items-center"><MailOpen className="h-4 w-4 mr-1.5 opacity-80"/>From:</p>
                  <p className="text-gray-800 dark:text-white pl-[22px]">{selectedMessage.name} &lt;{selectedMessage.email}&gt;</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400 flex items-center"><ClipboardCopy className="h-4 w-4 mr-1.5 opacity-80"/>Reference ID:</p>
                  <div className="text-gray-800 dark:text-white flex items-center pl-[22px]">
                    <span className="truncate">{selectedMessage._id}</span>
                    <button onClick={() => handleCopyReference(selectedMessage._id, selectedMessage._id)} className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-100/50 dark:hover:bg-gray-700/20 flex-shrink-0" title="Copy ID">
                        {copiedId === selectedMessage._id ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400 flex items-center"><Info className="h-4 w-4 mr-1.5 opacity-80"/>Status:</p>
                  <div className="pl-[22px]">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(selectedMessage.status)} items-center`}>
                      {getStatusIcon(selectedMessage.status)}
                      <span className="ml-1.5">{(selectedMessage.status || 'new').charAt(0).toUpperCase() + (selectedMessage.status || 'new').slice(1)}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400 flex items-center"><Clock className="h-4 w-4 mr-1.5 opacity-80"/>Received:</p>
                  <p className="text-gray-800 dark:text-white pl-[22px]">{formatDate(selectedMessage.createdAt)}</p>
                </div>
                 {selectedMessage.updatedAt !== selectedMessage.createdAt && (
                  <div className="md:col-span-2">
                    <p className="font-medium text-gray-500 dark:text-gray-400 flex items-center"><RefreshCw className="h-4 w-4 mr-1.5 opacity-80"/>Last Updated:</p>
                    <p className="text-gray-800 dark:text-white pl-[22px]">{formatDate(selectedMessage.updatedAt)}</p>
                  </div>
                 )}
              </div>
              
              <div className="pt-2">
                <p className="font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 opacity-80"/>Message:</p>
                <div className="p-3.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/40 min-h-[100px]">
                    <p className="text-gray-800 dark:text-white whitespace-pre-wrap break-words text-sm leading-relaxed">{selectedMessage.message}</p>
                 </div>
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button 
                onClick={closeDetailModal} 
                className="px-5 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyling = "className=\"block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[42px]\"";
const retryButtonStyling = "className=\"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500\"";
const refreshButtonStyling = "className=\"p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors\"";
const svgLoadingSpinner = `<svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

// Note: Replace placeholder styling comments like /* Select styling */ with actual Tailwind class strings for buttons and select elements. 