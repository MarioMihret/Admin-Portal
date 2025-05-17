"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

// Define the shape of our form data
interface AdminFormData {
  name: string;
  email: string;
  role: 'Admin' | 'Super Admin';
  password: string;
  confirmPassword: string;
  status: 'Active' | 'Inactive';
  university: string;
}

// Define a type for our form errors
type FormErrors = {
  [K in keyof AdminFormData]?: string;
} & { general?: string };

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0: too short, 1: weak, 2: medium, 3: strong, 4: very strong
  text: string;
  color: string;
}

export default function AddAdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    role: 'Admin',
    password: '',
    confirmPassword: '',
    status: 'Active',
    university: 'Woldia University',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Autofocus on the first input field
  useEffect(() => {
    document.getElementById('name')?.focus();
  }, []);

  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length === 0) return { score: 0, text: '', color: '' };
    if (password.length >= 8) score++;
    if (password.length >= 10) score++; 
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    let normalizedScore = Math.min(score, 4);
    if (password.length > 0 && password.length < 8) normalizedScore = 0; 

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
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid.';
    }
    if (!formData.university) newErrors.university = 'University is required.';

    // Password validation logic will primarily show strength, actual error on submit if empty or too short
    if (isSubmitting && !formData.password) {
      newErrors.password = 'Password is required.';
    } else if (isSubmitting && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters.';
    } // Note: Password strength gives feedback, but formal error for length is on submit or if explicitly too short.

    if (isSubmitting || (formData.confirmPassword && formData.password !== formData.confirmPassword) ) {
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    if (errors[name as keyof AdminFormData] && value.trim()) { // Clear error if user types
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === 'password' && errors.confirmPassword && value === formData.confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.'}));
    } else if (formData.password === formData.confirmPassword && formData.confirmPassword) { // also check confirmPassword has value
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm(true)) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    setIsLoading(true);
    setErrors({});

    // Prepare data for the API (excluding confirmPassword)
    const { confirmPassword, ...apiData } = formData;

    try {
      console.log("Submitting to API:", apiData);
      const response = await fetch('/api/super/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors (e.g., validation errors from Zod, conflicts)
        const errorMessage = result.message || 'Failed to create admin.';
        console.error("API Error:", result);
        setErrors(prev => ({ ...prev, general: errorMessage }));
        toast.error(errorMessage + (result.errors ? ` (${Object.values(result.errors).flat().join(', ')})` : ''));
      } else {
        toast.success('Admin created successfully!');
        router.push('/super-admin/admins'); // Redirect on success
      }
    } catch (error) {
      console.error("Network or other error creating admin:", error);
      const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
      setErrors(prev => ({ ...prev, general: message }));
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
      <div className="mb-8">
        <Link href="/super-admin/admins" className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Admin List
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 md:p-10">
        {/* Page Header - Enhanced */}
        <div className="mb-6 sm:mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <UserPlus className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                Create New Admin
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Complete the form below to add a new administrator to the platform.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* General Error Message - Enhanced Styling */}
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
              disabled={isLoading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <p id="name-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.name}</p>}
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
              placeholder="e.g., ada@example.com"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && <p id="email-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.email}</p>}
          </div>

          {/* University */}
          <div>
            <label htmlFor="university" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">University</label>
            <select
              name="university"
              id="university"
              value={formData.university}
              onChange={handleChange}
              className={`block w-full pl-4 pr-10 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[46px] ${errors.university ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
              disabled={isLoading}
              aria-invalid={!!errors.university}
              aria-describedby={errors.university ? "university-error" : undefined}
            >
              <option value="Woldia University">Woldia University</option>
              <option value="Addis Ababa University">Addis Ababa University</option>
            </select>
            {errors.university && <p id="university-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.university}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[46px]"
              disabled={isLoading}
            >
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
                placeholder="Enter a secure password"
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={`password-error ${isPasswordFocused || formData.password ? 'password-requirements-hint' : ''} ${passwordStrength && passwordStrength.text ? 'password-strength-indicator' : ''}`.trim()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Password Requirements Hint - Displayed on focus or if field has value */}
            {(isPasswordFocused || formData.password) && !errors.password && (
              <div id="password-requirements-hint" className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-md text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1.5 text-blue-500 flex-shrink-0"/>Password requirements:</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                  <li className={formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>At least 8 characters</li>
                  <li className={/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}>At least one uppercase letter</li>
                  <li className={/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}>At least one number</li>
                  <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}>At least one special character</li>
                </ul>
              </div>
            )}
            {errors.password && <p id="password-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.password}</p>}
            {/* Password Strength Indicator */}
            {formData.password && passwordStrength && passwordStrength.text && !errors.password && (
              <div id="password-strength-indicator" className="mt-2 flex items-center">
                <span className={`text-xs font-medium mr-2 ${passwordStrength.color}`}>{passwordStrength.text}</span>
                <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ease-in-out ${ 
                      passwordStrength.score === 0 ? 'bg-red-500' : 
                      passwordStrength.score === 1 ? 'bg-red-500' : 
                      passwordStrength.score === 2 ? 'bg-yellow-500' : 
                      passwordStrength.score === 3 ? 'bg-green-500' : 'bg-green-700'
                    }`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleConfirmPasswordBlur}
                className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`}
                placeholder="Re-enter password"
                disabled={isLoading}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p id="confirmPassword-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{errors.confirmPassword}</p>}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="block w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 transition-colors h-[46px]"
              disabled={isLoading}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 sm:gap-4">
            <Link 
              href="/super-admin/admins"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Admin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 