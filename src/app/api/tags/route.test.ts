import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { tag: { create: vi.fn() } } }));
vi.mock("@/lib/queries", () => ({ listTags: vi.fn() }));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listTags } from "@/lib/queries";
import { GET, POST } from "./route";

const m = (f: unknown) => f as Mock;
const post = (body: unknown) =>
  new Request("http://localhost/api/tags", {
    method: "POST",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  m(auth).mockResolvedValue({ user: { id: "1" } });
});

describe("/api/tags", () => {
  it("GET lists tags", async () => {
    m(listTags).mockResolvedValue([{ id: "t", name: "snow" }]);
    const res = await GET();
    await expect(res.json()).resolves.toEqual([{ id: "t", name: "snow" }]);
  });

  it("POST returns 401 when unauthenticated", async () => {
    m(auth).mockResolvedValue(null);
    expect((await POST(post({ name: "a" }))).status).toBe(401);
  });

  it("POST returns 400 for a blank name", async () => {
    expect((await POST(post({ name: "   " }))).status).toBe(400);
  });

  it("POST creates a trimmed tag", async () => {
    m(prisma.tag.create).mockResolvedValue({ id: "t", name: "snow" });
    const res = await POST(post({ name: " snow " }));
    expect(res.status).toBe(201);
    expect(prisma.tag.create).toHaveBeenCalledWith({ data: { name: "snow" } });
  });

  it("POST returns 409 for duplicates", async () => {
    m(prisma.tag.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "6",
      }),
    );
    expect((await POST(post({ name: "snow" }))).status).toBe(409);
  });

  it("POST rethrows unexpected errors", async () => {
    m(prisma.tag.create).mockRejectedValue(new Error("boom"));
    await expect(POST(post({ name: "snow" }))).rejects.toThrow("boom");
  });
});
