'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Create Loading Context
export const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: (loading: boolean) => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

// Loading animation component
function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative">
        {/* Decorative background circles */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-16 -right-16 w-24 h-24 bg-indigo-100 rounded-full opacity-50"></div>
        
        <div className="relative z-10">
          {/* Main spinner */}
          <div className="flex flex-col items-center">
            {/* Outer ring with gradient */}
            <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-600 border-l-indigo-600 animate-spin"></div>
              
              {/* Middle ring */}
              <div className="w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-6 border-transparent border-t-indigo-500 border-l-blue-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                
                {/* Inner circle with pulsing */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Loading text */}
            <div className="mt-6 text-gray-700 font-medium flex items-center">
              <span className="text-blue-700 mr-1.5">Loading</span>
              <span className="flex space-x-1">
                <span className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Provider
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loadingTimer, setLoadingTimer] = useState<NodeJS.Timeout | null>(null);
  const [safetyTimer, setSafetyTimer] = useState<NodeJS.Timeout | null>(null);

  // Function to ensure minimum display time for loading
  const showLoading = (show: boolean) => {
    if (show) {
      // Clear any existing timers first
      if (loadingTimer) {
        clearTimeout(loadingTimer);
        setLoadingTimer(null);
      }
      if (safetyTimer) {
        clearTimeout(safetyTimer);
      }
      
      // Set loading state
      setIsLoading(true);
      
      // Safety timeout - ensure loading never shows for more than 5 seconds
      const safety = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      
      setSafetyTimer(safety);
    } else {
      // Ensure loading state shows for at least 800ms for better UX
      const timer = setTimeout(() => {
        setIsLoading(false);
        
        // Clear safety timer when we manually end loading
        if (safetyTimer) {
          clearTimeout(safetyTimer);
          setSafetyTimer(null);
        }
      }, 800);
      
      setLoadingTimer(timer);
    }
  };

  // Track route changes
  useEffect(() => {
    showLoading(true);
    
    // Auto hide loading after the route has changed
    const autoHideTimer = setTimeout(() => {
      showLoading(false);
    }, 1500); // Hide after 1.5 seconds if not hidden already
    
    return () => {
      if (loadingTimer) clearTimeout(loadingTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      clearTimeout(autoHideTimer);
    };
  }, [pathname, searchParams]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (loadingTimer) clearTimeout(loadingTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [loadingTimer, safetyTimer]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading: showLoading }}>
      {isLoading && <LoadingSpinner />}
      {children}
    </LoadingContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </SessionProvider>
  );
} 