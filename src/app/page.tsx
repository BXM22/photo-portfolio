// ============================================================================
// HOME PAGE — the public gallery.
// ============================================================================
// This is an `async` Server Component: it runs on the server, awaits data
// directly from the database (via src/lib/queries.ts — no HTTP round trip
// to our own API needed), and streams the finished HTML to the browser.
// Compare this to the old "fetch from your own API in useEffect" pattern —
// there's no client-side loading spinner needed for the initial view at
// all, because the data is already baked into the HTML by the time it
// arrives.
// ============================================================================

import { getPhotos, getTags } from "@/lib/queries";
import PhotoGrid from "@/components/PhotoGrid";
import TagFilter from "@/components/TagFilter";
import SearchBar from "@/components/SearchBar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  // `searchParams` is a Promise in the App Router (as of Next.js 15+) —
  // this is what lets Next.js start rendering static parts of the page
  // (like the layout) before the dynamic, request-specific parts (like
  // "what did the user search for?") are even known.
  const { tag, q } = await searchParams;

  // Fetching in parallel with Promise.all instead of two sequential
  // `await`s cuts the total wait time roughly in half — both queries hit
  // the database at the same time instead of one after the other.
  const [photos, tags] = await Promise.all([
    getPhotos({ tag, query: q }),
    getTags(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TagFilter tags={tags} />
        <SearchBar />
      </div>
      <PhotoGrid photos={photos} />
    </div>
  );
}
