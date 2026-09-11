"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShapedAlbum } from "@/lib/queries";

export default function AlbumAdminRow({ album }: { album: ShapedAlbum }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Delete album "${album.title}"? Its photos will NOT be deleted — they'll just be un-albumed.`
      )
    )
      return;
    setPending(true);
    const res = await fetch(`/api/albums/${album.id}`, { method: "DELETE" });
    setPending(false);
    if (res.ok) router.refresh();
    else alert("Failed to delete album.");
  }

  return (
    <tr className="border-b border-neutral-200 dark:border-neutral-800">
      <td className="py-2 pr-4">{album.title}</td>
      <td className="py-2 pr-4">{album.photoCount}</td>
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
