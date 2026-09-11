// ============================================================================
// PHOTO ADMIN ROW (Client Component) — one row in the manage-photos table,
// with a working "delete" button and "toggle featured" checkbox.
// ============================================================================

"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ShapedPhoto } from "@/lib/queries";

export default function PhotoAdminRow({ photo }: { photo: ShapedPhoto }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${photo.title || "this photo"}"? This cannot be undone.`)) return;
    setPending(true);
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
    setPending(false);
    if (res.ok) {
      // `router.refresh()` re-runs the Server Component that fetched this
      // list (src/app/admin/(dashboard)/photos/page.tsx) without a full
      // page reload — the standard way to sync the UI with the database
      // after a client-triggered mutation.
      router.refresh();
    } else {
      alert("Failed to delete photo.");
    }
  }

  async function toggleFeatured() {
    setPending(true);
    const res = await fetch(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !photo.featured }),
    });
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <tr className="border-b border-neutral-200 dark:border-neutral-800">
      <td className="py-2 pr-4">
        <Image
          src={photo.url}
          alt={photo.title || "Untitled"}
          width={64}
          height={64}
          className="h-16 w-16 rounded object-cover"
        />
      </td>
      <td className="py-2 pr-4">{photo.title || <span className="text-neutral-400">Untitled</span>}</td>
      <td className="py-2 pr-4">{photo.album?.title ?? "—"}</td>
      <td className="py-2 pr-4">{photo.tags.map((t) => t.name).join(", ") || "—"}</td>
      <td className="py-2 pr-4">
        <input type="checkbox" checked={photo.featured} onChange={toggleFeatured} disabled={pending} />
      </td>
      <td className="py-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="text-sm text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
