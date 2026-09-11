// ============================================================================
// NextAuth's `useSession()` hook and `signIn`/`signOut` client helpers need
// a React Context Provider somewhere above them in the tree. This tiny
// wrapper is the standard way to bridge that requirement in the App Router:
// the Provider itself must be a Client Component ("use client"), but we
// keep the actual page/layout files as Server Components by isolating the
// "use client" boundary to just this one file.
// ============================================================================

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
