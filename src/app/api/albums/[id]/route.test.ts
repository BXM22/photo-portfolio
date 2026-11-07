import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    album: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    photo: { updateMany: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/queries", () => ({ getAlbumById: vi.fn() }));
vi.mock("@/lib/slug", () => ({ uniqueSlug: vi.fn() }));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAlbumById } from "@/lib/queries";
import { uniqueSlug } from "@/lib/slug";
import { DELETE, GET, PATCH } from "./route";

const m = (f: unknown) => f as Mock;
const ctx = { params: Promise.resolve({ id: "a1" }) };
const photo = (slot: string, extra = {}) => ({
  storageKey: `k-${slot}`,
  alt: slot,
  width: 1,
  height: 1,
  slot,
  ...extra,
});
const body = (extra = {}) => ({
  title: "Japan",
  year: "2024",
  photos: [photo("left"), photo("center"), photo("right")],
  ...extra,
});
const patch = (b: unknown) =>
  new Request("http://localhost/api/albums/a1", {
    method: "PATCH",
    body: JSON.stringify(b),
  });
const plain = (method: string) =>
  new Request("http://localhost/api/albums/a1", { method });

beforeEach(() => {
  vi.clearAllMocks();
  m(auth).mockResolvedValue({ user: { id: "1" } });
  m(uniqueSlug).mockResolvedValue("japan");
  m(prisma.$transaction).mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma),
  );
});

describe("GET /api/albums/[id]", () => {
  it("returns 404 when missing", async () => {
    m(getAlbumById).mockResolvedValue(null);
    expect((await GET(plain("GET"), ctx)).status).toBe(404);
  });

  it("returns the album", async () => {
    m(getAlbumById).mockResolvedValue({ id: "a1" });
    await expect((await GET(plain("GET"), ctx)).json()).resolves.toEqual({ id: "a1" });
  });
});

describe("PATCH /api/albums/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    m(auth).mockResolvedValue(null);
    expect((await PATCH(patch(body()), ctx)).status).toBe(401);
  });

  it("returns 404 when the album does not exist", async () => {
    m(prisma.album.findUnique).mockResolvedValue(null);
    expect((await PATCH(patch(body()), ctx)).status).toBe(404);
  });

  it("returns 400 for invalid input", async () => {
    m(prisma.album.findUnique).mockResolvedValue({ id: "a1", sortOrder: 3 });
    expect((await PATCH(patch({ title: "" }), ctx)).status).toBe(400);
  });

  it("detaches, upserts photos, and keeps the existing sortOrder", async () => {
    m(prisma.album.findUnique).mockResolvedValue({ id: "a1", sortOrder: 3 });
    m(prisma.album.update).mockResolvedValue({ id: "a1" });
    const res = await PATCH(
      patch(body({ photos: [photo("left", { tagNames: ["snow"] }), photo("center"), photo("right")] })),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(uniqueSlug).toHaveBeenCalledWith("Japan", "a1");
    expect(prisma.photo.updateMany).toHaveBeenCalledWith({
      where: { albumId: "a1" },
      data: { albumId: null, slot: null },
    });
    expect(prisma.photo.upsert).toHaveBeenCalledTimes(3);
    const first = m(prisma.photo.upsert).mock.calls[0][0];
    expect(first.create.tags.create).toHaveLength(1);
    expect(first.update.albumId).toBe("a1");
    expect(m(prisma.photo.upsert).mock.calls[1][0].create.tags).toBeUndefined();
    expect(m(prisma.album.update).mock.calls[0][0].data.sortOrder).toBe(3);
  });

  it("uses an explicit sortOrder", async () => {
    m(prisma.album.findUnique).mockResolvedValue({ id: "a1", sortOrder: 3 });
    m(prisma.album.update).mockResolvedValue({ id: "a1" });
    await PATCH(patch(body({ sortOrder: 9 })), ctx);
    expect(m(prisma.album.update).mock.calls[0][0].data.sortOrder).toBe(9);
  });

  it("returns 409 on unique violation", async () => {
    m(prisma.album.findUnique).mockResolvedValue({ id: "a1", sortOrder: 3 });
    m(prisma.$transaction).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "6",
      }),
    );
    expect((await PATCH(patch(body()), ctx)).status).toBe(409);
  });

  it("rethrows unexpected errors", async () => {
    m(prisma.album.findUnique).mockResolvedValue({ id: "a1", sortOrder: 3 });
    m(prisma.$transaction).mockRejectedValue(new Error("boom"));
    await expect(PATCH(patch(body()), ctx)).rejects.toThrow("boom");
  });
});

describe("DELETE /api/albums/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    m(auth).mockResolvedValue(null);
    expect((await DELETE(plain("DELETE"), ctx)).status).toBe(401);
  });

  it("returns 404 when missing", async () => {
    m(prisma.album.findUnique).mockResolvedValue(null);
    expect((await DELETE(plain("DELETE"), ctx)).status).toBe(404);
  });

  it("deletes an existing album", async () => {
    m(prisma.album.findUnique).mockResolvedValue({ id: "a1" });
    const res = await DELETE(plain("DELETE"), ctx);
    expect(prisma.album.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
