"use client";

import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoading } from '@/app/providers';
import { ShieldAlert, LogIn, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  // const [isClient, setIsClient] = useState(false);
  // const router = useRouter();
  const { setIsLoading } = useLoading();
  
  // Turn off loading state when this page loads
  useEffect(() => {
    // Give a short delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setIsLoading]);
  
  // useEffect(() => {
  //   setIsClient(true);
  // }, []);
  
  // const handleSignIn = () => {
  //   setIsLoading(true); // Show loading state
  //   router.push('/auth/signin');
  // };
  
  // const handleGoHome = () => {
  //   setIsLoading(true); // Show loading state
  //   router.push('/');
  // };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100 flex flex-col items-center justify-center p-4 text-slate-800">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl text-center border border-gray-200">
        
        <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-red-100/70 border-2 border-red-200/80">
          <ShieldAlert className="h-10 w-10 text-red-500" />
      </div>
      
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-600 to-red-600 mb-3">
          Access Denied
        </h1>
        <p className="text-slate-600 mb-8 text-lg">
          You do not have the necessary permissions to access this page.
        </p>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 group"
          >
            <LogIn className="mr-2 h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors duration-150" />
            Sign In As Different User
          </Link>
          <Link
            href="/"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 group"
          >
            <Home className="mr-2 h-5 w-5 text-slate-500 group-hover:text-slate-600 transition-colors duration-150" />
            Return to Homepage
          </Link>
              </div>
              
        <p className="mt-8 text-xs text-slate-500">
          If you believe this is an error, please contact your system administrator.
              </p>
            </div>
            
      {/* Subtle decorative elements for light theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full filter blur-3xl animate-pulse-medium"></div>
      </div>
      
      {/* Keyframes for pulse (can be removed if defined globally) */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes pulse-medium {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.03); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        .animate-pulse-medium {
          animation: pulse-medium 7s infinite ease-in-out;
          animation-delay: -2s;
        }
      `}</style>
    </div>
  );
} 