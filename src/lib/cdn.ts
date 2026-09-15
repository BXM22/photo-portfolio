export function publicUrlForKey(key: string): string {
  const path = key.replace(/^\//, "");
  // Seeded Work files live in /public/seed — never send those through the CDN.
  if (path.startsWith("seed/")) {
    return `/${path}`;
  }

  const base = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/$/, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}

