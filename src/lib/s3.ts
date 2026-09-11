// ============================================================================
// S3 UPLOAD HELPERS — PRESIGNED URLS
// ============================================================================
// LEARNING NOTE: there are two common ways to get an uploaded file from a
// user's browser into cloud storage:
//
//   (A) Browser -> your Next.js server -> S3
//       The file passes THROUGH your server. Simple, but your server has to
//       hold the entire file in memory/disk while relaying it, which doesn't
//       scale well and burns your server's bandwidth for no reason.
//
//   (B) Browser -> S3 directly, using a short-lived "presigned URL" your
//       server generated first.
//       Your server never touches the file bytes at all — it just proves
//       (via the presigned URL's cryptographic signature) that it AUTHORIZED
//       this specific upload. This is what virtually every production app
//       does, and it's the pattern implemented here.
//
// Flow implemented in this project:
//   1. Browser tells our API "I want to upload sunset.jpg, it's a JPEG,
//      it's 2.4MB" -> POST /api/upload
//   2. Our server validates that request (see validations.ts), decides on a
//      unique storage key, and asks AWS S3 to mint a presigned PUT URL good
//      for 60 seconds.
//   3. Browser uploads the raw file bytes directly to that URL.
//   4. Browser tells our API "I finished uploading, here's the key and the
//      image dimensions I measured client-side" -> POST /api/photos, which
//      creates the database row.
// ============================================================================

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// A single shared S3 client, similar in spirit to the Prisma singleton —
// creating a new client per-request would work, but reusing one is more
// efficient (it can reuse TCP connections to AWS).
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Builds a storage key (the "path" inside the bucket) that's guaranteed
 * unique and keeps uploads organized by year/month, e.g.
 *   "photos/2026/09/3fae1d2b-9c31-4b7e-a3aa-2e6cf5b1d9aa.jpg"
 * We generate this key on the SERVER (never trust a client-supplied path —
 * a malicious client could otherwise try to overwrite another object by
 * guessing/reusing its key).
 */
export function buildStorageKey(originalFilename: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = originalFilename.split(".").pop()?.toLowerCase() || "jpg";
  return `photos/${year}/${month}/${randomUUID()}.${extension}`;
}

/**
 * Generates a short-lived URL that authorizes ONE PutObject upload to the
 * given key. `expiresIn` is in seconds — 60 seconds is plenty for a browser
 * to start the upload after receiving the URL.
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 60
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    // ContentType is included in the signature, which means S3 will REJECT
    // the upload if the browser tries to send a different Content-Type
    // header than what we authorized — a small but real security guard.
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Builds the public, permanent URL for an already-uploaded object. We
 * front the bucket with a CloudFront CDN distribution (see docs/SETUP.md),
 * so this points at the CDN domain rather than the raw S3 URL — that gets
 * you edge caching and much faster image loads worldwide for free.
 */
export function publicUrlForKey(key: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL;
  if (cdnBase) return `${cdnBase.replace(/\/$/, "")}/${key}`;
  // Fallback for local dev before you've set up CloudFront: hit S3 directly.
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
