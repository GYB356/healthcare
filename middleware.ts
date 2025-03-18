import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

/**
 * SIMPLIFIED MIDDLEWARE
 * This is a simplified middleware that just logs requests but doesn't redirect.
 * Use this temporarily to see if middleware is causing the refresh loops.
 */

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register' || path === '/forgot-password';
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value || '';
  
  // Redirect logic for public paths
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Protected routes logic
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Role-based access control
  if (!isPublicPath && token) {
    try {
      const decodedToken = await verifyJwtToken(token);
      const userRole = decodedToken.role;
      
      // Admin paths
      if (path.startsWith('/admin') && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Doctor paths
      if (path.startsWith('/doctor') && userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Nurse paths
      if (path.startsWith('/nurse') && userRole !== 'NURSE' && userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Staff paths
      if (path.startsWith('/staff') && userRole !== 'STAFF' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Medical records security - only allow providers and the patient themselves
      if (path.startsWith('/medical-records/') && 
          userRole !== 'ADMIN' && 
          userRole !== 'DOCTOR' && 
          userRole !== 'NURSE') {
        // Extract patient ID from path
        const patientId = path.split('/')[2];
        
        // If not the patient's own records, redirect
        if (decodedToken.patientId !== patientId) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 