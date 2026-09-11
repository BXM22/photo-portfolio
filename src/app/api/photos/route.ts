// ============================================================================
// GET  /api/photos  — PUBLIC. Powers the client-side gallery filter/search
//                      (tag chips, text search) without a full page reload.
// POST /api/photos  — ADMIN-ONLY. Creates the database row for a photo
//                      whose bytes were already uploaded to S3 (step 2 of
//                      the upload flow — see src/lib/s3.ts).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { createPhotoSchema } from "@/lib/validations";
import { getPhotos } from "@/lib/queries";

export async function GET(req: NextRequest) {
  // This route is PUBLIC on purpose (see src/proxy.ts's comment on why it's
  // not gated there) — it's what the client-side tag filter / search box
  // calls after the initial page load. The actual query logic lives in
  // src/lib/queries.ts so it's identical to what the homepage Server
  // Component renders on first load.
  const { searchParams } = new URL(req.url);

  const photos = await getPhotos({
    tag: searchParams.get("tag") ?? undefined,
    albumSlug: searchParams.get("album") ?? undefined,
    query: searchParams.get("q") ?? undefined,
  });

  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createPhotoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tagIds, ...photoData } = parsed.data;

  const photo = await prisma.photo.create({
    data: {
      ...photoData,
      // Nested writes: Prisma lets us create the join-table rows in the
      // SAME database transaction as the photo itself, instead of a
      // separate round trip after the fact. If anything fails, NOTHING is
      // written — no orphaned photo-with-no-tags left behind.
      tags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(photo, { status: 201 });
}
