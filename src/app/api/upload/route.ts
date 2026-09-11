// ============================================================================
// POST /api/upload — step 1 of the photo upload flow (see src/lib/s3.ts for
// the full explanation of why we use presigned URLs instead of streaming
// the file through this server).
//
// Admin-only: this is where a bad actor could try to rack up storage costs
// or upload disallowed content, so we check auth FIRST, before doing any
// other work.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { presignRequestSchema } from "@/lib/validations";
import { buildStorageKey, createPresignedUploadUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  // `req.json()` can throw if the body isn't valid JSON at all — wrap it so
  // a malformed request gives a clean 400 instead of an unhandled 500.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // `safeParse` (vs `parse`) returns a result object instead of throwing,
  // which is usually nicer inside a route handler where we want to turn a
  // validation failure into a clean 400 response with details.
  const parsed = presignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { filename, contentType } = parsed.data;
  const storageKey = buildStorageKey(filename);
  const uploadUrl = await createPresignedUploadUrl(storageKey, contentType);

  // The client uses `uploadUrl` to PUT the raw file directly to S3, then
  // calls POST /api/photos with `storageKey` to save the metadata row.
  return NextResponse.json({ uploadUrl, storageKey });
}
