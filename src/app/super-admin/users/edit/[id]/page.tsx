"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { UserCog, ArrowLeft, Eye, EyeOff, AlertTriangle, Loader2, Save, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Updated User interface to match /api/users structure
interface User {
  _id: string;
  id?: string; // Mapped from _id
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  requirePasswordChange?: boolean; // Field from the general user API
  // Add other fields as needed
}

// Updated form data interface
interface UserEditFormData {
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  password?: string; 
  confirmPassword?: string;
  requirePasswordChange?: boolean;
}

// PasswordStrength type (can be moved to a shared types file)
interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  text: string;
  color: string;
}

// Placeholder for User type from API response, in case it has a specific wrapper
interface UserApiResponse {
    user: User;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<UserEditFormData | null>(null);
  const [originalUserName, setOriginalUserName] = useState('');
  const [errors, setErrors] = useState<Partial<UserEditFormData & { general?: string; fetch?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  const fetchUserById = useCallback(async (id: string) => {
    setInitialLoading(true);
    setErrors({});
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `User not found: ${response.status}`);
      }
      const data: UserApiResponse = await response.json(); // Assuming API returns { user: UserData }
      const userData = data.user;
      
      if (userData) {
        setFormData({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
          password: '',
          confirmPassword: '',
          requirePasswordChange: userData.requirePasswordChange || false,
        });
        setOriginalUserName(userData.name);
      } else {
        throw new Error("User data not found in API response.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user details.';
      setErrors({ fetch: message });
      toast.error(message);
      // Optionally redirect after a delay if user not found is critical
      // setTimeout(() => router.push('/super-admin/users'), 3000);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserById(userId);
    }
  }, [userId, fetchUserById]);

  useEffect(() => {
    // Auto-focus name field once data is loaded
    if (formData && !initialLoading && !errors.fetch) {
      document.getElementById('name')?.focus();
    }
  }, [formData, initialLoading, errors.fetch]);

  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (!password) return { score: 0, text: '', color: '' };
    if (password.length >= 8) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    score = Math.min(score, 4); // Max score of 4
    if (password.length > 0 && password.length < 8) score = 0; // Reset if too short but not empty

    switch (score) {
      case 0: return { score: 0, text: password.length > 0 ? 'Too short' : '', color: 'text-red-500' };
      case 1: return { score: 1, text: 'Weak', color: 'text-red-500' };
      case 2: return { score: 2, text: 'Medium', color: 'text-yellow-500' };
      case 3: return { score: 3, text: 'Strong', color: 'text-green-500' };
      case 4: return { score: 4, text: 'Very Strong', color: 'text-green-700' };
      default: return { score: 0, text: '', color: '' };
    }
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    const newErrors: Partial<UserEditFormData & { general?: string }> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address.';
    if (!formData.role) newErrors.role = 'Role is required.';

    if (formData.password) { // Only validate confirmPassword if password is being changed
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    } else if (formData.confirmPassword && !formData.password) {
      newErrors.password = 'Password is required if confirming password.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => prev ? { ...prev, [name]: newValue } : null);
    if (name === 'password' && typeof newValue === 'string') {
      setPasswordStrength(checkPasswordStrength(newValue));
    }
    // Clear specific error when user starts typing in the field
    if (errors[name as keyof UserEditFormData] && String(newValue).trim()) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData || !validateForm()) return;

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, general: undefined }));
    toast.loading(`Updating ${formData.name}...`, { id: `update-${userId}` });

    const submissionData: Partial<UserEditFormData> = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive,
      requirePasswordChange: formData.requirePasswordChange,
    };

    if (formData.password) {
      submissionData.password = formData.password;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Failed to update user: ${response.status}`);
      }
      toast.success(`User "${formData.name}" updated successfully.`, { id: `update-${userId}` });
      router.push('/super-admin/users');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrors(prev => ({ ...prev, general: message }));
      toast.error(`Update failed: ${message}`, { id: `update-${userId}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <p className="ml-3 text-lg text-gray-600 dark:text-gray-300">Loading User Details...</p>
      </div>
    );
  }

  if (errors.fetch || !formData) { // If formData is null, it means fetching failed to set it
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-red-700 dark:text-red-400 mb-3">Error Loading User</h2>
        <p className="text-red-600 dark:text-red-500 mb-6">{errors.fetch || "User data could not be loaded."}</p>
        <Link href="/super-admin/users" className="inline-flex items-center px-6 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to User List
        </Link>
      </div>
    );
  }

  // Main form rendering starts here
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/super-admin/users" className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to User List
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Edit User: <span className="text-purple-600 dark:text-purple-400">{originalUserName || '...'}</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        {/* General Errors */} 
        {errors.general && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400 dark:text-red-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">{errors.general}</p>
            </div>
          </div>
        </div>
        )}

        {/* User Details Section */}
        <div className="border-b border-gray-900/10 dark:border-gray-100/10 pb-8">
          <h2 className="text-xl font-semibold leading-7 text-gray-900 dark:text-white flex items-center">
            <UserCog className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
            User Profile
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Manage the user's profile information, role, and account status.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">Full name</label>
              <div className="mt-2">
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
              </div>
              {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">Email address</label>
              <div className="mt-2">
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
          </div>
              {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
          </div>
            <div className="sm:col-span-3">
              <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">Role</label>
              <div className="mt-2">
                <select id="role" name="role" value={formData.role} onChange={handleChange} className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6">
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Organizer">Organizer</option> {/* Ensure Organizer is an option if it's a distinct role */}
            </select>
          </div>
              {errors.role && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.role}</p>}
            </div>
            <div className="sm:col-span-3 flex items-end">
                <div className="relative flex gap-x-3">
                    <div className="flex h-6 items-center">
                        <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-600 bg-white dark:bg-gray-700" />
                </div>
                    <div className="text-sm leading-6">
                        <label htmlFor="isActive" className="font-medium text-gray-900 dark:text-white">Active Account</label>
                        <p className="text-gray-500 dark:text-gray-400">User can log in and access the platform.</p>
                </div>
              </div>
            </div>
             <div className="sm:col-span-full">
                <div className="relative flex gap-x-3">
                    <div className="flex h-6 items-center">
                        <input id="requirePasswordChange" name="requirePasswordChange" type="checkbox" checked={formData.requirePasswordChange || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-600 bg-white dark:bg-gray-700" />
            </div>
                    <div className="text-sm leading-6">
                        <label htmlFor="requirePasswordChange" className="font-medium text-gray-900 dark:text-white">Require Password Change on Next Login</label>
                        <p className="text-gray-500 dark:text-gray-400">Force user to change their password upon next login.</p>
              </div>
                </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="border-b border-gray-900/10 dark:border-gray-100/10 pb-8">
          <h2 className="text-xl font-semibold leading-7 text-gray-900 dark:text-white flex items-center">
            <Shield className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400"/>
            Change Password
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Leave these fields blank if you do not want to change the user's password.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">New Password</label>
              <div className="mt-2 relative">
                <input type={showPassword ? "text" : "password"} name="password" id="password" value={formData.password} onChange={handleChange} className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                </button>
              </div>
              {passwordStrength && formData.password && (
                <p className={`mt-2 text-sm ${passwordStrength.color}`}>{passwordStrength.text}</p>
            )}
              {errors.password && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
          </div>
            <div className="sm:col-span-3">
              <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">Confirm New Password</label>
              <div className="mt-2 relative">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>
          
        {/* Action Buttons */}
        <div className="mt-10 flex items-center justify-end gap-x-6">
          <Link href="/super-admin/users" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md">
              Cancel
            </Link>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-1" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
    </div>
  );
} 