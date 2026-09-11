// ============================================================================
// GET  /api/albums — PUBLIC. List all albums with their cover photo + count.
// POST /api/albums — ADMIN-ONLY. Create a new album.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { createAlbumSchema } from "@/lib/validations";
import { slugify, uniqueSlug } from "@/lib/slug";
import { getAlbums } from "@/lib/queries";

export async function GET() {
  // Same story as GET /api/photos: this is public, and the query logic is
  // shared with the Server Component that renders /albums on first load
  // (see src/lib/queries.ts).
  return NextResponse.json(await getAlbums());
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

  const parsed = createAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Generating a unique slug server-side means the client never has to
  // worry about slug collisions at all — it just sends a title.
  const existingSlugs = (await prisma.album.findMany({ select: { slug: true } })).map(
    (a) => a.slug
  );
  const slug = uniqueSlug(slugify(parsed.data.title), existingSlugs);

  const album = await prisma.album.create({
    data: { ...parsed.data, slug },
  });

  return NextResponse.json(album, { status: 201 });
}
