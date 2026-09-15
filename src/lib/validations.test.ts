import { describe, expect, it } from "vitest";
import { albumCreateSchema, photoCreateSchema, uploadSchema } from "@/lib/validations";

const photo = {
  storageKey: "photos/2026/09/a.jpg",
  alt: "Lake",
  width: 682,
  height: 1024,
};

describe("uploadSchema", () => {
  it("rejects files that are too large", () => {
    const result = uploadSchema.safeParse({
      contentType: "image/jpeg",
      size: 20 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });
});

describe("albumCreateSchema", () => {
  it("requires three distinct slots", () => {
    const ok = albumCreateSchema.safeParse({
      title: "JAPAN",
      year: "2026",
      photos: [
        { ...photo, slot: "left" },
        { ...photo, storageKey: "photos/2026/09/b.jpg", slot: "center" },
        { ...photo, storageKey: "photos/2026/09/c.jpg", slot: "right" },
      ],
    });
    expect(ok.success).toBe(true);

    const duplicate = albumCreateSchema.safeParse({
      title: "JAPAN",
      year: "2026",
      photos: [
        { ...photo, slot: "left" },
        { ...photo, storageKey: "photos/2026/09/b.jpg", slot: "left" },
        { ...photo, storageKey: "photos/2026/09/c.jpg", slot: "right" },
      ],
    });
    expect(duplicate.success).toBe(false);

    const short = albumCreateSchema.safeParse({
      title: "JAPAN",
      year: "2026",
      photos: [
        { ...photo, slot: "left" },
        { ...photo, storageKey: "photos/2026/09/b.jpg", slot: "center" },
      ],
    });
    expect(short.success).toBe(false);
  });
});

describe("photoCreateSchema", () => {
  it("requires storage key, alt, and dimensions", () => {
    expect(photoCreateSchema.safeParse(photo).success).toBe(true);
    expect(photoCreateSchema.safeParse({ ...photo, alt: "" }).success).toBe(
      false,
    );
  });
});
