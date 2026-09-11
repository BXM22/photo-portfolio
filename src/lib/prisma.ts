// ============================================================================
// PRISMA CLIENT SINGLETON
// ============================================================================
// LEARNING NOTE: why not just `export const prisma = new PrismaClient()` at
// the top of every file that needs it?
//
// In development, Next.js hot-reloads your server code on every file save.
// Each reload would normally re-run this module and create a BRAND NEW
// PrismaClient — and each PrismaClient opens its own pool of database
// connections. After a few dozen saves you'd exhaust Postgres's connection
// limit and get cryptic "too many clients already" errors.
//
// The fix: stash the client on the Node.js `global` object, which SURVIVES
// hot reloads (it doesn't survive a full process restart, which is fine —
// production only starts the process once anyway). On the next reload we
// check "is one already sitting on `global`?" and reuse it instead of
// creating a second one.
// ============================================================================

import { PrismaClient } from "@prisma/client";

// TypeScript doesn't know about our custom property on `globalThis` by
// default, so we declare it here. This only affects type-checking — it
// doesn't add anything at runtime.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Logs every query to the console in development so you can see exactly
    // what SQL Prisma generates for each `prisma.photo.findMany(...)` call —
    // genuinely useful for learning how the ORM translates to SQL.
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Only cache on `global` outside production — in production each server
// instance starts fresh exactly once, so there's no hot-reload problem to
// solve, and we don't want the pattern to hide a real bug there.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
