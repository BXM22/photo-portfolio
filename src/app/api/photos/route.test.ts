import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    photo: { create: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { POST } from "./route";
import type { Mock } from "vitest";

describe("POST /api/photos", () => {
  beforeEach(() => {
    (auth as unknown as Mock).mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    const response = await POST(
      new Request("http://localhost/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageKey: "photos/2026/09/a.jpg",
          alt: "Lake",
          width: 682,
          height: 1024,
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
