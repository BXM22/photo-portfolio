// ============================================================================
// E2E SMOKE TEST — the public gallery loads and the admin area is guarded.
// ============================================================================
// These are intentionally shallow "smoke tests": they verify the app boots
// and the most important pages render at all, rather than testing every
// interaction in detail. This is the highest-value place to start with E2E
// tests — catching "the whole site is down" is more urgent than catching
// small UI bugs.
// ============================================================================

import { test, expect } from "@playwright/test";

test("homepage loads and shows the gallery nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Photo Portfolio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Albums" })).toBeVisible();
});

test("albums page loads", async ({ page }) => {
  await page.goto("/albums");
  await expect(page).toHaveURL(/\/albums$/);
});

test("visiting an admin page while logged out redirects to login", async ({ page }) => {
  await page.goto("/admin");
  // src/proxy.ts should have redirected us before the dashboard ever renders.
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("admin login page renders the sign-in form", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
});
