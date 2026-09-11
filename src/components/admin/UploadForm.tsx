// ============================================================================
// UPLOAD FORM (Client Component) — the full end-to-end upload flow.
// ============================================================================
// LEARNING NOTE: walk through this top-to-bottom to see the ENTIRE upload
// pipeline described in src/lib/s3.ts actually wired together:
//
//   1. Read the raw image dimensions in the BROWSER (new Image() + onload)
//      — we need width/height for the database, and measuring them
//      client-side means the server never has to open/decode the file.
//   2. POST /api/upload -> get back { uploadUrl, storageKey }.
//   3. PUT the raw file bytes directly to `uploadUrl` (which points at S3,
//      not our server — see the presigned-URL explanation in s3.ts).
//   4. POST /api/photos with the storageKey + dimensions + metadata to
//      create the database row.
//
// Doing this for a LIST of files means running that 4-step pipeline once
// per file and tracking each file's progress independently.
// ============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FileStatus = "pending" | "uploading" | "saving" | "done" | "error";

type FileState = {
  file: File;
  status: FileStatus;
  error?: string;
};

// Reads a File's pixel dimensions by loading it into an offscreen <img>
// element — the browser does the image decoding for us.
function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      reject(new Error("Could not read image dimensions"));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function UploadForm({
  albums,
}: {
  albums: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<FileState[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected.map((file) => ({ file, status: "pending" as const })));
  }

  function updateFileStatus(index: number, patch: Partial<FileState>) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function uploadOne(fileState: FileState, index: number) {
    const { file } = fileState;
    try {
      updateFileStatus(index, { status: "uploading" });

      // Step 1: measure dimensions client-side.
      const { width, height } = await readImageDimensions(file);

      // Step 2: ask our server for a presigned S3 URL.
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, storageKey } = await presignRes.json();

      // Step 3: upload the raw bytes directly to S3. Note this PUT goes to
      // S3's domain, not ours — our server is never in the data path.
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      updateFileStatus(index, { status: "saving" });

      // Step 4: create the database record.
      const tagNames = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Resolve (or create) each tag by name before attaching them to the
      // photo — POST /api/tags is an `upsert`, so calling it with a name
      // that already exists is safe and just returns the existing tag.
      const tagIds: string[] = [];
      for (const name of tagNames) {
        const tagRes = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (tagRes.ok) {
          const tag = await tagRes.json();
          tagIds.push(tag.id);
        }
      }

      const photoRes = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageKey,
          width,
          height,
          title: title || undefined,
          description: description || undefined,
          albumId: albumId || undefined,
          tagIds,
        }),
      });
      if (!photoRes.ok) throw new Error("Failed to save photo record");

      updateFileStatus(index, { status: "done" });
    } catch (err) {
      updateFileStatus(index, {
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Upload files one at a time (sequential) rather than all at once —
    // simpler to reason about and to show progress for, and avoids
    // hammering the API with a burst of simultaneous presign requests.
    for (let i = 0; i < files.length; i++) {
      await uploadOne(files[i], i);
    }

    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Photos</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={handleFileSelect}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Title (optional, applied to all)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <select
          value={albumId}
          onChange={(e) => setAlbumId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">No album</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
      </div>

      <textarea
        placeholder="Description (optional, applied to all)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        rows={2}
      />

      <input
        type="text"
        placeholder="Tags, comma separated (e.g. landscape, film, iceland)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />

      {files.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="truncate">{f.file.name}</span>
              <span
                className={
                  f.status === "error"
                    ? "text-red-600"
                    : f.status === "done"
                      ? "text-green-600"
                      : "text-neutral-500"
                }
              >
                {f.status === "error" ? f.error : f.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={files.length === 0 || submitting}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? "Uploading..." : `Upload ${files.length || ""} photo(s)`}
      </button>
    </form>
  );
}
