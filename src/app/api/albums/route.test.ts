import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { album: { create: vi.fn() } } }));
vi.mock("@/lib/queries", () => ({
  listAlbums: vi.fn(),
  nextAlbumSortOrder: vi.fn(),
}));
vi.mock("@/lib/slug", () => ({ uniqueSlug: vi.fn() }));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAlbums, nextAlbumSortOrder } from "@/lib/queries";
import { uniqueSlug } from "@/lib/slug";
import { GET, POST } from "./route";

const m = (f: unknown) => f as Mock;
const photo = (slot: string, extra = {}) => ({
  storageKey: `k-${slot}`,
  alt: slot,
  width: 1,
  height: 1,
  slot,
  ...extra,
});
const album = (extra = {}) => ({
  title: "Japan",
  year: "2024",
  photos: [photo("left"), photo("center"), photo("right")],
  ...extra,
});
const post = (body: unknown) =>
  new Request("http://localhost/api/albums", {
    method: "POST",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  m(auth).mockResolvedValue({ user: { id: "1" } });
  m(uniqueSlug).mockResolvedValue("japan");
  m(nextAlbumSortOrder).mockResolvedValue(7);
  m(prisma.album.create).mockResolvedValue({ id: "a" });
});

describe("/api/albums", () => {
  it("GET lists albums", async () => {
    m(listAlbums).mockResolvedValue([{ id: "a" }]);
    await expect((await GET()).json()).resolves.toEqual([{ id: "a" }]);
  });

  it("POST returns 401 when unauthenticated", async () => {
    m(auth).mockResolvedValue(null);
    expect((await POST(post(album()))).status).toBe(401);
  });

  it("POST returns 400 when slots are not distinct", async () => {
    const bad = album({
      photos: [photo("left"), photo("left"), photo("right")],
    });
    expect((await POST(post(bad))).status).toBe(400);
  });

  it("POST returns 400 when not exactly three photos", async () => {
    expect((await POST(post(album({ photos: [photo("left")] })))).status).toBe(400);
  });

  it("POST creates an album with the next sort order", async () => {
    const res = await POST(post(album()));
    expect(res.status).toBe(201);
    const { data } = m(prisma.album.create).mock.calls[0][0];
    expect(data).toMatchObject({ title: "Japan", slug: "japan", sortOrder: 7 });
    expect(data.photos.create).toHaveLength(3);
    expect(data.photos.create[0].tags).toBeUndefined();
  });

  it("POST honours an explicit sortOrder and tags", async () => {
    const body = album({
      sortOrder: 2,
      photos: [
        photo("left", { tagNames: ["snow"] }),
        photo("center"),
        photo("right"),
      ],
    });
    await POST(post(body));
    const { data } = m(prisma.album.create).mock.calls[0][0];
    expect(data.sortOrder).toBe(2);
    expect(nextAlbumSortOrder).not.toHaveBeenCalled();
    expect(data.photos.create[0].tags.create[0].tag.connectOrCreate.where).toEqual({
      name: "snow",
    });
  });

  it("POST returns 409 on unique violation", async () => {
    m(prisma.album.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "6",
      }),
    );
    expect((await POST(post(album()))).status).toBe(409);
  });

  it("POST rethrows unexpected errors", async () => {
    m(prisma.album.create).mockRejectedValue(new Error("boom"));
    await expect(POST(post(album()))).rejects.toThrow("boom");
  });
});
