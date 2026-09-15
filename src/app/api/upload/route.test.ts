import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/s3", () => ({
  buildStorageKey: vi.fn(),
  createPresignedUploadUrl: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { POST } from "./route";
import type { Mock } from "vitest";

describe("POST /api/upload", () => {
  beforeEach(() => {
    (auth as unknown as Mock).mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "image/jpeg", size: 1024 }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
