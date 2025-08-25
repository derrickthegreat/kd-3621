import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server'

const isAuthPages = createRouteMatcher(['/login', '/register']);
const isPublic = createRouteMatcher(['/login', '/register', '/onboarding', '/sso-callback', '/forgot-password', '/reset-password', '/sign-in', '/sign-up']);

// Clerk middleware + small redirect guard for signed-in users visiting auth pages
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  if (userId && isAuthPages(req)) {
    // If already signed in, steer away based on role
    try {
      const url = new URL('/api/auth/redirect-target', req.url);
      const res = await fetch(url, { headers: { cookie: req.headers.get('cookie') || '' } });
      const data = await res.json().catch(() => ({ target: '/' }));
      return NextResponse.redirect(new URL(data?.target || '/', req.url));
    } catch {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  // Let Clerk continue default behavior
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Protect all admin routes
    '/admin(.*)',
  // Auth pages should remain publicly accessible, Clerk will handle
  '/sign-in',
  '/sign-up',
  '/login',
  '/register',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/sso-callback',
  ],
}