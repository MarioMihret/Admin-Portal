"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import ApplicationsStats from '@/components/admin/applications/ApplicationsStats';
import StatusBadge from '@/components/admin/applications/StatusBadge';
import { getApplications, getApplicationStats } from '@/services/applications';
import { filterApplications } from '@/lib/utils';
import { OrganizerApplication, ApplicationStats } from '@/types/applications';
import ChartCard from '@/components/admin/dashboard/ChartCard';

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for data
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<OrganizerApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  // Fetch data on mount or when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get applications
        const data = await getApplications();
        setApplications(data);
        
        // Apply filters (initial or from URL)
        const initialStatus = searchParams.get('status') || 'all';
        setStatusFilter(initialStatus);
        
        const filtered = filterApplications(data, searchTerm, initialStatus);
        setFilteredApplications(filtered);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
        setError("Could not load applications data. Please try again.");
      } finally {
        setIsLoading(false);
      }
      
      // Get stats
      try {
        setStatsLoading(true);
        setStatsError(null);
        const statsData = await getApplicationStats();
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStatsError("Could not load application statistics.");
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchData();
  }, [searchParams]);
  
  // Handle search and filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilteredApplications(filterApplications(applications, value, statusFilter));
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    setFilteredApplications(filterApplications(applications, searchTerm, value));
    
    // Update URL to reflect current filter
    if (value === 'all') {
      router.push('/admin/applications');
    } else {
      router.push(`/admin/applications?status=${value.toLowerCase()}`);
    }
  };
  
  // Handle approve/reject actions
  const handleApproveClick = (id: number | string) => {
    router.push(`/admin/applications/${id}?action=approve`);
  };
  
  const handleRejectClick = (id: number | string) => {
    router.push(`/admin/applications/${id}?action=reject`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organizer Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage organization applications for hosting events
        </p>
      </div>
      
      {/* Stats */}
      <div className="mb-6">
        <ApplicationsStats 
          stats={stats} 
          isLoading={statsLoading} 
          error={statsError || undefined}
        />
      </div>
      
      {/* Applications list */}
      <ChartCard 
        title="Applications" 
        isLoading={isLoading} 
        error={error || undefined}
      >
        <div className="flex flex-col h-full">
          {/* Search and filters */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <select 
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredApplications.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-500 py-12">
              <Search className="w-12 h-12 mb-3 text-gray-300" />
              <p>No applications found matching your criteria</p>
              {searchTerm || statusFilter !== 'all' ? (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setFilteredApplications(applications);
                    router.push('/admin/applications');
                  }}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto flex-grow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {application.name && application.name.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="ml-4 truncate">
                            <div className="text-sm font-medium text-gray-900 truncate">{application.name || 'No Name'}</div>
                            <div className="text-sm text-gray-500 truncate">{application.email || 'No Email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]">{application.organization}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-gray-500">{application.submittedDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={application.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/admin/applications/${application.id}`}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="View details"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          {application.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => handleApproveClick(application.id)}
                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                title="Approve application"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleRejectClick(application.id)}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                title="Reject application"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
} 