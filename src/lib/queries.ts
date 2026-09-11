// ============================================================================
// SHARED READ QUERIES
// ============================================================================
// LEARNING NOTE: this file exists to avoid writing the same Prisma query
// twice. It's called from two different places for two different reasons:
//
//   1. Server Components (e.g. src/app/page.tsx) call these functions
//      DIRECTLY — no HTTP request involved at all. A Server Component runs
//      on the server, so it can just talk to the database in-process. This
//      is faster than having the page fetch its own API route over HTTP.
//   2. The public GET route handlers (src/app/api/photos/route.ts, etc.)
//      call the SAME functions, so that client-side code (like the tag
//      filter UI, which runs in the browser and therefore MUST go over
//      HTTP) gets identical results and identical shaping logic.
//
// The rule of thumb: Server Components fetch data directly; anything that
// needs to fetch AFTER the initial page load (client-side interactivity)
// goes through an API route. Both paths funnel through this one file so the
// query logic and JSON shape are defined exactly once.
// ============================================================================

import { prisma } from "@/lib/prisma";
import { publicUrlForKey } from "@/lib/s3";

export type PhotoFilters = {
  tag?: string;
  albumSlug?: string;
  query?: string;
};

export async function getPhotos(filters: PhotoFilters = {}) {
  const { tag, albumSlug, query } = filters;

  const photos = await prisma.photo.findMany({
    where: {
      ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
      ...(albumSlug ? { album: { slug: albumSlug } } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      tags: { include: { tag: true } },
      album: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return photos.map((photo) => ({
    id: photo.id,
    title: photo.title,
    description: photo.description,
    url: publicUrlForKey(photo.storageKey),
    width: photo.width,
    height: photo.height,
    blurDataUrl: photo.blurDataUrl,
    featured: photo.featured,
    album: photo.album,
    tags: photo.tags.map((pt) => pt.tag),
    createdAt: photo.createdAt,
  }));
}

export type ShapedPhoto = Awaited<ReturnType<typeof getPhotos>>[number];

export async function getAlbums() {
  const albums = await prisma.album.findMany({
    include: {
      coverPhoto: true,
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return albums.map((album) => ({
    id: album.id,
    title: album.title,
    slug: album.slug,
    description: album.description,
    photoCount: album._count.photos,
    coverUrl: album.coverPhoto ? publicUrlForKey(album.coverPhoto.storageKey) : null,
  }));
}

export type ShapedAlbum = Awaited<ReturnType<typeof getAlbums>>[number];

export async function getAlbumBySlug(slug: string) {
  const album = await prisma.album.findUnique({ where: { slug } });
  if (!album) return null;
  return { ...album, photos: await getPhotos({ albumSlug: slug }) };
}

export async function getTags() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { photos: true } } },
    orderBy: { name: "asc" },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    photoCount: tag._count.photos,
  }));
}
