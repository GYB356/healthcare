import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

// Paths that don't require authentication
const publicPaths = ['/auth/login', '/auth/register', '/api/auth/login', '/api/auth/register'];

// Role-based path access
const roleBasedPaths = {
  ADMIN: ['/dashboard/admin'],
  DOCTOR: ['/dashboard/doctor'],
  PATIENT: ['/dashboard/patient'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware processing path:', pathname);

  // Allow access to public paths
  if (publicPaths.includes(pathname)) {
    console.log('Public path accessed:', pathname);
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('token')?.value;
  console.log('Token present:', !!token);

  if (!token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    // Verify and decode the token
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      email: string;
      role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
    };

    console.log('Token decoded, user role:', decoded.role);

    // Check role-based access
    const userRole = decoded.role;
    const isRoleBasedPath = Object.values(roleBasedPaths).flat().includes(pathname);

    if (isRoleBasedPath) {
      const allowedPaths = roleBasedPaths[userRole] || [];
      if (!allowedPaths.includes(pathname)) {
        console.log('User not authorized for this path, redirecting to appropriate dashboard');
        // Redirect to appropriate dashboard based on role
        switch (userRole) {
          case 'ADMIN':
            return NextResponse.redirect(new URL('/dashboard/admin', request.url));
          case 'DOCTOR':
            return NextResponse.redirect(new URL('/dashboard/doctor', request.url));
          case 'PATIENT':
            return NextResponse.redirect(new URL('/dashboard/patient', request.url));
          default:
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }

    console.log('Access granted');
    return NextResponse.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/login',
    '/auth/register',
    '/api/auth/:path*',
  ],
}; 