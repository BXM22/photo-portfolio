import { afterEach, describe, expect, it, vi } from "vitest";
import { publicUrlForKey } from "@/lib/cdn";

describe("publicUrlForKey", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("falls back to a local path when no CDN is set", () => {
    vi.stubEnv("NEXT_PUBLIC_CDN_URL", "");
    expect(publicUrlForKey("photos/a.jpg")).toBe("/photos/a.jpg");
  });

  it("strips a leading slash from the key", () => {
    vi.stubEnv("NEXT_PUBLIC_CDN_URL", "https://cdn.example.com");
    expect(publicUrlForKey("/photos/a.jpg")).toBe(
      "https://cdn.example.com/photos/a.jpg",
    );
  });
});
