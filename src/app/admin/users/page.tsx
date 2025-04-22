"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Search,
  Plus,
  Mail,
  Edit,
  Trash2,
  UserX
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { userService, User, PaginationResult } from '@/services/userService';

export default function UsersPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationResult>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [seedInfo, setSeedInfo] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Check if redirected from add page to reset to page 1
  const pathname = usePathname();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const shouldRefresh = searchParams.get('refresh') === 'true';
  
  useEffect(() => {
    // Reset to page 1 when navigating to this page
    if (pathname === '/admin/users') {
      setPagination(prev => ({
        ...prev,
        page: 1
      }));
      
      // Force refresh if we have the refresh parameter
      if (shouldRefresh) {
        setRefreshCounter(prev => prev + 1);
        
        // Clear the refresh parameter from URL without page reload
        if (typeof window !== 'undefined') {
          const newUrl = `${window.location.pathname}`;
          window.history.replaceState({ path: newUrl }, '', newUrl);
        }
      }
    }
  }, [pathname, shouldRefresh]);

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      console.log('Fetching users with params:', { searchQuery, page: pagination.page, limit: pagination.limit });
      
      const response = await userService.getUsers(searchQuery, pagination.page, pagination.limit);
      console.log('User API response:', response);
      
      // Ensure users array exists and is an array
      if (!response || !response.users) {
        setUsers([]);
        setDebugInfo(`Invalid response format: ${JSON.stringify(response)}`);
        throw new Error('Invalid response from API');
      }
      
      // Validate each user object to prevent rendering errors
      const validatedUsers = response.users.map(user => ({
        _id: user._id || 'unknown',
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
        requirePasswordChange: Boolean(user.requirePasswordChange),
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString()
      }));
      
      setUsers(validatedUsers);
      setPagination(response.pagination || {
        total: validatedUsers.length,
        page: 1,
        limit: 10,
        pages: 1
      });
      
      console.log(`Loaded ${validatedUsers.length} users`);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setDebugInfo(err.message || 'Unknown error occurred');
      // Ensure users is at least an empty array
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to seed the database with initial admin user
  const seedDatabase = async () => {
    try {
      setSeeding(true);
      setSeedInfo(null);
      setError(null);
      
      console.log('Seeding database with initial admin user...');
      
      const response = await fetch('/api/seed');
      const data = await response.json();
      
      console.log('Seed response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSeedInfo(data.message || 'Database seeded successfully');
      
      // Refresh user list after seeding
      await fetchUsers();
    } catch (err: any) {
      console.error('Error seeding database:', err);
      setError('Failed to seed database. Please try again.');
      setDebugInfo(err.message || 'Unknown error occurred');
    } finally {
      setSeeding(false);
    }
  };

  // Initialize component
  useEffect(() => {
    setMounted(true);
    // Start at page 1 when first loading
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    fetchUsers();
  }, []);

  // Fetch users when search, pagination or refresh counter changes
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, pagination.page, pagination.limit, refreshCounter]);

  // Force refresh function to be called when user is created/deleted/updated
  const forceRefresh = () => {
    // Reset to page 1 to see newest users
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    // Trigger refresh
    setRefreshCounter(prev => prev + 1);
  };

  const handlePageChange = (newPage: number) => {
    // Ensure page is within valid bounds
    if (newPage < 1 || (pagination.pages && newPage > pagination.pages)) {
      return;
    }
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        // Force refresh after deletion
        forceRefresh();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, isCurrentlyActive: boolean) => {
    try {
      const action = isCurrentlyActive ? 'suspend' : 'activate';
      if (window.confirm(`Are you sure you want to ${action} this user?`)) {
        setActionLoading(userId);
        setError(null);
        await userService.updateUser(userId, { isActive: !isCurrentlyActive });
        
        // Update user in the local state to avoid full refresh
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? {...user, isActive: !isCurrentlyActive}
              : user
          )
        );
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(`Failed to ${isCurrentlyActive ? 'suspend' : 'activate'} user. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your users and their permissions
          </p>
        </div>
        <Link href="/admin/users/add" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Filter
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Export
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

      {/* Users table */}
      {!loading && (
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                          No users found in the database.
                        </p>
                        <div>
                          <button
                            onClick={seedDatabase}
                            disabled={seeding}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center mx-auto"
                          >
                            {seeding ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Seeding...
                              </>
                            ) : (
                              'Create Initial Admin User'
                            )}
                          </button>
                        </div>
                        {seedInfo && (
                          <div className="text-sm text-green-600 font-medium">
                            {seedInfo}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.name && user.name.length > 0 ? user.name[0] : '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'super-admin' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {user.role}
                          </span>
                        ) : user.role === 'admin' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {user.role}
                          </span>
                        ) : user.role === 'organizer' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                            {user.role}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role || 'user'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          
                          {/* Only show Reset Required badge for admin users */}
                          {user.requirePasswordChange && 
                           (user.role === 'admin' || user.role === 'super-admin') && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800" title="User needs to reset password">
                              Reset Required
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-500"
                            onClick={() => window.location.href = `mailto:${user.email}`}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-500"
                            onClick={() => router.push(`/admin/users/${user._id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className={`p-1 text-gray-400 hover:${user.isActive ? 'text-orange-500' : 'text-green-500'}`}
                            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                            title={user.isActive ? "Suspend user" : "Activate user"}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                          <button 
                            className="p-1 text-gray-400 hover:text-red-500"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total) || 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={`px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg ${pagination.page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Previous
            </button>
            {pagination.pages > 0 && (
              <div className="flex items-center px-3 py-1 text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
            )}
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.pages || pagination.page >= pagination.pages}
              className={`px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg ${!pagination.pages || pagination.page >= pagination.pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 