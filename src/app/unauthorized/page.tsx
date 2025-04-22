"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLoading } from '@/app/providers';

export default function UnauthorizedPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { setIsLoading } = useLoading();
  
  // Turn off loading state when this page loads
  useEffect(() => {
    // Give a short delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setIsLoading]);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleSignIn = () => {
    setIsLoading(true); // Show loading state
    router.push('/auth/signin');
  };
  
  const handleGoHome = () => {
    setIsLoading(true); // Show loading state
    router.push('/');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-50">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
      
      <div className="max-w-lg w-full bg-white backdrop-blur-sm bg-opacity-95 rounded-3xl shadow-2xl overflow-hidden z-10">
        <div className="flex flex-col md:flex-row">
          <div className="w-full p-8 md:p-10">
            <div className="text-center">
              <div className="relative mx-auto mb-6">
                {/* Stylized illustration */}
                <div className="w-full h-48 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-amber-100 rounded-full"></div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-100 rounded-full"></div>
                    
                    <div className="relative z-10 w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white">
                      <svg className="h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Restricted</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-500 mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                This area is restricted to administrators only. You don't have the necessary permissions to access the admin portal.
              </p>
            </div>
            
            <div className="mb-8 bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Need access?</span> If you believe you should have admin privileges, please contact your system administrator.
                  </p>
                </div>
              </div>
            </div>
            
            {isClient && (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleSignIn}
                  className="relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300"></span>
                  <span className="relative flex items-center">
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In with Different Account
                  </span>
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="relative w-full flex justify-center py-3.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-white group-hover:bg-gray-50 transition-all duration-300"></span>
                  <span className="relative flex items-center">
                    <svg className="mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Return to Home
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional decorative elements */}
      <div className="absolute top-10 right-10 w-20 h-20 border-4 border-indigo-100 rounded-full opacity-20"></div>
      <div className="absolute bottom-10 left-10 w-32 h-8 border-4 border-purple-100 rounded-full opacity-20"></div>
    </div>
  );
} 