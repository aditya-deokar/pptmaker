import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/docs(.*)',
  '/api/webhook(.*)',
  '/api/inngest(.*)',
  '/api/mobile-design/inngest(.*)',
  '/api/mcp(.*)',
  '/.well-known/oauth-protected-resource(.*)',
  '/features(.*)',
  '/',
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith('/.well-known/oauth-protected-resource')) {
    const suffix = req.nextUrl.pathname.replace('/.well-known/oauth-protected-resource', '');
    const rewriteUrl = new URL(`/api/mcp/oauth-protected-resource${suffix}`, req.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
