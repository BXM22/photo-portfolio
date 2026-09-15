import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    album: { findUnique: vi.fn() },
  },
}));

import { slugify } from "@/lib/slug";

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
