import { afterEach, describe, expect, it, vi } from "vitest";
import { publicUrlForKey } from "@/lib/cdn";
import { buildStorageKey } from "@/lib/s3";

describe("s3 helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds a server-side key and ignores the client path", () => {
    const key = buildStorageKey("../../etc/passwd.png");
    expect(key).toMatch(/^photos\/\d{4}\/\d{2}\/[0-9a-f-]+\.png$/);
    expect(key.includes("..")).toBe(false);
  });

  it("derives the public URL from the CDN base", () => {
    vi.stubEnv("NEXT_PUBLIC_CDN_URL", "https://cdn.example.com/");
    expect(publicUrlForKey("photos/a.jpg")).toBe(
      "https://cdn.example.com/photos/a.jpg",
    );
  });

  it("keeps seeded files on this origin even when a CDN is set", () => {
    vi.stubEnv("NEXT_PUBLIC_CDN_URL", "https://cdn.example.com");
    expect(publicUrlForKey("seed/tetons/lake.jpg")).toBe(
      "/seed/tetons/lake.jpg",
    );
  });

});
