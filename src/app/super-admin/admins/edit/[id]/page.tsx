"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Added useParams, useSearchParams
import { UserCog, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Info, Save, University as UniversityIcon, LockKeyhole, Mail } from 'lucide-react'; // Changed UserPlus to UserCog, Save for submit, added UniversityIcon, LockKeyhole, Mail
import { toast } from 'sonner'; // Import toast

// Updated Admin interface to match API response for GET /api/super/admins/[id]
interface AdminData {
  _id: string; // From Role collection
  id: string;  // From Role collection (_id.toString())
  name: string;
  email: string;
  role: 'Admin' | 'Super Admin'; // From Role collection
  university: string; // From AdminUser link or query context
  status: 'Active' | 'Inactive' | 'Pending'; // From AdminUser link
  createdAt?: Date | string;
  updatedAt?: Date | string;
  requirePasswordChange?: boolean;
}

// Define the shape of our form data (password is optional for edit)
interface AdminEditFormData {
  name: string;
  email: string;
  role: 'Admin' | 'Super Admin';
  password?: string; // Optional: only if changing
  confirmPassword?: string; // Optional: only if changing
  status: 'Active' | 'Inactive' | 'Pending'; // Status for the specific university link
  university: string; // University context for this edit
}

// Define a type for our form errors
type FormErrors = {
  [K in keyof AdminEditFormData]?: string;
} & { general?: string; fetch?: string }; // Added fetch error

// Mock function to get admin data - replace with actual API call
// const fetchAdminById = async (id: string): Promise<Admin | null> => { ... }; // REMOVED MOCK

export default function EditAdminPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); // For getting university query param
  const adminId = params.id as string;
  const universityContext = searchParams.get('university'); // Get university from URL query

  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<AdminEditFormData | null>(null);
  const [originalAdminName, setOriginalAdminName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [requirePasswordChangeStatus, setRequirePasswordChangeStatus] = useState<boolean | undefined>(undefined); // Added state for display

  // Moved Autofocus useEffect to the top level
  useEffect(() => {
    // The condition to focus should be inside the effect
    if (formData && !initialLoading && !errors.fetch) { 
      document.getElementById('name')?.focus();
    }
  }, [formData, initialLoading, errors.fetch]); // Added errors.fetch to dependencies

  useEffect(() => {
    if (!adminId) {
        setErrors({ fetch: "Admin ID is missing from route." });
        setInitialLoading(false);
        return;
    }
    const loadAdminData = async () => {
      setInitialLoading(true);
      setErrors({});
      try {
        // Construct API URL, add university query param if available
        let apiUrl = `/api/super/admins/${adminId}`;
        if (universityContext) {
          apiUrl += `?university=${encodeURIComponent(universityContext)}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch admin: ${response.status}`);
        }
        const adminData: AdminData = await response.json();
        
        if (adminData) {
          setFormData({
            name: adminData.name,
            email: adminData.email,
            role: adminData.role,
            status: adminData.status, // Status for the specific university context
            university: adminData.university, // University context
            password: '', // Keep password fields blank initially for edits
            confirmPassword: '',
          });
          setOriginalAdminName(adminData.name);
          setRequirePasswordChangeStatus(adminData.requirePasswordChange); // Set the display status
        } else {
          // This case should ideally be caught by response.ok check above
          setErrors({ fetch: 'Admin not found. You will be redirected to the admin list.' });
          toast.error('Admin not found. Redirecting...');
          setTimeout(() => router.push('/super-admin/admins'), 2500);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        const message = error instanceof Error ? error.message : 'Failed to load admin details. Please try again.';
        setErrors({ fetch: message });
        toast.error(message);
      } finally {
        setInitialLoading(false);
      }
    };
    loadAdminData();
  }, [adminId, router, universityContext]);

  // Password strength checker (can be imported or defined here if not already)
  const checkPasswordStrength = (password: string): any => { /* ... same as AddAdminPage ... */ 
    let score = 0;
    if (password.length === 0) return { score: 0, text: '', color: '' };
    if (password.length >= 8) score++;
    if (password.length >= 10) score++; 
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    let normalizedScore = Math.min(score, 4);
    if (password.length > 0 && password.length < 8 && password.length > 0) normalizedScore = 0; 
    switch (normalizedScore) {
      case 0: return { score: 0, text: 'Too short (min 8)', color: 'text-red-500' };
      case 1: return { score: 1, text: 'Weak', color: 'text-red-500' };
      case 2: return { score: 2, text: 'Medium', color: 'text-yellow-500' };
      case 3: return { score: 3, text: 'Strong', color: 'text-green-500' };
      case 4: return { score: 4, text: 'Very Strong', color: 'text-green-700' };
      default: return { score: 0, text: '', color: '' };
    }
  };

  const validateForm = (isSubmitting = false): boolean => {
    if (!formData) return false;
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid.';
    }
    if (!formData.university) newErrors.university = 'University is required.'; // Should be pre-filled

    // Password validation only if password field is filled
    if (formData.password) { 
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters.';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    } else if (isSubmitting && formData.confirmPassword && !formData.password) {
        // If confirm pass is filled but pass is not during submit
        newErrors.password = 'Password is required if confirming password.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);

    if (name === 'password' && formData.password !== undefined) {
        setPasswordStrength(checkPasswordStrength(value));
    }

    if (errors[name as keyof AdminEditFormData] && value.trim()) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === 'password' && errors.confirmPassword && value === formData.confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: undefined }));
    }
  };
  
  const handleConfirmPasswordBlur = () => {
    if (!formData) return;
    // Only validate if password field is also being used
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.'}));
    } else if (formData.password && formData.password === formData.confirmPassword && formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData || !validateForm(true)) {
        toast.error('Please correct the errors in the form.');
        return;
    }

    setIsSubmitting(true);
    setErrors({});

    const { confirmPassword, ...submissionPayload } = formData;
    
    // Only include password in the payload if it's actually being changed (not blank)
    if (!submissionPayload.password) {
      delete submissionPayload.password;
    }

    try {
      console.log("Submitting update to API:", submissionPayload, "Admin ID:", adminId);
      const response = await fetch(`/api/super/admins/${adminId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || 'Failed to update admin.';
        console.error("API Update Error:", result);
        setErrors(prev => ({ ...prev, general: errorMessage }));
        toast.error(errorMessage + (result.errors ? ` (${Object.values(result.errors).flat().join(', ')})` : ''));
      } else {
        toast.success(`Admin '${result.name || originalAdminName}' updated successfully!`);
        router.refresh();
        router.push('/super-admin/admins');
      }
    } catch (error) {
      console.error("Network or other error updating admin:", error);
      const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
      setErrors(prev => ({ ...prev, general: message }));
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading admin details...</p>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl flex flex-col justify-center items-center h-[calc(100vh-200px)]">
         <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Error Loading Admin</h2>
        <p className="text-red-600 dark:text-red-400 text-center mb-6 px-4">{errors.fetch}</p>
        <Link href="/super-admin/admins" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Admin List
        </Link>
      </div>
    );
  }
  
  if (!formData) {
      // This specific state (formData is null AFTER loading and NO fetch error) should be rare if logic is correct
      // but as a fallback:
      return (
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl flex flex-col justify-center items-center h-[calc(100vh-200px)]">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Information Unavailable</h2>
            <p className="text-yellow-600 dark:text-yellow-400 text-center mb-6 px-4">
                Unable to load admin form data at this moment.
            </p>
            <Link href="/super-admin/admins" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Admin List
            </Link>
        </div>
      );
  }

  // JSX structure will be very similar to AddAdminPage, with adjustments for edit context
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
      <div className="mb-8">
        <Link href="/super-admin/admins" className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Admin List
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 md:p-10">
        <div className="mb-6 sm:mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <UserCog className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                Edit Admin: <span className="text-purple-500 dark:text-purple-300">{originalAdminName || 'Loading...'}</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Modify the administrator's profile and university-specific settings.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {errors.general && (
            <div className="p-4 bg-red-100 dark:bg-red-700/30 border-l-4 border-red-500 dark:border-red-400 rounded-md shadow-md">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-300 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700 dark:text-red-200">{errors.general}</p>
              </div>
            </div>
          )}
          
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
              placeholder="e.g., Ada Lovelace"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <p id="name-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.name}</p>}
          </div>

          {/* Email Address (ReadOnly) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email} // Display the email
                readOnly // Make email read-only
                className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 transition-colors border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500 cursor-not-allowed`}
                disabled={isSubmitting} // Keep disabled state logic
              />
            </div>
             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email address cannot be changed after account creation.</p>
          </div>
          
          {/* University Dropdown */}
          <div>
            <label htmlFor="university" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">University Association</label>
            <select
              name="university"
              id="university"
              value={formData.university} // Controlled component
              onChange={handleChange} // Update formData.university on change
              className={`block w-full pl-4 pr-10 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[46px] ${errors.university ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
              disabled={isSubmitting}
            >
              {/* TODO: Populate this list dynamically or from a shared constant */}
              <option value="Woldia University">Woldia University</option>
              <option value="Addis Ababa University">Addis Ababa University</option>
              <option value="Mekelle University">Mekelle University</option> 
              <option value="Bahir Dar University">Bahir Dar University</option>
              {/* Add other universities as needed */}
            </select>
            {errors.university && <p id="university-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.university}</p>}
             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select the university for which to apply status changes or associate the admin.</p>
          </div>
          
          {/* Role (Main role from Role collection) */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Account Role</label>
            <select
              name="role"
              id="role"
              value={formData.role} 
              onChange={handleChange}
              className="block w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[46px]"
              disabled={isSubmitting}
            >
              {/* Match the Mongoose schema enum values */}
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This defines the primary account role across the system.</p>
          </div>
          
          {/* Status (for this specific university link) */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status for {formData.university}</label>
            <select
              name="status"
              id="status"
              value={formData.status} // Status from AdminUser link
              onChange={handleChange}
              className="block w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[46px]"
              disabled={isSubmitting}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This status applies only to their role at {formData.university}.</p>
          </div>

          {/* Display requirePasswordChange status */}
          {requirePasswordChangeStatus !== undefined && (
              <div className="p-3 bg-blue-50 dark:bg-blue-700/30 rounded-lg border border-blue-200 dark:border-blue-600/50">
                  <div className="flex items-center">
                      <LockKeyhole className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-800 dark:text-gray-100">
                          Password Change Required on Next Login: 
                          <span className={`font-semibold ${requirePasswordChangeStatus ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                              {requirePasswordChangeStatus ? ' Yes' : ' No'}
                          </span>
                      </span>
                  </div>
                  {requirePasswordChangeStatus && (
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-300 pl-7">User will be prompted to change their password upon their next login.</p>
                  )}
                  {!requirePasswordChangeStatus && (
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-300 pl-7">User has set their password. Changing it here will mark this as 'No'.</p>
                  )}
              </div>
          )}

          {/* Password Section - Optional for Edit */}
          <details className="pt-4 border-t border-gray-200 dark:border-gray-700 group">
            <summary className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-1 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 list-none flex items-center">
              <span className="mr-2 transition-transform duration-200 ease-in-out group-open:rotate-90">▶</span> Change Password (Optional)
            </summary>
            <div className="mt-3 space-y-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Leave blank if you do not want to change the password.</p>
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    value={formData.password || ''}
                    onChange={handleChange}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
                    placeholder="Enter new password (min. 8 characters)"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    aria-describedby={`password-error ${isPasswordFocused || formData.password ? 'password-requirements-hint' : ''} ${passwordStrength && passwordStrength.text ? 'password-strength-indicator' : ''}`.trim()}
                  />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                </div>
                {(isPasswordFocused || formData.password) && !errors.password && (
                  <div id="password-requirements-hint" className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-md text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1.5 text-blue-500 flex-shrink-0"/>Password requirements:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5">
                      <li className={(formData.password?.length || 0) >= 8 ? 'text-green-600 dark:text-green-400' : ''}>At least 8 characters</li>
                      <li className={/[A-Z]/.test(formData.password || '') ? 'text-green-600 dark:text-green-400' : ''}>At least one uppercase letter</li>
                      <li className={/[0-9]/.test(formData.password || '') ? 'text-green-600 dark:text-green-400' : ''}>At least one number</li>
                      <li className={/[^A-Za-z0-9]/.test(formData.password || '') ? 'text-green-600 dark:text-green-400' : ''}>At least one special character</li>
                    </ul>
                  </div>
                )}
                {errors.password && <p id="password-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.password}</p>}
                {formData.password && passwordStrength && passwordStrength.text && !errors.password && (
                  <div id="password-strength-indicator" className="mt-2 flex items-center">
                    <span className={`text-xs font-medium mr-2 ${passwordStrength.color}`}>{passwordStrength.text}</span>
                    <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ease-in-out ${passwordStrength.score === 0 ? 'bg-red-500' : passwordStrength.score === 1 ? 'bg-red-500' : passwordStrength.score === 2 ? 'bg-yellow-500' : passwordStrength.score === 3 ? 'bg-green-500' : 'bg-green-700'}`} style={{ width: `${(passwordStrength.score / 4) * 100}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password - Only if new password is being entered */}
              {(formData.password || formData.confirmPassword) && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword || ''}
                      onChange={handleChange}
                      onBlur={handleConfirmPasswordBlur}
                      className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
                      placeholder="Re-enter new password"
                      disabled={isSubmitting}
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    />
                     <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                  </div>
                  {errors.confirmPassword && <p id="confirmPassword-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.confirmPassword}</p>}
                </div>
              )}
            </div>
          </details>

          <div className="pt-4 flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 sm:gap-4">
            <Link href="/super-admin/admins" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || initialLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <><Save className="h-5 w-5 mr-2"/>Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 