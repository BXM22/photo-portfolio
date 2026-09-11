// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================
// LEARNING NOTE: every API route in this app validates its input with Zod
// BEFORE touching the database. This matters because:
//
//   1. TypeScript types only exist at compile time — they vanish once your
//      code is running. A malicious (or just buggy) client can send any
//      JSON it wants to your API route; TypeScript can't stop that at
//      runtime. Zod re-checks the shape of the data as it actually arrives.
//   2. `schema.parse(data)` both validates AND returns a fully-typed object,
//      so you get runtime safety and type inference from one declaration —
//      you never define the shape twice.
//
// This is one of the first things interviewers look for in a fullstack
// take-home: "does the API trust the client, or does it verify input?"
// ============================================================================

import { z } from "zod";

// Used by POST /api/albums and the "new album" admin form.
export const createAlbumSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional(),
});

// Used by PATCH /api/albums/[id].
export const updateAlbumSchema = createAlbumSchema.partial().extend({
  coverPhotoId: z.string().cuid().nullable().optional(),
});

// Used by POST /api/photos — creating the DATABASE RECORD for a photo after
// the actual image bytes have already been uploaded straight to S3 (see
// src/lib/s3.ts for why we split "upload the file" and "save the metadata"
// into two separate steps).
export const createPhotoSchema = z.object({
  storageKey: z.string().min(1),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataUrl: z.string().optional(),
  albumId: z.string().cuid().nullable().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const updatePhotoSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  albumId: z.string().cuid().nullable().optional(),
  featured: z.boolean().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

// Used by POST /api/upload — before we hand out an S3 presigned URL, we
// validate the file the client says it wants to upload, so we never
// generate a presigned URL for a 500MB file or a non-image mime type.
export const presignRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  size: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024, "File must be 20MB or smaller"),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(40),
});
