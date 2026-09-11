// ============================================================================
// NextAuth's Next.js App Router integration expects a route file that
// re-exports its request handlers for GET and POST. This one file handles
// EVERY auth-related URL under /api/auth/* (sign-in, sign-out, session
// check, CSRF token, etc.) — the `[...nextauth]` catch-all segment in the
// folder name is what makes that work.
// ============================================================================

export { GET, POST } from "@/lib/auth";
