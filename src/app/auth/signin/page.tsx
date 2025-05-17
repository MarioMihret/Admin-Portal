"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession, SessionProvider } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LoadingSpinner } from '@/app/providers';

// Separate the content that uses useSession from the page component
function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');
  const { data: session, status } = useSession();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (mounted && status === 'authenticated' && session?.user) {
      const userRole = session.user.role;
      
      // If there's a callback URL, use it, otherwise route based on role
      if (callbackUrl && callbackUrl !== '/') {
        router.push(callbackUrl);
      } else {
        if (userRole === 'super-admin') {
          router.push('/super-admin/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      }
    }
  }, [status, session, router, callbackUrl, mounted]);

  // Check if there's an error in the URL
  useEffect(() => {
    if (mounted && errorParam) {
      let errorMessage = '';
      // Handle specific error cases
      switch (errorParam) {
        case 'SessionExpired':
          errorMessage = 'Your session has expired. Please sign in again.';
          break;
        case 'CredentialsSignin':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        case 'AccessDenied':
          errorMessage = 'You do not have permission to access this resource.';
          break;
        default:
          errorMessage = 'Authentication error. Please try again.';
      }
      setError(errorMessage);
    }
  }, [errorParam, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First check if the email belongs to an admin or superadmin using roles collection
      const encodedEmail = encodeURIComponent(email);
      const roleResponse = await fetch(`/api/roles/email/${encodedEmail}`);
      const roleData = await roleResponse.json();
      
      // If not an admin role, redirect to unauthorized
      if (roleResponse.ok && roleData.role && 
          roleData.role.role !== 'admin' && roleData.role.role !== 'super-admin') {
        setLoading(false);
        router.push('/unauthorized');
        return;
      }
      
      // If user not found in roles collection, or there was another issue
      if (!roleResponse.ok) {
        // Check if role not found
        if (roleData.error === 'Role not found') {
          setLoading(false);
          router.push('/unauthorized');
          return;
        } else {
          // Some other error from roles API
          setError('Authentication error. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // Continue with login for admins/superadmins
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        // Hide specific error details and show generic message
        setError('Invalid credentials. Please try again.');
      } else if (res?.url) {
        router.push(res.url);
      }
    } catch (err: any) {
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If still loading the session, show the main LoadingSpinner
  if (status === 'loading') {
    return <LoadingSpinner />;
  }
  
  // If authenticated, show LoadingSpinner while useEffect redirects.
  if (status === 'authenticated') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-5xl w-full bg-white rounded-xl shadow-lg overflow-hidden`}>
        <div className="flex flex-col lg:flex-row">
          {/* Left side with login form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            <div className="mb-8">
              <div className="p-3 bg-blue-50 rounded-xl inline-block">
                <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                Admin Portal
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Secure access for administrators only
              </p>
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6 animate-shake border-l-4 border-red-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            <form 
              className="space-y-6" 
              onSubmit={handleSubmit}
            >
              <div className="rounded-md space-y-4">
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 transition-all duration-300 group-focus-within:text-blue-600">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-in-out"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 transition-all duration-300 group-focus-within:text-blue-600">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-in-out pr-10"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 transition-all duration-150"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all duration-300 ease-in-out transform hover:translate-y-[-1px] active:translate-y-[1px]"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-indigo-200 group-hover:text-indigo-300 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Right side with illustration and minimal info */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 flex items-center justify-center text-white overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="max-w-md relative z-10">
              {/* Abstract illustration of security/admin dashboard */}
              <div className="mb-8 flex justify-center">
                <div className="w-64 h-64 relative">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path fill="rgba(255, 255, 255, 0.15)" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90.2,-16.3,88.1,-1.2C86,13.9,79,27.8,70.7,41.2C62.4,54.5,52.8,67.3,40.1,74.3C27.4,81.3,11.7,82.5,-2.4,86C-16.6,89.6,-33.1,95.7,-47.6,91.9C-62.1,88.2,-74.5,74.7,-79.3,59.3C-84.2,43.8,-81.5,26.4,-80.5,10.1C-79.5,-6.2,-80.1,-21.4,-76.2,-37.2C-72.2,-53,-63.7,-69.3,-50.8,-77.2C-37.9,-85.1,-20,-84.6,-2.9,-80.3C14.1,-76,30.5,-83.5,44.7,-76.4Z" transform="translate(100 100)" />
                  </svg>
                  
                  {/* Secure shield icon */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  
                  {/* Small floating elements */}
                  <div className="absolute top-10 left-10 w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm animate-float"></div>
                  <div className="absolute bottom-10 right-10 w-6 h-6 bg-white/20 rounded-lg backdrop-blur-sm animate-float-slow"></div>
                  <div className="absolute top-1/4 right-1/4 w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm animate-float-medium"></div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-center">Admin Portal</h2>
              <p className="mb-6 text-center text-blue-100">Restricted access for authorized administrators.</p>
              
              <div className="space-y-4 bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Advanced Security</h3>
                    <p className="text-xs text-blue-100">Restricted access control system</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Admin Dashboard</h3>
                    <p className="text-xs text-blue-100">Comprehensive management tools</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-medium {
          animation: float 3.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        
        .animate-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}

// Main page component that wraps the content with SessionProvider
export default function SignInPage() {
  return (
    <SessionProvider>
      <SignInContent />
    </SessionProvider>
  );
} 