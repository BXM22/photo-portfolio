import "dotenv/config";
import { PrismaClient, Slot } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const tetons = await prisma.album.upsert({
    where: { slug: "tetons" },
    update: {},
    create: {
      title: "GRAND TETONS",
      slug: "tetons",
      year: "2026",
      sortOrder: 0,
    },
  });

  const japan = await prisma.album.upsert({
    where: { slug: "japan" },
    update: {},
    create: {
      title: "JAPAN",
      slug: "japan",
      year: "2026",
      sortOrder: 1,
    },
  });

  const photos = [
    {
      storageKey: "seed/tetons/meadow.jpg",
      alt: "Sagebrush meadow in front of a cloud-covered mountain range",
      slot: Slot.left,
      albumId: tetons.id,
      width: 819,
      height: 1024,
    },
    {
      storageKey: "seed/tetons/grouse.jpg",
      alt: "Grouse standing in forest undergrowth",
      slot: Slot.center,
      albumId: tetons.id,
      width: 682,
      height: 1024,
    },
    {
      storageKey: "seed/tetons/lake.jpg",
      alt: "Still lake between two granite peaks, with forest along the shore",
      slot: Slot.right,
      albumId: tetons.id,
      width: 682,
      height: 1024,
    },
    {
      storageKey: "seed/japan/street.jpg",
      alt: "Crowded night street in Japan, photographed in black and white",
      slot: Slot.left,
      albumId: japan.id,
      width: 819,
      height: 1024,
    },
    {
      storageKey: "seed/japan/umeda.jpg",
      alt: "Looking up at the Umeda Sky Building circular aperture against the sky",
      slot: Slot.center,
      albumId: japan.id,
      width: 682,
      height: 1024,
    },
    {
      storageKey: "seed/japan/silhouette.jpg",
      alt: "Silhouette of a person against a night city skyline",
      slot: Slot.right,
      albumId: japan.id,
      width: 682,
      height: 1024,
    },
  ] as const;

  for (const photo of photos) {
    await prisma.photo.upsert({
      where: { storageKey: photo.storageKey },
      update: {
        width: photo.width,
        height: photo.height,
        alt: photo.alt,
        slot: photo.slot,
        albumId: photo.albumId,
      },
      create: photo,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
