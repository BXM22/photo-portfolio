import { z } from "zod";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB — tweak if you want

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const slotSchema = z.enum(["left", "center", "right"]);

/** POST /api/upload — metadata only; bytes go to S3. */
export const uploadSchema = z.object({
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

const photoFields = {
  storageKey: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataUrl: z.string().optional(),
  slot: slotSchema.optional(),
  albumId: z.string().min(1).optional(),
  tagNames: z.array(z.string().min(1)).optional(),
};

/** POST /api/photos — one photo. slot/albumId optional (orphan until attached). */
export const photoCreateSchema = z.object(photoFields);

/** PATCH /api/photos/[id] — send only what changed. */
export const photoPatchSchema = photoCreateSchema.partial();

/** Nested on album save: slot is required; albumId comes from the parent. */
const albumPhotoSchema = z
  .object(photoFields)
  .omit({ albumId: true })
  .extend({ slot: slotSchema });

function threeDistinctSlots<T extends { slot: "left" | "center" | "right" }>(
  photos: T[],
) {
  return new Set(photos.map((p) => p.slot)).size === 3;
}

const albumPhotosSchema = z
  .array(albumPhotoSchema)
  .length(3)
  .refine(threeDistinctSlots, {
    message: "photos must use distinct slots: left, center, right",
  });

/** POST and PATCH /api/albums — title, year, exactly left+center+right. */
export const albumCreateSchema = z.object({
  title: z.string().trim().min(1),
  year: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  photos: albumPhotosSchema,
});

export const albumPatchSchema = albumCreateSchema;

export const tagCreateSchema = z.object({
  name: z.string().trim().min(1),
});

export type UploadInput = z.infer<typeof uploadSchema>;
export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;
export type PhotoPatchInput = z.infer<typeof photoPatchSchema>;
export type AlbumCreateInput = z.infer<typeof albumCreateSchema>;
export type AlbumPatchInput = z.infer<typeof albumPatchSchema>;