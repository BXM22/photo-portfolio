// ============================================================================
// ADMIN DASHBOARD — overview / landing page after login.
// ============================================================================

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  // `Promise.all` again to run these three independent counts concurrently
  // instead of one after another.
  const [photoCount, albumCount, tagCount] = await Promise.all([
    prisma.photo.count(),
    prisma.album.count(),
    prisma.tag.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Photos" value={photoCount} />
        <Stat label="Albums" value={albumCount} />
        <Stat label="Tags" value={tagCount} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/photos/upload"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Upload photos
        </Link>
        <Link
          href="/admin/photos"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Manage photos
        </Link>
        <Link
          href="/admin/albums"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Manage albums
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}
