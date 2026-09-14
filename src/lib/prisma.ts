import { PrismaClient } from "@prisma/client";

// Next.js hot-reloads this module on every save. Attach the client to
// globalThis so each reload reuses the same Postgres connection instead
// of opening a new one.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reuse the cached client if it exists; otherwise create one.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Cache only in development. Production is a long-lived process, so one
// client per process is enough and we do not want it on the global object.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
