"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AlbumWithPhotos } from "@/lib/queries";
import styles from "@/styles/Admin.module.css";

function patchBody(album: AlbumWithPhotos, sortOrder: number) {
  const photos = album.photos.filter(
    (photo) => photo.slot === "left" || photo.slot === "center" || photo.slot === "right",
  );
  return {
    title: album.title,
    year: album.year,
    sortOrder,
    photos: photos.map((photo) => ({
      storageKey: photo.storageKey,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
      slot: photo.slot,
    })),
  };
}

export default function AlbumList({ albums }: { albums: AlbumWithPhotos[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= albums.length) return;
    const a = albums[index];
    const b = albums[other];
    if (!a || !b) return;

    const [first, second] = await Promise.all([
      fetch(`/api/albums/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody(a, b.sortOrder)),
      }),
      fetch(`/api/albums/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody(b, a.sortOrder)),
      }),
    ]);

    if (!first.ok || !second.ok) {
      setError("Could not reorder sets");
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this set? Photos stay in storage.")) return;
    const res = await fetch(`/api/albums/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete set");
      return;
    }
    router.refresh();
  }

  return (
    <>
      {error ? <p className={styles.error}>{error}</p> : null}
      <ul className={styles.list}>
        {albums.map((album, index) => (
          <li key={album.id} className={styles.row}>
            <div>
              <p className={styles.rowTitle}>{album.title}</p>
              <p className={styles.rowMeta}>
                {album.year} · {album.slug}
              </p>
            </div>
            <div className={styles.rowActions}>
              <button
                className={styles.button}
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                Up
              </button>
              <button
                className={styles.button}
                type="button"
                disabled={index === albums.length - 1}
                onClick={() => move(index, 1)}
              >
                Down
              </button>
              <a className={styles.button} href={`/admin/${album.id}`}>
                Edit
              </a>
              <button
                className={styles.button}
                type="button"
                onClick={() => remove(album.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
