import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Higher-order function for Superadmin Authentication
export function withSuperadminAuth(
  handler: (request: Request, paramsOrToken?: any, token?: any) => Promise<NextResponse>
) {
  return async (request: Request, params?: any): Promise<NextResponse> => {
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    if (token.role !== 'super-admin') { 
      return NextResponse.json({ message: 'Forbidden: Superadmin access required' }, { status: 403 });
    }
    // Pass params to the handler if they exist (for routes with dynamic segments)
    if (params) {
      return handler(request, params, token);
    }
    return handler(request, token); // For handlers that don't take params
  };
} 