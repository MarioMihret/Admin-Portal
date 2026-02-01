"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, User, Mail, Key, UserCheck, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { userService } from '@/services/userService';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [formActive, setFormActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    requirePasswordChange: false,
  });

  // Activate form with animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setFormActive(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push("at least 8 characters");
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push("uppercase letter");
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push("lowercase letter");
    }

    // Number check
    if (/[0-9]/.test(password)) {
      strength += 1;
    } else {
      feedback.push("number");
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    } else {
      feedback.push("special character");
    }

    setPasswordFeedback(feedback.length > 0 ? `Add ${feedback.join(", ")}` : "Strong password");
    return strength;
  };

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength(0);
      setPasswordFeedback("");
    }
  }, [formData.password]);

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
    
    // Final validation before submission
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Ensure secure password
    if (formData.password.length < 8 || passwordStrength < 3) {
      setError('Please choose a stronger password with a mix of letters, numbers, and special characters');
      return;
    }

    // Validate role selection
    if (formData.role !== 'user' && formData.role !== 'organizer') {
      setError('Please select a valid role (Regular User or Organizer)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create user with requirePasswordChange always set to false
      await userService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        requirePasswordChange: false
      });

      // Show success message before redirecting
      setSuccess(true);
      
      // Redirect to users page after a delay with refresh parameter to ensure we see the new user
      setTimeout(() => {
        router.push('/admin/users?refresh=true');
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the user');
    } finally {
      setLoading(false);
    }
  };

  // Get color for password strength meter
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-lime-500';
    return 'bg-green-500';
  };

  // Determine if we can proceed to the next step
  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return formData.name.trim() !== '' && formData.email.trim() !== '' && 
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    }
    if (currentStep === 2) {
      return formData.password.trim() !== '' && passwordStrength >= 3;
    }
    if (currentStep === 3) {
      return formData.role === 'user' || formData.role === 'organizer';
    }
    return true;
  };

  // UI for step indicators
  const StepIndicator = ({ step, label }: { step: number; label: string }) => {
    const isActive = currentStep === step;
    const isComplete = currentStep > step;
    
    return (
      <div className="flex flex-col items-center">
        <div 
          className={twMerge(
            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
            isActive 
              ? "border-blue-500 bg-blue-50 text-blue-700" 
              : isComplete 
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 bg-gray-50 text-gray-400"
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <span className="text-sm font-semibold">{step}</span>
          )}
        </div>
        <span 
          className={twMerge(
            "text-xs mt-1 font-medium transition-colors duration-300",
            isActive 
              ? "text-blue-700" 
              : isComplete 
                ? "text-green-600"
                : "text-gray-500"
          )}
        >
          {label}
        </span>
      </div>
    );
  };

  // UI for step connections
  const StepConnection = ({ isActive }: { isActive: boolean }) => {
    return (
      <div className="flex-1 h-0.5 mx-2">
        <div 
          className={twMerge(
            "h-full transition-colors duration-300",
            isActive ? "bg-green-500" : "bg-gray-200"
          )}
        />
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => router.push('/admin/users')}
          className="group flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to Users</span>
        </button>
      </div>

      {/* Card Container */}
      <div 
        className={clsx(
          "bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-500 ease-in-out",
          formActive ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"
        )}
      >
        {/* Card Header */}
        <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new user account with appropriate permissions
          </p>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center mt-6">
            <StepIndicator step={1} label="Basic Info" />
            <StepConnection isActive={currentStep > 1} />
            <StepIndicator step={2} label="Security" />
            <StepConnection isActive={currentStep > 2} />
            <StepIndicator step={3} label="Permissions" />
          </div>
        </div>

        {/* Notification area */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fadeIn">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700">User successfully created! Redirecting...</p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 text-gray-900"
                      placeholder="John Smith"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 text-gray-900"
                      placeholder="john.smith@example.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This email will be used for login and notifications</p>
                </div>
              </div>
            )}

            {/* Step 2: Security */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 text-gray-900"
                      placeholder="••••••••"
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Password strength meter */}
                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300 ease-out`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${passwordStrength >= 4 ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordFeedback || 'Enter a strong password'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Permissions */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 appearance-none text-gray-900"
                      autoFocus
                    >
                      <option value="">Select a role</option>
                      <option value="user">Regular User</option>
                      <option value="organizer">Organizer</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Determines what permissions the user will have</p>
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Admin and Super-Admin roles can only be assigned from the User Edit page by users with administrative privileges.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Navigation */}
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                >
                  Back
                </button>
              ) : (
                <div></div> /* Empty div to maintain layout */
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNextStep()}
                  className={clsx(
                    "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm",
                    canProceedToNextStep()
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={clsx(
                    "px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200",
                    loading
                      ? "bg-blue-400 text-white cursor-wait"
                      : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating User...
                    </span>
                  ) : (
                    "Create User"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 