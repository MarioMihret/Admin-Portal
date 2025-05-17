"use client"; // Temp: Will likely need client components for interactivity, but can start server-side for static display

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Search, User as UserIcon, CheckCircle, XCircle, AlertTriangle, Loader2, FilterX, University, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is configured for toasts

// Define the expected shape of User data from the API (/api/users)
interface User {
  _id: string;
  id?: string; // Mongoose virtual id, will be mapped from _id
  name: string;
  email: string;
  role: string; // General role (e.g., 'Super Admin', 'Admin', 'User')
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  university?: string; // Assuming User model now has this field
  // Add any other fields returned by your /api/users endpoint
}

interface FetchUsersResponse {
  users: User[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

// Define the list of universities
const universities = [
  { id: 'woldia', name: 'Woldia University', color: 'bg-indigo-600' },
  { id: 'addis_ababa', name: 'Addis Ababa University', color: 'bg-green-500' },
  { id: 'bahir_dar', name: 'Bahir Dar University', color: 'bg-yellow-500' },
  { id: 'mekelle', name: 'Mekelle University', color: 'bg-red-500' },
];

export default function UserManagementPage() {
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Initially false, true only during fetch
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [searchTermInput, setSearchTermInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchTermInput, 300);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive'

  const TEMP_USER_FETCH_LIMIT = 500;

  // Modified fetch function
  const fetchUsersForUniversity = useCallback(async (universityName: string | null, currentSearchTerm = debouncedSearchTerm) => {
    if (!universityName) return; // Don't fetch if no university selected
    
    setIsLoading(true);
    setError(null);
    try {
      // Add university query parameter
      // TODO: Add pagination, search, filtering params later
      const queryParams = new URLSearchParams({
        university: universityName,
        limit: TEMP_USER_FETCH_LIMIT.toString(),
        // Add search, role, status params here if implementing server-side filtering
        // search: currentSearchTerm,
      });
      
      const response = await fetch(`/api/users?${queryParams.toString()}`); 
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Failed to fetch users: ${response.status}`);
      }
      const data: FetchUsersResponse | User[] = await response.json();
      let usersData: User[] = ('users' in data) ? data.users : data as User[];
      setUsers(usersData.map(u => ({ ...u, id: u._id })));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
      setUsers([]); // Clear users on error
      toast.error(`Failed to load users for ${universityName}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm]); // Include dependencies if server-side filtering is used

  // Effect to fetch users when selectedUniversity changes
  useEffect(() => {
    if (selectedUniversity) {
      // Reset filters when changing university?
      // handleClearFilters(false); // Optional: false to not show toast
      fetchUsersForUniversity(selectedUniversity);
    } else {
      // Clear user list if no university is selected
      setUsers([]);
    }
  }, [selectedUniversity, fetchUsersForUniversity]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!selectedUniversity) return; // Should not happen, but safeguard
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      toast.loading(`Deleting ${userName}...`, { id: `delete-${userId}` });
      try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Failed to delete user: ${response.status}`);
        }
        // Re-fetch users for the current university to update the list
        // OR filter locally if pagination isn't implemented yet
        setUsers(prevUsers => prevUsers.filter(user => (user.id || user._id) !== userId)); 
        // fetchUsersForUniversity(selectedUniversity); // Use this if pagination/server-filtering is active
        toast.success(`User "${userName}" deleted successfully.`, { id: `delete-${userId}` });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast.error(`Failed to delete "${userName}": ${message}`, { id: `delete-${userId}` });
      }
    }
  };
  
  // Filtered users based on client-side filters
  const filteredUsers = users.filter(user => {
    const searchTermLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = debouncedSearchTerm ? 
      user.name.toLowerCase().includes(searchTermLower) || 
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower) : true;
    
    const userStatus = user.isActive ? 'Active' : 'Inactive';
    const matchesStatus = statusFilter !== 'All' ? userStatus === statusFilter : true;
    const matchesRole = roleFilter !== 'All' ? user.role === roleFilter : true;
    return matchesSearch && matchesStatus && matchesRole;
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

  // Render University Selection Screen if no university is selected
  if (!selectedUniversity) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-12">
          Select University to Manage Users
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {universities.map((uni) => {
            const isWoldia = uni.id === 'woldia';
            
            const baseClasses = "group block p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out text-left border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 overflow-hidden relative";
            // Enhanced Woldia styles with hover pulse/glow and larger title
            const woldiaClasses = `${uni.color} text-white hover:brightness-110 dark:hover:brightness-125 transform hover:-translate-y-1.5 focus:${uni.color.replace('bg-', 'ring-')} border-transparent hover:ring-4 hover:ring-white/30 dark:hover:ring-white/20`; // Added hover ring for glow
            const otherClasses = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed opacity-75 hover:bg-gray-50 dark:hover:bg-gray-700/50';
            
            return (
              <button
                key={uni.id}
                onClick={() => {
                  if (isWoldia) {
                    setSelectedUniversity(uni.name);
                  } else {
                    toast.info(`Integration for ${uni.name} is coming soon!`);
                  }
                }}
                className={`${baseClasses} ${isWoldia ? woldiaClasses : otherClasses}`}
              >
                {/* Woldia Card Specific Enhancements */}
                {isWoldia && (
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="h-6 w-6 text-white/80 group-hover:translate-x-1 transition-transform duration-300" /> {/* Added arrow animation */}
                  </div>
                )}

                {/* Icon and Title */}
                <div className="flex items-center mb-4"> 
                  <University 
                    className={`h-8 w-8 mr-3 flex-shrink-0 ${isWoldia ? 'opacity-80 group-hover:opacity-100 group-hover:scale-110' : 'text-gray-400 dark:text-gray-500'} transition-all duration-300`} // Added scale animation
                  />
                  <h2 className={`font-semibold ${isWoldia ? 'text-xl group-hover:underline' : 'text-lg'}`}>
                    {uni.name}
                  </h2>
                </div>
                
                {/* Description / Status Text */}
                <p className={`text-sm ${isWoldia ? 'opacity-90 pr-8' : 'text-gray-500 dark:text-gray-400'}`}> 
                  {isWoldia 
                    ? `Select to manage users for ${uni.name}.`
                    : 'Integration under development.'
                  }
                </p>
                 {!isWoldia && (
                    <span className="mt-3 inline-block text-xs font-medium text-orange-600 dark:text-orange-400">Coming Soon</span>
                 )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Render User Management UI if a university is selected --- 
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header: University Name, Back Button, Add User Button */}
      <div className="mb-8">
        <button 
          onClick={() => setSelectedUniversity(null)} 
          className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to University Selection
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
             Users: <span className="text-purple-600 dark:text-purple-400">{selectedUniversity}</span>
          </h1>
          <Link href="/super-admin/users/add" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors duration-150 shadow-md hover:shadow-lg whitespace-nowrap">
            <PlusCircle className="h-5 w-5" /> Add New User
        </Link>
        </div>
      </div>

      {/* Filters Section */} 
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 items-end">
          {/* Search Input */}
          <div className="md:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
              <input type="text" name="search" id="search" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Name, email, or role..." value={searchTermInput} onChange={(e) => setSearchTermInput(e.target.value)} />
            </div>
          </div>
          {/* Role Filter */}
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select id="roleFilter" name="roleFilter" className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
              <option value="Organizer">Organizer</option> 
            </select>
          </div>
          {/* Status Filter */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select id="statusFilter" name="statusFilter" className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          {/* Clear Filters Button */} 
          {hasActiveFilters && (
            <div className="flex items-end">
              <button onClick={() => handleClearFilters()} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-150">
                <FilterX className="h-4 w-4" /> Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading/Error State specific to fetching users for the selected university */} 
      {isLoading && (
          <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="ml-3 text-gray-600 dark:text-gray-300">Loading Users for {selectedUniversity}...</p>
          </div>
      )}
      {error && !isLoading && (
          <div className="my-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Failed to Load Users</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-4">{error}</p>
              <button onClick={() => fetchUsersForUniversity(selectedUniversity, debouncedSearchTerm)} className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  Try Again
              </button>
          </div>
      )}

      {/* User Table - Only rendered if not loading and no fetch error */} 
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700/80 border-b border-gray-300 dark:border-gray-600">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Last Login</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Date Joined</th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                const statusText = user.isActive ? 'Active' : 'Inactive';
                return (
                <tr key={user.id || user._id} className="group hover:bg-purple-50 dark:hover:bg-gray-700/60 transition-colors duration-150 ease-in-out">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-200 dark:bg-purple-600 flex items-center justify-center text-purple-700 dark:text-purple-100 font-medium text-base group-hover:bg-purple-300 dark:group-hover:bg-purple-500 transition-colors">{user.name.charAt(0).toUpperCase()}</div>
                      <div className="ml-4"><div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{user.name}</div></div>
                  </div>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-600/40 dark:text-purple-200' :
                      user.role === 'Admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-600/40 dark:text-indigo-200' :
                      user.role === 'Organizer' ? 'bg-teal-100 text-teal-800 dark:bg-teal-700/50 dark:text-teal-200' : 
                      'bg-gray-100 text-gray-800 dark:bg-gray-500/40 dark:text-gray-300'
                    }`}>{user.role}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      statusText === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-600/40 dark:text-green-200' :
                      'bg-red-100 text-red-800 dark:bg-red-600/40 dark:text-red-200'
                    }`}>
                      <div className="flex items-center gap-1.5">{statusText === 'Active' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} {statusText}</div>
                  </span>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">{formatDate(user.lastLogin)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">{formatDate(user.createdAt)}</td>
                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center gap-2">
                      <Link href={`/super-admin/users/edit/${user.id || user._id}`} className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-1.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-700/30" aria-label={`Edit ${user.name}'s details`}><Edit className="h-4 w-4" /></Link>
                      <button onClick={() => handleDeleteUser(user.id || user._id, user.name)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/30" aria-label={`Delete ${user.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
              )})
               : (
              <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                      <UserIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">No Users Found</p>
                      {hasActiveFilters ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria, or <button onClick={() => handleClearFilters()} className="text-purple-600 hover:text-purple-500 underline">clear all filters</button>.</p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">There are currently no users for {selectedUniversity}.</p>
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