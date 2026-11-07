import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    photo: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    photoTag: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DELETE, PATCH } from "./route";

const m = (f: unknown) => f as Mock;
const ctx = { params: Promise.resolve({ id: "p1" }) };
const patch = (body: unknown) =>
  new Request("http://localhost/api/photos/p1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  m(auth).mockResolvedValue({ user: { id: "1" } });
  m(prisma.$transaction).mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma),
  );
});

describe("PATCH /api/photos/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    m(auth).mockResolvedValue(null);
    expect((await PATCH(patch({}), ctx)).status).toBe(401);
  });

  it("returns 400 for invalid input", async () => {
    expect((await PATCH(patch({ width: -1 }), ctx)).status).toBe(400);
  });

  it("returns 404 when the photo does not exist", async () => {
    m(prisma.photo.findUnique).mockResolvedValue(null);
    expect((await PATCH(patch({ alt: "x" }), ctx)).status).toBe(404);
  });

  it("updates fields without touching tags", async () => {
    m(prisma.photo.findUnique).mockResolvedValue({ id: "p1" });
    m(prisma.photo.update).mockResolvedValue({ id: "p1", alt: "x" });
    const res = await PATCH(patch({ alt: "x" }), ctx);
    expect(res.status).toBe(200);
    expect(prisma.photoTag.deleteMany).not.toHaveBeenCalled();
    expect(prisma.photo.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { alt: "x", tags: undefined },
    });
  });

  it("replaces tags when tagNames is provided", async () => {
    m(prisma.photo.findUnique).mockResolvedValue({ id: "p1" });
    m(prisma.photo.update).mockResolvedValue({ id: "p1" });
    await PATCH(patch({ tagNames: ["snow"] }), ctx);
    expect(prisma.photoTag.deleteMany).toHaveBeenCalledWith({
      where: { photoId: "p1" },
    });
    const { data } = m(prisma.photo.update).mock.calls[0][0];
    expect(data.tags.create).toHaveLength(1);
  });

  it("returns 409 on unique violation", async () => {
    m(prisma.photo.findUnique).mockResolvedValue({ id: "p1" });
    m(prisma.photo.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "6",
      }),
    );
    expect((await PATCH(patch({ alt: "x" }), ctx)).status).toBe(409);
  });

  it("rethrows unexpected errors", async () => {
    m(prisma.photo.findUnique).mockResolvedValue({ id: "p1" });
    m(prisma.photo.update).mockRejectedValue(new Error("boom"));
    await expect(PATCH(patch({ alt: "x" }), ctx)).rejects.toThrow("boom");
  });
});

describe("DELETE /api/photos/[id]", () => {
  const del = () =>
    new Request("http://localhost/api/photos/p1", { method: "DELETE" });

  it("returns 401 when unauthenticated", async () => {
    m(auth).mockResolvedValue(null);
    expect((await DELETE(del(), ctx)).status).toBe(401);
  });

  it("returns 404 when missing", async () => {
    m(prisma.photo.findUnique).mockResolvedValue(null);
    expect((await DELETE(del(), ctx)).status).toBe(404);
  });

  it("deletes an existing photo", async () => {
    m(prisma.photo.findUnique).mockResolvedValue({ id: "p1" });
    const res = await DELETE(del(), ctx);
    expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
