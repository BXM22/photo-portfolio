import type { Album, Photo, Slot } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicUrlForKey } from "@/lib/cdn";

const SLOTS: Slot[] = ["left", "center", "right"];

export type LocationPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Location = {
  id: string;
  title: string;
  year: string;
  left: LocationPhoto;
  center: LocationPhoto;
  right: LocationPhoto;
};

export type AlbumWithPhotos = Album & { photos: Photo[] };

const photoSelect = {
  id: true,
  storageKey: true,
  alt: true,
  width: true,
  height: true,
  blurDataUrl: true,
  slot: true,
  albumId: true,
  createdAt: true,
  tags: { include: { tag: true } },
} as const;

function toLocationPhoto(photo: Photo): LocationPhoto {
  return {
    src: publicUrlForKey(photo.storageKey),
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
  };
}

function slotted(photos: Photo[]) {
  const bySlot = new Map(photos.map((photo) => [photo.slot, photo]));
  if (!SLOTS.every((slot) => bySlot.get(slot))) {
    return null;
  }
  return {
    left: toLocationPhoto(bySlot.get("left")!),
    center: toLocationPhoto(bySlot.get("center")!),
    right: toLocationPhoto(bySlot.get("right")!),
  };
}

export async function getWorkLocations(): Promise<Location[]> {
  const albums = await prisma.album.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { photos: true },
  });

  return albums.flatMap((album) => {
    const shots = slotted(album.photos);
    if (!shots) return [];
    return [{ id: album.slug, title: album.title, year: album.year, ...shots }];
  });
}

export async function listAlbums(): Promise<AlbumWithPhotos[]> {
  return prisma.album.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { photos: true },
  });
}

export async function getAlbumById(id: string) {
  return prisma.album.findUnique({
    where: { id },
    include: { photos: true },
  });
}

export async function nextAlbumSortOrder() {
  const last = await prisma.album.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export async function listPhotos(params: {
  page: number;
  pageSize: number;
  tag?: string;
  album?: string;
  q?: string;
}) {
  const { page, pageSize, tag, album, q } = params;
  const where = {
    ...(q
      ? {
          OR: [
            { alt: { contains: q, mode: "insensitive" as const } },
            { storageKey: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(album
      ? {
          album: {
            OR: [{ id: album }, { slug: album }],
          },
        }
      : {}),
    ...(tag
      ? {
          tags: {
            some: { tag: { name: tag } },
          },
        }
      : {}),
  };

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: photoSelect,
    }),
    prisma.photo.count({ where }),
  ]);

  return { photos, total, page, pageSize };
}

export async function listTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { photos: true } } },
  });
}
