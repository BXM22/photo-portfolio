import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    album: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { slugify, uniqueSlug } from "@/lib/slug";

const findUnique = prisma.album.findUnique as unknown as Mock;

describe("slugify", () => {
  it("turns titles into lowercase hyphenated slugs", () => {
    expect(slugify("GRAND TETONS")).toBe("grand-tetons");
    expect(slugify("Japan")).toBe("japan");
  });

  it("strips accents and punctuation", () => {
    expect(slugify("São Paulo!")).toBe("sao-paulo");
  });

  it("falls back when the title has no letters", () => {
    expect(slugify("@@@")).toBe("album");
  });
});


describe("uniqueSlug", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns the base slug when it is free", async () => {
    findUnique.mockResolvedValue(null);
    await expect(uniqueSlug("Japan")).resolves.toBe("japan");
  });

  it("appends a counter until the slug is free", async () => {
    findUnique
      .mockResolvedValueOnce({ id: "a" })
      .mockResolvedValueOnce({ id: "b" })
      .mockResolvedValueOnce(null);
    await expect(uniqueSlug("Japan")).resolves.toBe("japan-3");
  });

  it("allows the slug owned by excludeId", async () => {
    findUnique.mockResolvedValue({ id: "self" });
    await expect(uniqueSlug("Japan", "self")).resolves.toBe("japan");
  });
});
