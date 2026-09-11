// ============================================================================
// SLUG UTILITIES
// ============================================================================
// A "slug" is the URL-safe version of a human-readable string, e.g.
// "Iceland 2025 (Summer Trip)!" -> "iceland-2025-summer-trip". We use slugs
// instead of raw database IDs in URLs so links look like
// /albums/iceland-2025 instead of /albums/clh3x9f8a0000wxyz.
// ============================================================================

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Replace any run of characters that ISN'T a-z, 0-9, or a space/hyphen
    // with nothing (strips punctuation like "!" and "(" ")").
    .replace(/[^a-z0-9\s-]/g, "")
    // Collapse whitespace and existing hyphens into a single hyphen.
    .replace(/[\s-]+/g, "-")
    // Trim any leading/trailing hyphen left over from the replacements above.
    .replace(/^-+|-+$/g, "");
}

/**
 * Given a desired slug and a list of slugs that already exist in the
 * database, returns a guaranteed-unique variant by appending "-2", "-3", etc.
 * as needed. This is what makes creating two albums both named "Portraits"
 * safe — the second one becomes "portraits-2" instead of colliding.
 */
export function uniqueSlug(base: string, existing: string[]): string {
  const slug = slugify(base);
  if (!existing.includes(slug)) return slug;

  let counter = 2;
  while (existing.includes(`${slug}-${counter}`)) {
    counter += 1;
  }
  return `${slug}-${counter}`;
}
