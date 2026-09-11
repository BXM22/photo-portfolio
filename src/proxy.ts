// ============================================================================
// PROXY — ROUTE PROTECTION
// ============================================================================
// LEARNING NOTE: this file used to be called "middleware.ts" in older
// Next.js versions/tutorials — as of Next.js 16 the same file convention is
// named "proxy.ts" (the exported function is now called `proxy` too). It
// still does the same job: it runs BEFORE a request reaches any page or API
// route. We use it here to guard the entire /admin section: if you're not
// logged in and you try to visit /admin/photos, you never even get a chance
// to render that page — you're redirected to /admin/login first. This is a
// much stronger guard than "hide the button if not logged in," which only
// hides the UI, not the underlying route.
// ============================================================================

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";

  if (isOnAdmin && !isLoginPage && !isLoggedIn) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // If you're already logged in, sending you back to /admin/login is a
  // slightly nicer UX than showing you a login form you don't need.
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
});

// The `matcher` limits which routes even trigger this middleware. We only
// need it for the /admin pages and the upload endpoint (which ONLY the
// admin ever calls). We deliberately do NOT list /api/photos or
// /api/albums here: those endpoints serve BOTH public reads (e.g. a
// client-side tag filter calling GET /api/photos?tag=film) and admin
// writes (POST/PATCH/DELETE) from the same URL. Blanket-blocking the whole
// path here would also block the public reads, so instead each route
// handler checks `await auth()` itself before performing a mutation — see
// the `requireAdmin()` helper used throughout src/app/api/**/route.ts.
// This "defense in depth" (proxy AND per-handler checks) is a deliberate
// choice, not redundancy: it's what most real backends do.
export const config = {
  matcher: ["/admin/:path*", "/api/upload/:path*"],
};
