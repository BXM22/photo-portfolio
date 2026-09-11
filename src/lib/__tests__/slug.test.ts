// ============================================================================
// UNIT TESTS — src/lib/slug.ts
// ============================================================================
// LEARNING NOTE: `slugify`/`uniqueSlug` are pure functions (same input
// always produces the same output, no database or network calls) — exactly
// the kind of code that's cheapest to unit test, since there's nothing to
// mock. Business logic like this (as opposed to, say, a React component's
// rendering) is usually the highest-value place to start writing tests.
// ============================================================================

import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates a normal title", () => {
    expect(slugify("Iceland 2025")).toBe("iceland-2025");
  });

  it("strips punctuation", () => {
    expect(slugify("Iceland 2025 (Summer Trip)!")).toBe("iceland-2025-summer-trip");
  });

  it("collapses repeated whitespace/hyphens", () => {
    expect(slugify("Golden   Gate -- Bridge")).toBe("golden-gate-bridge");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Portraits--  ")).toBe("portraits");
  });
});

describe("uniqueSlug", () => {
  it("returns the plain slug when there's no collision", () => {
    expect(uniqueSlug("Portraits", ["landscapes", "travel"])).toBe("portraits");
  });

  it("appends -2 on a single collision", () => {
    expect(uniqueSlug("Portraits", ["portraits"])).toBe("portraits-2");
  });

  it("keeps incrementing past multiple collisions", () => {
    expect(uniqueSlug("Portraits", ["portraits", "portraits-2", "portraits-3"])).toBe(
      "portraits-4"
    );
  });
});
