// ============================================================================
// PATCH  /api/photos/:id — ADMIN-ONLY. Update a photo's title/description/
//                           album/tags/featured flag.
// DELETE /api/photos/:id — ADMIN-ONLY. Delete a photo's database row (and,
//                           in a production build-out, its S3 object too —
//                           see the comment below).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { updatePhotoSchema } from "@/lib/validations";

// LEARNING NOTE: in the Next.js App Router, dynamic route params (the
// `[id]` folder) are passed to the handler as a Promise you must `await` —
// this changed between Next.js versions, so if you see older tutorials
// destructuring `{ params: { id } }` directly (no Promise), that's the
// Next.js 14-and-earlier API.
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updatePhotoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tagIds, ...updates } = parsed.data;

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const photo = await prisma.photo.update({
    where: { id },
    data: {
      ...updates,
      // Replacing tag assignments: delete all existing join rows for this
      // photo, then create the new set. Simpler and less error-prone than
      // diffing "which tags were added/removed" by hand, and fine
      // performance-wise for a photo that has at most a handful of tags.
      ...(tagIds
        ? {
            tags: {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }
        : {}),
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(photo);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Deleting the photo row also cascades to delete its `PhotoTag` join
  // rows automatically, because prisma/schema.prisma declares
  // `onDelete: Cascade` on that relation.
  await prisma.photo.delete({ where: { id } });

  // PRODUCTION TODO: also delete the underlying object from S3 here with
  // `s3Client.send(new DeleteObjectCommand({ Bucket, Key: existing.storageKey }))`.
  // It's left as a follow-up rather than wired in by default so that a
  // mistaken delete during development doesn't also destroy the real file —
  // a good exercise once you're comfortable with the rest of the flow.

  return new NextResponse(null, { status: 204 });
}
