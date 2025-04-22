"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService, User } from '@/services/userService';
import { Edit, ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true,
    requirePasswordChange: false,
  });
  
  const router = useRouter();
  const userId = params.id;

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserById(userId);
        
        // Validate and normalize user data before setting state
        const validatedUser = {
          ...response.user,
          name: response.user.name || '',
          email: response.user.email || '',
          role: response.user.role || 'user',
          isActive: typeof response.user.isActive === 'boolean' ? response.user.isActive : true,
          requirePasswordChange: Boolean(response.user.requirePasswordChange),
          createdAt: response.user.createdAt || new Date().toISOString(),
          updatedAt: response.user.updatedAt || new Date().toISOString(),
          lastLogin: response.user.lastLogin || undefined,
          lastLogout: response.user.lastLogout || undefined,
          loginHistory: Array.isArray(response.user.loginHistory) ? response.user.loginHistory : []
        };
        
        // Remove lastPasswordChange if it's null
        if (response.user.lastPasswordChange) {
          (validatedUser as User).lastPasswordChange = response.user.lastPasswordChange;
        }
        
        setUser(validatedUser as User);
        
        // Initialize form data
        setFormData({
          name: validatedUser.name,
          email: validatedUser.email,
          role: validatedUser.role,
          isActive: validatedUser.isActive,
          requirePasswordChange: validatedUser.requirePasswordChange,
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare the update data
      const updateData: any = { ...formData };
      
      // Special handling for admin/super-admin roles
      if (user && (user.role === 'admin' || user.role === 'super-admin')) {
        // Preserve the admin role, don't allow it to be changed here
        updateData.role = user.role;
      }
      
      // Only include password if it was actually changed
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await userService.updateUser(userId, updateData);
      
      // Refresh the user data
      try {
        const response = await userService.getUserById(userId);
        setUser(response.user);
      } catch (fetchErr) {
        console.error('Error fetching updated user:', fetchErr);
      }
      
      setEditing(false);
      setSuccessMessage('User updated successfully');
      
      // Clear success message after a short delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'An error occurred while updating the user');
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        router.push('/admin/users');
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user');
      }
    }
  };

  if (loading && !user) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => router.push('/admin/users')}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => router.push('/admin/users')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Users
        </button>
        
        <div className="flex space-x-2">
          {!editing ? (
            <>
              <button 
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 flex items-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {user && (
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* User profile */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-3xl font-medium">
                  {user.name && user.name.length > 0 ? user.name[0] : '?'}
                </span>
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Unknown User'}</h1>
                <div className="flex items-center mt-1 space-x-3">
                  <span className="text-gray-500">{user.email}</span>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User details or edit form */}
          <div className="px-6 py-6">
            {editing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Email address cannot be modified</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">Regular User</option>
                      <option value="organizer">Organizer</option>
                    </select>
                    {(user.role === 'admin' || user.role === 'super-admin') && (
                      <div className="mt-2 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-md">
                        <p className="text-xs text-amber-700">
                          <strong>Note:</strong> This user currently has {user.role} privileges. Admin roles are managed separately through the role service and cannot be modified here.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">User Information</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Name</div>
                      <div className="mt-1 text-md text-gray-900">{user.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="mt-1 text-md text-gray-900">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Role</div>
                      <div className="mt-1 text-md text-gray-900">{user.role}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Status</div>
                      <div className="mt-1 text-md text-gray-900">{user.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Created At</div>
                      <div className="mt-1 text-md text-gray-900">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Last Updated</div>
                      <div className="mt-1 text-md text-gray-900">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    {user.lastPasswordChange && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Last Password Change</div>
                        <div className="mt-1 text-md text-gray-900">
                          {new Date(user.lastPasswordChange).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {user.lastLogin && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Last Login</div>
                        <div className="mt-1 text-md text-gray-900">
                          {new Date(user.lastLogin).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {user.lastLogout && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Last Logout</div>
                        <div className="mt-1 text-md text-gray-900">
                          {new Date(user.lastLogout).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {user.loginHistory && user.loginHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Login History</h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logout Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {user.loginHistory.slice(0, 5).map((entry, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {entry.loginTime ? new Date(entry.loginTime).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {entry.logoutTime ? new Date(entry.logoutTime).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {user.loginHistory.length > 5 && (
                        <div className="mt-2 text-sm text-gray-500 text-right">
                          Showing 5 of {user.loginHistory.length} login records
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 