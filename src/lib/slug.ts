import { prisma } from "@/lib/prisma";

/** "GRAND TETONS" → "grand-tetons" */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "album";
}

/**
 * Unique in Album.slug. Pass excludeId on PATCH so renaming
 * "Japan" does not collide with its own existing row.
 */
export async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title);
  let slug = base;
  let n = 2;

  while (true) {
    const existing = await prisma.album.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) {
      return slug;
    }
    slug = `${base}-${n}`;
    n += 1;
  }
}