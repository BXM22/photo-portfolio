// ============================================================================
// PATCH  /api/albums/:id — ADMIN-ONLY. Update title/description/cover photo.
// DELETE /api/albums/:id — ADMIN-ONLY. Delete an album (its photos are kept
//                           and just become un-albumed — see the
//                           `onDelete: SetNull` comment in schema.prisma).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { updateAlbumSchema } from "@/lib/validations";

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

  const parsed = updateAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const album = await prisma.album.update({ where: { id }, data: parsed.data });
  return NextResponse.json(album);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  await prisma.album.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
