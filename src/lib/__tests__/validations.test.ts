// ============================================================================
// UNIT TESTS — src/lib/validations.ts
// ============================================================================
// LEARNING NOTE: testing Zod schemas directly (rather than only testing
// them indirectly through a full API route) lets you pin down EXACTLY which
// inputs are accepted/rejected and why, quickly, with no database or HTTP
// server involved.
// ============================================================================

import { describe, it, expect } from "vitest";
import { createAlbumSchema, presignRequestSchema, createPhotoSchema } from "@/lib/validations";

describe("createAlbumSchema", () => {
  it("accepts a valid title", () => {
    const result = createAlbumSchema.safeParse({ title: "Iceland 2025" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createAlbumSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing title entirely", () => {
    const result = createAlbumSchema.safeParse({ description: "no title here" });
    expect(result.success).toBe(false);
  });
});

describe("presignRequestSchema", () => {
  it("accepts a reasonably-sized JPEG", () => {
    const result = presignRequestSchema.safeParse({
      filename: "sunset.jpg",
      contentType: "image/jpeg",
      size: 2_000_000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a disallowed content type", () => {
    const result = presignRequestSchema.safeParse({
      filename: "script.svg",
      contentType: "image/svg+xml",
      size: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file over the 20MB limit", () => {
    const result = presignRequestSchema.safeParse({
      filename: "huge.png",
      contentType: "image/png",
      size: 25 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });
});

describe("createPhotoSchema", () => {
  it("requires positive integer dimensions", () => {
    const result = createPhotoSchema.safeParse({
      storageKey: "photos/2026/09/abc.jpg",
      width: -100,
      height: 600,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal valid payload", () => {
    const result = createPhotoSchema.safeParse({
      storageKey: "photos/2026/09/abc.jpg",
      width: 1600,
      height: 900,
    });
    expect(result.success).toBe(true);
  });
});
