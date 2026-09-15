import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { conflict, notFound, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getAlbumById } from "@/lib/queries";
import { isUnauthorized, requireAdmin } from "@/lib/require-admin";
import { uniqueSlug } from "@/lib/slug";
import { albumPatchSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const album = await getAlbumById(id);
  if (!album) return notFound();
  return NextResponse.json(album);
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const { id } = await context.params;
  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing) return notFound();

  const parsed = await parseJson(request, albumPatchSchema);
  if ("error" in parsed) return parsed.error;

  const { title, year, photos, sortOrder } = parsed.data;
  const slug = await uniqueSlug(title, id);

  try {
    const album = await prisma.$transaction(async (tx) => {
      await tx.photo.updateMany({
        where: { albumId: id },
        data: { albumId: null, slot: null },
      });

      for (const { tagNames, ...photo } of photos) {
        await tx.photo.upsert({
          where: { storageKey: photo.storageKey },
          create: {
            ...photo,
            albumId: id,
            tags: tagNames
              ? {
                  create: tagNames.map((name) => ({
                    tag: {
                      connectOrCreate: {
                        where: { name },
                        create: { name },
                      },
                    },
                  })),
                }
              : undefined,
          },
          update: {
            alt: photo.alt,
            width: photo.width,
            height: photo.height,
            blurDataUrl: photo.blurDataUrl,
            slot: photo.slot,
            albumId: id,
          },
        });
      }

      return tx.album.update({
        where: { id },
        data: {
          title,
          year,
          slug,
          sortOrder: sortOrder ?? existing.sortOrder,
        },
        include: { photos: true },
      });
    });

    return NextResponse.json(album);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return conflict();
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const { id } = await context.params;
  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing) return notFound();

  await prisma.album.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
