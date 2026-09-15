"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Slot } from "@prisma/client";
import { publicUrlForKey } from "@/lib/cdn";
import styles from "@/styles/Admin.module.css";

const SLOTS: Slot[] = ["left", "center", "right"];

type ExistingPhoto = {
  slot: Slot | null;
  storageKey: string;
  alt: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
};

type AlbumFormProps = {
  albumId?: string;
  title?: string;
  year?: string;
  photos?: ExistingPhoto[];
};

function photoForSlot(photos: ExistingPhoto[] | undefined, slot: Slot) {
  return photos?.find((photo) => photo.slot === slot);
}

async function readDimensions(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read image"));
      image.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadFile(file: File) {
  const presign = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  if (!presign.ok) {
    throw new Error("Could not start upload");
  }
  const { key, url } = (await presign.json()) as { key: string; url: string };
  const put = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) {
    throw new Error("Upload failed");
  }
  const dims = await readDimensions(file);
  return { storageKey: key, ...dims };
}

export default function AlbumForm({
  albumId,
  title = "",
  year = "",
  photos,
}: AlbumFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const nextPhotos = [];
      for (const slot of SLOTS) {
        const file = form.get(`${slot}-file`);
        const alt = String(form.get(`${slot}-alt`) ?? "").trim();
        const existing = photoForSlot(photos, slot);
        if (file instanceof File && file.size > 0) {
          const uploaded = await uploadFile(file);
          nextPhotos.push({ ...uploaded, alt, slot });
        } else if (existing) {
          nextPhotos.push({
            storageKey: existing.storageKey,
            alt: alt || existing.alt,
            width: existing.width,
            height: existing.height,
            blurDataUrl: existing.blurDataUrl ?? undefined,
            slot,
          });
        }
      }

      const payload = {
        title: String(form.get("title") ?? "").trim(),
        year: String(form.get("year") ?? "").trim(),
        photos: nextPhotos,
      };

      const res = await fetch(albumId ? `/api/albums/${albumId}` : "/api/albums", {
        method: albumId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Save failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span>Title</span>
        <input
          className={styles.input}
          name="title"
          defaultValue={title}
          required
        />
      </label>
      <label className={styles.field}>
        <span>Year</span>
        <input
          className={styles.input}
          name="year"
          defaultValue={year}
          required
        />
      </label>
      <div className={styles.slots}>
        {SLOTS.map((slot) => {
          const existing = photoForSlot(photos, slot);
          return (
            <div key={slot} className={styles.slot}>
              <label className={styles.field}>
                <span>{slot}</span>
                <input
                  className={styles.input}
                  type="file"
                  name={`${slot}-file`}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required={!existing}
                />
              </label>
              {existing ? (
                <div className={styles.preview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={publicUrlForKey(existing.storageKey)}
                    alt={existing.alt}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : null}
              <label className={styles.field}>
                <span>Alt</span>
                <input
                  className={styles.input}
                  name={`${slot}-alt`}
                  defaultValue={existing?.alt ?? ""}
                  required
                />
              </label>
            </div>
          );
        })}
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
