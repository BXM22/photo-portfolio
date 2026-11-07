import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { photo: { create: vi.fn() } } }));
vi.mock("@/lib/queries", () => ({ listPhotos: vi.fn() }));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listPhotos } from "@/lib/queries";
import { GET, POST } from "./route";

const valid = { storageKey: "k", alt: "a", width: 1, height: 2 };
const post = (body: unknown) =>
  new Request("http://localhost/api/photos", {
    method: "POST",
    body: JSON.stringify(body),
  });
const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError("dup", {
    code: "P2002",
    clientVersion: "6",
  });

beforeEach(() => {
  vi.clearAllMocks();
  (auth as unknown as Mock).mockResolvedValue({ user: { id: "1" } });
  (listPhotos as unknown as Mock).mockResolvedValue({ photos: [] });
});

describe("GET /api/photos", () => {
  it("applies defaults", async () => {
    await GET(new Request("http://localhost/api/photos"));
    expect(listPhotos).toHaveBeenCalledWith({
      page: 1,
      pageSize: 24,
      tag: undefined,
      album: undefined,
      q: undefined,
    });
  });

  it("passes filters and clamps pagination", async () => {
    await GET(
      new Request("http://localhost/api/photos?page=-4&pageSize=999&tag=t&album=a&q=x"),
    );
    expect(listPhotos).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      tag: "t",
      album: "a",
      q: "x",
    });
  });

  it("falls back on non-numeric pagination", async () => {
    await GET(new Request("http://localhost/api/photos?page=abc&pageSize=abc"));
    expect(listPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 24 }),
    );
  });
});

describe("POST /api/photos (authenticated)", () => {
  it("creates a photo without tags", async () => {
    (prisma.photo.create as unknown as Mock).mockResolvedValue({ id: "p" });
    const res = await POST(post(valid));
    expect(res.status).toBe(201);
    expect(prisma.photo.create).toHaveBeenCalledWith({
      data: { ...valid, tags: undefined },
    });
  });

  it("connects or creates tags", async () => {
    (prisma.photo.create as unknown as Mock).mockResolvedValue({ id: "p" });
    await POST(post({ ...valid, tagNames: ["snow"] }));
    const { data } = (prisma.photo.create as unknown as Mock).mock.calls[0][0];
    expect(data.tags.create[0].tag.connectOrCreate).toEqual({
      where: { name: "snow" },
      create: { name: "snow" },
    });
  });

  it("returns 400 for invalid input", async () => {
    expect((await POST(post({ alt: "" }))).status).toBe(400);
  });

  it("returns 409 on unique violation", async () => {
    (prisma.photo.create as unknown as Mock).mockRejectedValue(p2002());
    expect((await POST(post(valid))).status).toBe(409);
  });

  it("rethrows unexpected errors", async () => {
    (prisma.photo.create as unknown as Mock).mockRejectedValue(new Error("boom"));
    await expect(POST(post(valid))).rejects.toThrow("boom");
  });
});
