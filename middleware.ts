import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from 'next-auth/jwt';

// Token cache management for faster middleware response
const tokenCache = new Map<string, {data: any, expires: number}>();

// Function to clear token cache for a specific token
function clearTokenCache(sessionToken: string) {
  const keysToDelete: string[] = [];
  
  // Find all keys related to this session token
  tokenCache.forEach((_, key) => {
    if (key.startsWith(`token_${sessionToken}`)) {
      keysToDelete.push(key);
    }
  });
  
  // Delete found keys
  keysToDelete.forEach(key => tokenCache.delete(key));
  console.log(`Cleared ${keysToDelete.length} token cache entries for session: ${sessionToken}`);
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                         req.cookies.get('__Secure-next-auth.session-token')?.value;
    
    // Check for suspension if we have a token
    if (token?.email && sessionToken) {
      try {
        // Check if user is active with no caching
        const userStatusUrl = new URL('/api/users/status', req.url);
        userStatusUrl.searchParams.set('_noCache', Date.now().toString());
        
        const resp = await fetch(userStatusUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          body: JSON.stringify({ email: token.email }),
        });
        
        const data = await resp.json();
        
        // If user is suspended, redirect to sign in page with an error and clear token cache
        if (data.isActive === false) {
          console.log(`User ${token.email} is suspended, redirecting to sign in page`);
          clearTokenCache(sessionToken);
          const url = new URL('/auth/signin', req.url);
          url.searchParams.set('error', 'AccountSuspended');
          return NextResponse.redirect(url);
        }
      } catch (error) {
        console.error("Error checking user suspension status:", error);
        // Continue to regular auth flow on error
      }
    }
    
    // Handle redirects after successful authentication
    if (pathname === '/') {
      // Check if user needs to change password
      if (token?.requirePasswordChange) {
        const url = new URL('/auth/change-password', req.url);
        return NextResponse.redirect(url);
      }
      
      // Redirect to appropriate dashboard based on role
      if (token?.role === 'super-admin') {
        const url = new URL('/super-admin/dashboard', req.url);
        return NextResponse.redirect(url);
      } else if (token?.role === 'admin') {
        const url = new URL('/admin/dashboard', req.url);
        return NextResponse.redirect(url);
      }
    }
    
    // If user is on the change-password page but doesn't need to change password, redirect to dashboard
    if (pathname === '/auth/change-password' && token && token.requirePasswordChange === false) {
      if (token.role === 'super-admin') {
        const url = new URL('/super-admin/dashboard', req.url);
        return NextResponse.redirect(url);
      } else {
        const url = new URL('/admin/dashboard', req.url);
        return NextResponse.redirect(url);
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;
        const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                           req.cookies.get('__Secure-next-auth.session-token')?.value;
        
        // Always check token cache first with short TTL
        if (sessionToken && token) {
          const cacheKey = `token_${sessionToken}_${pathname}`;
          const now = Date.now();
          const cachedValue = tokenCache.get(cacheKey);
          
          if (cachedValue && cachedValue.expires > now) {
            return cachedValue.data;
          }
          
          // Cache result for only 30 seconds to ensure suspension changes take effect quickly
          const result = checkAuthorization(token, pathname);
          tokenCache.set(cacheKey, {
            data: result,
            expires: now + (30 * 1000) // 30 second TTL
          });
          return result;
        }
        
        return checkAuthorization(token, pathname);
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

// Centralized authorization logic
function checkAuthorization(token: any, pathname: string) {
  // Allow public access to auth pages
  if (pathname.startsWith("/auth")) {
    return true;
  }

  if (!token) {
    return false;
  }

  // Role-based access control
  if (pathname.startsWith("/admin")) {
    return ["admin", "super-admin"].includes(token.role as string);
  }

  if (pathname.startsWith("/super-admin")) {
    return token.role === "super-admin";
  }

  // Force password change if required
  if (token.requirePasswordChange && !pathname.startsWith("/auth/change-password")) {
    return false;
  }

  return true;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/super-admin/:path*",
    "/auth/:path*",
    "/dashboard/:path*",
    "/change-password",
  ],
}; 