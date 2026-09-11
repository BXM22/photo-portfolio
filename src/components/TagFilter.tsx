// ============================================================================
// TAG FILTER (Client Component)
// ============================================================================
// LEARNING NOTE: this is a common pattern called "URL as state" — instead
// of storing "which tag is selected" in a `useState`, we store it in the
// URL's query string (?tag=landscape) using Next's router. Benefits:
//   - The filtered view is shareable/bookmarkable (paste the URL, get the
//     same filter).
//   - Back/forward browser buttons work correctly.
//   - The Server Component page (src/app/page.tsx) can read the filter
//     straight from `searchParams` and do the actual filtering query on
//     the server — no client-side re-fetch needed for the FIRST render of
//     a filtered view (e.g. following a shared link).
// ============================================================================

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function TagFilter({
  tags,
}: {
  tags: { slug: string; name: string; photoCount: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  function selectTag(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("tag", slug);
    } else {
      params.delete("tag");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => selectTag(null)}
        className={`rounded-full px-3 py-1 text-sm ${
          !activeTag
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.slug}
          type="button"
          onClick={() => selectTag(tag.slug)}
          className={`rounded-full px-3 py-1 text-sm ${
            activeTag === tag.slug
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300"
          }`}
        >
          {tag.name} ({tag.photoCount})
        </button>
      ))}
    </div>
  );
}
