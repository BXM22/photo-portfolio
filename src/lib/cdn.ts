export function publicUrlForKey(key: string): string {
  const base = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/$/, "");
  const path = key.replace(/^\//, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}
