// ============================================================================
// PER-ROUTE AUTH GUARD
// ============================================================================
// Small helper used at the top of every mutating API route handler
// (POST/PATCH/DELETE) to check "is this request coming from a logged-in
// admin?" before touching the database. See src/middleware.ts for why this
// exists IN ADDITION TO the middleware, not instead of it.
// ============================================================================

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Returns `null` if the current request is authenticated. Otherwise
 * returns a ready-to-return 401 NextResponse. Usage in a route handler:
 *
 *   const unauthorized = await requireAdmin();
 *   if (unauthorized) return unauthorized;
 *   // ...proceed with the mutation
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
