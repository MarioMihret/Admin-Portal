import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ROLES, AppRole } from '@/constants/roles'; // Import roles

// Caching mechanism for token checks
const tokenCache = new Map<string, { token: any; timestamp: number }>();
const TOKEN_CACHE_TTL = 60 * 1000; // Increase to 60 seconds

// Clean up expired cache entries
setInterval(() => {
  const now = Date.now();
  tokenCache.forEach((value, key) => {
    if (now - value.timestamp > TOKEN_CACHE_TTL) {
      tokenCache.delete(key);
    }
  });
}, 60 * 1000); // Check every minute

// Middleware to handle various redirections and protections
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle media uploads redirection
  if (pathname.startsWith('/uploads/')) {
    // Extract the filename from the path
    const filename = pathname.replace('/uploads/', '');
    
    // Create a new URL for redirection
    const url = request.nextUrl.clone();
    url.pathname = `/api/media/${filename}`;
    
    // Return a redirect response
    return NextResponse.redirect(url);
  }
  
  // Handle direct access to /change-password (redirect to correct path)
  if (pathname === '/change-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/change-password';
    return NextResponse.redirect(url);
  }
  
  // Skip token check for public routes, API routes, and static assets
  if (
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/favicon.ico' ||
    (pathname.startsWith('/auth/') && pathname !== '/auth/change-password') ||
    pathname === '/unauthorized'
  ) {
    return NextResponse.next();
  }
  
  // For authenticated routes, check authentication and password change requirement
  try {
    const sessionId = request.cookies.get('next-auth.session-token')?.value || 
                      request.cookies.get('__Secure-next-auth.session-token')?.value || '';
    
    if (!sessionId) {
      return NextResponse.next();
    }
    
    // Use cached token if available
    let token;
    const cachedData = tokenCache.get(sessionId);
    
    if (cachedData && Date.now() - cachedData.timestamp < TOKEN_CACHE_TTL) {
      token = cachedData.token;
    } else {
      // Get the JWT token
      token = await getToken({ req: request });
      // Cache the token
      if (token && sessionId) {
        tokenCache.set(sessionId, { token, timestamp: Date.now() });
      }
    }
    
    // If not authenticated, allow through (NextAuth will handle)
    if (!token) {
      return NextResponse.next();
    }
    
    // Ensure token.role is of AppRole type if possible, or handle potential string values
    const userRole = token.role as AppRole;
    
    // Only log on important paths, not for assets or repeated requests
    const isImportantPath = !pathname.includes('._next') && 
                           !pathname.includes('/dashboard') && 
                           !pathname.endsWith('.js') && 
                           !pathname.endsWith('.css');
    
    if (isImportantPath) {
      console.log('Middleware token check:', { 
        email: token.email, 
        role: userRole, 
        requirePasswordChange: token.requirePasswordChange,
        path: pathname
      });
    }
    
    // Only admins and super-admins should be redirected for password change
    const isAdminUser = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;
    
    // If user needs to change password and not already on change password page
    if (isAdminUser && token.requirePasswordChange === true && !pathname.includes('/auth/change-password')) {
      // Clear any cached token to force refresh on next request
      if (sessionId) {
        tokenCache.delete(sessionId);
      }
      console.log('Redirecting to change-password because requirePasswordChange is true for admin user');
      const url = request.nextUrl.clone();
      url.pathname = '/auth/change-password';
      return NextResponse.redirect(url);
    }
    
    // If user is already on change password page but doesn't need to change password
    if (pathname === '/auth/change-password' && 
        (token.requirePasswordChange === false || !isAdminUser)) {
      console.log('Redirecting away from change-password: not required or not admin user');
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }
  
  // For all other paths, just continue
  return NextResponse.next();
}

// Configure on which paths this middleware should run
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.png|robots.txt).*)',
  ],
}; 