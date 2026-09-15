import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { conflict, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listAlbums, nextAlbumSortOrder } from "@/lib/queries";
import { isUnauthorized, requireAdmin } from "@/lib/require-admin";
import { uniqueSlug } from "@/lib/slug";
import { albumCreateSchema } from "@/lib/validations";

export async function GET() {
  const albums = await listAlbums();
  return NextResponse.json(albums);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (isUnauthorized(session)) return session;

  const parsed = await parseJson(request, albumCreateSchema);
  if ("error" in parsed) return parsed.error;

  const { title, year, photos, sortOrder } = parsed.data;
  const slug = await uniqueSlug(title);

  try {
    const album = await prisma.album.create({
      data: {
        title,
        year,
        slug,
        sortOrder: sortOrder ?? (await nextAlbumSortOrder()),
        photos: {
          create: photos.map(({ tagNames, ...photo }) => ({
            ...photo,
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
          })),
        },
      },
      include: { photos: true },
    });
    return NextResponse.json(album, { status: 201 });
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
