"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Search, User, ShieldCheck, CheckCircle, XCircle, MoreHorizontal, Users, AlertTriangle as AlertTriangleIcon, University, ArrowLeft, ArrowRight, Loader2 as Loader2Icon, FilterX as FilterXIcon, Shield as ShieldIcon } from 'lucide-react';
import { toast } from 'sonner';

// Updated Admin interface to align with the modified API response
interface AdminUser {
  _id: string; // From MongoDB
  id: string;  // Typically mapped from _id, API should provide this
  name: string;
  email: string;
  role: 'admin' | 'super-admin'; // Roles as defined in the Role collection
  university: string; // Expected to be present as API filters by it
  status: 'Active' | 'Inactive'; // API now provides this based on Role.isActive
  isActive: boolean; // Derived client-side based on status, or API could provide
  createdAt?: string;
  updatedAt?: string;
}

interface FetchAdminsResponse {
  admins: AdminUser[]; // Assuming API returns { admins: [...] } or just AdminUser[]
  // Add pagination fields if your API supports them
}

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
  return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Define the list of universities (can be shared or fetched)
const universities = [
  { id: 'woldia', name: 'Woldia University', color: 'bg-indigo-600' },
  { id: 'addis_ababa', name: 'Addis Ababa University', color: 'bg-green-500' },
  { id: 'bahir_dar', name: 'Bahir Dar University', color: 'bg-yellow-500' },
  { id: 'mekelle', name: 'Mekelle University', color: 'bg-red-500' },
];

const TEMP_ADMIN_FETCH_LIMIT = 500; // Temporary limit

export default function AdminManagementPage() {
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTermInput, setSearchTermInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchTermInput, 300);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const fetchAdminsForUniversity = useCallback(async (universityName: string | null, currentSearchTerm = debouncedSearchTerm) => {
    if (!universityName) {
      setAdmins([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        university: universityName,
        limit: TEMP_ADMIN_FETCH_LIMIT.toString(),
        // search: currentSearchTerm, // Enable if API supports server-side search
      });
      const response = await fetch(`/api/super/admins?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Failed to fetch admins: ${response.status}`);
      }
      const data: AdminUser[] = await response.json();
      setAdmins(data.map(u => ({ ...u, id: u._id, isActive: u.status === 'Active' })));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
      setAdmins([]);
      toast.error(`Failed to load admins for ${universityName}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchAdminsForUniversity(selectedUniversity, debouncedSearchTerm);
  }, [selectedUniversity, debouncedSearchTerm, fetchAdminsForUniversity]);

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!selectedUniversity) return; // Should ideally not happen if button is disabled
    if (window.confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      toast.loading(`Deleting ${adminName}...`, { id: `delete-${adminId}` });
      try {
        const response = await fetch(`/api/super/admins/${adminId}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Failed to delete admin: ${response.status}`);
        }
        // const deletedInfo = await response.json(); // Contains { message: "...", admin: deletedAdminData }
        setAdmins(prevAdmins => prevAdmins.filter(admin => (admin.id || admin._id) !== adminId));
        toast.success(`Admin "${adminName}" deleted successfully.`, { id: `delete-${adminId}` });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast.error(`Failed to delete "${adminName}": ${message}`, { id: `delete-${adminId}` });
      }
    }
  };
  
  const filteredAdmins = admins.filter(admin => {
    const term = debouncedSearchTerm.toLowerCase();
    const nameMatch = term ? admin.name.toLowerCase().includes(term) : true;
    const emailMatch = term ? admin.email.toLowerCase().includes(term) : true;
    const roleMatch = roleFilter === 'All' || admin.role === roleFilter;
    const statusMatch = statusFilter === 'All' || admin.status === statusFilter;
    // University is filtered by API, client search can be broader
    const universityMatch = term ? admin.university.toLowerCase().includes(term) : true;
    return (nameMatch || emailMatch || (term && universityMatch)) && roleMatch && statusMatch; 
  });

  const handleClearFilters = (showToast = true) => {
    setSearchTermInput('');
    setRoleFilter('All');
    setStatusFilter('All');
    if (showToast) {
      toast.info("Filters cleared"); 
    }
  };

  const hasActiveFilters = searchTermInput !== '' || roleFilter !== 'All' || statusFilter !== 'All';

  // University Selection Screen
  if (!selectedUniversity) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-12">
          Select University to Manage Admins
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {universities.map((uni) => {
            const isWoldia = uni.id === 'woldia';
            const isActiveWoldiaCard = isWoldia; // Explicitly for clarity

            const uniColorClasses = isActiveWoldiaCard 
              ? `${uni.color} text-white hover:brightness-110 dark:hover:brightness-125 transform hover:-translate-y-1.5 focus:${uni.color.replace('bg-', 'ring-')} border-transparent hover:ring-4 hover:ring-white/30 dark:hover:ring-white/20`
              : 'bg-gray-200 dark:bg-gray-750 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70 hover:bg-gray-200/90 dark:hover:bg-gray-750/90'; // Slightly more subdued for non-active
            
            const baseClasses = "group block p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out text-left border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 overflow-hidden relative";
            
            return (
              <button 
                key={uni.id} 
                onClick={() => {
                  if (isActiveWoldiaCard) {
                    setSelectedUniversity(uni.name);
                  } else {
                    toast.info(`Admin management for ${uni.name} is not yet available.`, { 
                      icon: <AlertTriangleIcon className="h-5 w-5 text-orange-400" />, 
                      description: "Please check back later for updates."
                    });
                  }
                }}
                className={`${baseClasses} ${uniColorClasses}`}
              >
                {!isActiveWoldiaCard && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-orange-400 dark:bg-orange-500 text-white text-xs font-semibold rounded-full shadow-md">
                    Coming Soon
                  </div>
                )}
                {isActiveWoldiaCard && (
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="h-6 w-6 text-white/80 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                )}
                <div className="flex items-center mb-4">
                  <University className={`h-8 w-8 mr-3 flex-shrink-0 ${isActiveWoldiaCard ? 'opacity-80 group-hover:opacity-100 group-hover:scale-110' : 'opacity-50'} transition-all duration-300`} />
                  <h2 className={`font-semibold ${isActiveWoldiaCard ? 'text-xl group-hover:underline' : 'text-lg'}`}>{uni.name}</h2>
                </div>
                <p className={`text-sm ${isActiveWoldiaCard ? 'opacity-90 pr-8' : 'opacity-60'}`}>
                  {isActiveWoldiaCard ? `Manage admins for ${uni.name}.` : `Admin setup for ${uni.name} is pending activation.`}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Main Admin Management UI
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8">
        <button 
          onClick={() => {setSelectedUniversity(null); setAdmins([]); setError(null); setIsLoading(false); setSearchTermInput(''); setRoleFilter('All'); setStatusFilter('All');}} 
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to University Selection
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
             Admins: <span className="text-blue-600 dark:text-blue-400">{selectedUniversity}</span>
          </h1>
          <Link href="/super-admin/admins/add" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150 shadow-md hover:shadow-lg whitespace-nowrap">
            <PlusCircle className="h-5 w-5" /> Add New Admin
        </Link>
        </div>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 items-end">
          <div className="md:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Admins</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
              <input type="text" name="search" id="search" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Name, email, university..." value={searchTermInput} onChange={(e) => setSearchTermInput(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select id="roleFilter" name="roleFilter" className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option> {/* Currently only 'Admin' */} 
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select id="statusFilter" name="statusFilter" className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div className="flex items-end">
              <button onClick={() => handleClearFilters()} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150">
                <FilterXIcon className="h-4 w-4" /> Clear Filters
          </button>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
          <div className="flex justify-center items-center py-12">
              <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
              <p className="ml-3 text-gray-600 dark:text-gray-300">Loading Admins for {selectedUniversity}...</p>
          </div>
      )}
      {error && !isLoading && (
          <div className="my-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-center">
              <AlertTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Failed to Load Admins</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-4">{error}</p>
              <button onClick={() => fetchAdminsForUniversity(selectedUniversity, debouncedSearchTerm)} className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  Try Again
              </button>
          </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700/80 border-b border-gray-300 dark:border-gray-600">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">University</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Date Joined</th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => {
                return (
                <tr key={admin.id || admin._id} className="group hover:bg-blue-50 dark:hover:bg-gray-700/60 transition-colors duration-150 ease-in-out">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-200 dark:bg-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-100 font-medium text-base group-hover:bg-blue-300 dark:group-hover:bg-blue-500 transition-colors">{admin.name.charAt(0).toUpperCase()}</div>
                      <div className="ml-4"><div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{admin.name}</div></div>
                  </div>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">{admin.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-600/40 dark:text-blue-200">
                      <ShieldIcon className="h-3.5 w-3.5 mr-1.5"/> {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">{admin.university}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                      admin.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-600/40 dark:text-green-200' :
                      'bg-red-100 text-red-800 dark:bg-red-600/40 dark:text-red-200'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {admin.status === 'Active' ? <CheckCircle className="h-3.5 w-3.5" /> : 
                         <XCircle className="h-3.5 w-3.5" />}
                    {admin.status}
                      </div>
                  </span>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">{formatDate(admin.createdAt)}</td>
                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center gap-2">
                      <Link href={`/super-admin/admins/edit/${admin.id || admin._id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-700/30" aria-label={`Edit ${admin.name}\'s details`}><Edit className="h-4 w-4" /></Link>
                      <button onClick={() => handleDeleteAdmin((admin.id || admin._id), admin.name)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/30" aria-label={`Delete ${admin.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
              )})
               : (
              <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                      <ShieldIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">No Admins Found</p>
                      {hasActiveFilters ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria, or <button onClick={() => handleClearFilters()} className="text-blue-600 hover:text-blue-500 underline">clear all filters</button>.</p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">There are currently no admins for {selectedUniversity}.</p>
                      )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
} 
