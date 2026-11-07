import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    album: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    photo: { findMany: vi.fn(), count: vi.fn() },
    tag: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getAlbumById,
  getWorkLocations,
  listAlbums,
  listPhotos,
  listTags,
  nextAlbumSortOrder,
} from "@/lib/queries";

const m = (fn: unknown) => fn as Mock;

function photo(slot: string | null, key = `k-${slot}`) {
  return { slot, storageKey: key, alt: `alt-${slot}`, width: 1, height: 2 };
}

beforeEach(() => vi.clearAllMocks());

describe("getWorkLocations", () => {
  it("maps albums with all three slots", async () => {
    m(prisma.album.findMany).mockResolvedValue([
      {
        slug: "japan",
        title: "Japan",
        year: "2024",
        photos: [photo("right"), photo("left"), photo("center")],
      },
    ]);
    const [loc] = await getWorkLocations();
    expect(loc).toMatchObject({ id: "japan", title: "Japan", year: "2024" });
    expect(loc.left).toEqual({ src: "/k-left", alt: "alt-left", width: 1, height: 2 });
    expect(loc.center.alt).toBe("alt-center");
    expect(loc.right.alt).toBe("alt-right");
  });

  it("skips albums missing a slot", async () => {
    m(prisma.album.findMany).mockResolvedValue([
      { slug: "x", title: "X", year: "1", photos: [photo("left"), photo("center")] },
    ]);
    await expect(getWorkLocations()).resolves.toEqual([]);
  });

  it("returns an empty list when there are no albums", async () => {
    m(prisma.album.findMany).mockResolvedValue([]);
    await expect(getWorkLocations()).resolves.toEqual([]);
  });
});

describe("album queries", () => {
  it("listAlbums orders by sortOrder then createdAt", async () => {
    m(prisma.album.findMany).mockResolvedValue([]);
    await listAlbums();
    expect(prisma.album.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { photos: true },
    });
  });

  it("getAlbumById looks up by id with photos", async () => {
    m(prisma.album.findUnique).mockResolvedValue(null);
    await expect(getAlbumById("a1")).resolves.toBeNull();
    expect(prisma.album.findUnique).toHaveBeenCalledWith({
      where: { id: "a1" },
      include: { photos: true },
    });
  });

  it("nextAlbumSortOrder returns 0 when no albums exist", async () => {
    m(prisma.album.findFirst).mockResolvedValue(null);
    await expect(nextAlbumSortOrder()).resolves.toBe(0);
  });

  it("nextAlbumSortOrder increments the highest sortOrder", async () => {
    m(prisma.album.findFirst).mockResolvedValue({ sortOrder: 4 });
    await expect(nextAlbumSortOrder()).resolves.toBe(5);
  });
});

describe("listPhotos", () => {
  beforeEach(() => {
    m(prisma.photo.findMany).mockResolvedValue([{ id: "p" }]);
    m(prisma.photo.count).mockResolvedValue(1);
  });

  it("uses an empty filter and paginates", async () => {
    const result = await listPhotos({ page: 3, pageSize: 10 });
    expect(result).toEqual({ photos: [{ id: "p" }], total: 1, page: 3, pageSize: 10 });
    const args = m(prisma.photo.findMany).mock.calls[0][0];
    expect(args.where).toEqual({});
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
  });

  it("builds q, album and tag filters", async () => {
    await listPhotos({ page: 1, pageSize: 5, q: "lake", album: "japan", tag: "snow" });
    const { where } = m(prisma.photo.findMany).mock.calls[0][0];
    expect(where.OR).toHaveLength(2);
    expect(where.album).toEqual({ OR: [{ id: "japan" }, { slug: "japan" }] });
    expect(where.tags).toEqual({ some: { tag: { name: "snow" } } });
    expect(prisma.photo.count).toHaveBeenCalledWith({ where });
  });
});

describe("listTags", () => {
  it("orders by name with photo counts", async () => {
    m(prisma.tag.findMany).mockResolvedValue([]);
    await listTags();
    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: { _count: { select: { photos: true } } },
    });
  });
});
