import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import { isUnauthorized, requireAdmin } from "@/lib/require-admin";

const authMock = auth as unknown as Mock;

describe("requireAdmin", () => {
  beforeEach(() => authMock.mockReset());

  it("returns a 401 response when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const result = await requireAdmin();
    expect(isUnauthorized(result)).toBe(true);
    expect((result as Response).status).toBe(401);
  });

  it("returns a 401 response when the session has no user", async () => {
    authMock.mockResolvedValue({});
    expect(isUnauthorized(await requireAdmin())).toBe(true);
  });

  it("returns the session when a user exists", async () => {
    const session = { user: { id: "1" } };
    authMock.mockResolvedValue(session);
    const result = await requireAdmin();
    expect(result).toBe(session);
    expect(isUnauthorized(result)).toBe(false);
  });
});
