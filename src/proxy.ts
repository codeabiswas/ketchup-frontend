// src/proxy.ts — Next.js 16 proxy (replaces middleware.ts)
//
// IMPORTANT: proxy.ts runs on the Node.js runtime (not Edge).
// next-auth's auth() wrapper is compatible with Node.js runtime,
// so this works without the split-config pattern.

import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Landing page: if already signed in, skip to dashboard
  if (pathname === "/") {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return; // Allow unauthenticated access to landing page
  }

  // All other routes: require authentication
  if (!isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
