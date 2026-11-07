import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/s3", () => ({
  buildStorageKey: vi.fn(),
  createPresignedUploadUrl: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { buildStorageKey, createPresignedUploadUrl } from "@/lib/s3";
import { POST } from "./route";

const req = (body: unknown) =>
  new Request("http://localhost/api/upload", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/upload (authenticated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as Mock).mockResolvedValue({ user: { id: "1" } });
    (buildStorageKey as unknown as Mock).mockReturnValue("photos/k.jpg");
    (createPresignedUploadUrl as unknown as Mock).mockResolvedValue("https://u");
  });

  it("returns key and url for a jpeg", async () => {
    const res = await POST(req({ contentType: "image/jpeg", size: 100 }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ key: "photos/k.jpg", url: "https://u" });
    expect(buildStorageKey).toHaveBeenCalledWith("photo.jpg");
    expect(createPresignedUploadUrl).toHaveBeenCalledWith("photos/k.jpg", "image/jpeg");
  });

  it("derives the extension from other content types", async () => {
    await POST(req({ contentType: "image/png", size: 100 }));
    expect(buildStorageKey).toHaveBeenCalledWith("photo.png");
  });

  it("rejects disallowed content types", async () => {
    const res = await POST(req({ contentType: "text/html", size: 100 }));
    expect(res.status).toBe(400);
  });

  it("rejects files over the size limit", async () => {
    const res = await POST(req({ contentType: "image/png", size: 11 * 1024 * 1024 }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    expect((await POST(req("{bad"))).status).toBe(400);
  });
});
