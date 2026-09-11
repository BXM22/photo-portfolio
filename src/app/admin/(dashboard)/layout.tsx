// ============================================================================
// ADMIN LAYOUT
// ============================================================================
// Wraps every /admin/* page with the sign-out button and a small nav. Note
// that route PROTECTION itself (redirecting a logged-out visitor away)
// happens in src/proxy.ts, which runs before this layout even renders —
// this layout only handles the UI chrome for whoever is already allowed in.
// ============================================================================

import Link from "next/link";
import SessionProvider from "@/components/SessionProvider";
import SignOutButton from "@/components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/photos/upload">Upload</Link>
            <Link href="/admin/albums">Albums</Link>
            <Link href="/admin/albums/new">New Album</Link>
          </nav>
          <SignOutButton />
        </div>
        {children}
      </div>
    </SessionProvider>
  );
}
