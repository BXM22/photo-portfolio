// ============================================================================
// DATABASE SEED SCRIPT
// ============================================================================
// Run with `npm run db:seed`. Creates the one admin user this site needs,
// reading credentials from environment variables so a real password is
// never hard-coded into a file that gets committed to git.
//
// LEARNING NOTE: this is also a good template for seeding sample data
// (a few albums/photos) if you want the gallery to look populated before
// you've uploaded real photos — see the commented-out example at the
// bottom.
// ============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before seeding."
    );
  }

  // `10` is the bcrypt "cost factor" — how many times the hashing
  // algorithm loops internally. Higher = slower to compute = harder to
  // brute-force, but also slower for legitimate logins. 10-12 is the
  // standard range for interactive login forms in 2026.
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Admin" },
  });

  console.log(`Admin user ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
