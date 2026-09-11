// ============================================================================
// PHOTO GRID (Client Component)
// ============================================================================
// LEARNING NOTE: this component is marked `"use client"` because it needs
// browser-only features — `useState` for which photo is open in the
// lightbox, and click handlers. Everything that DOESN'T need interactivity
// (fetching the initial list of photos) stays in a Server Component
// (src/app/page.tsx) and is passed down as the `photos` prop. This
// "Server Component fetches, Client Component renders + interacts" split is
// the core mental model of the App Router.
// ============================================================================

"use client";

import { useState } from "react";
import PhotoCard from "@/components/PhotoCard";
import Lightbox from "@/components/Lightbox";
import type { ShapedPhoto } from "@/lib/queries";

export default function PhotoGrid({ photos }: { photos: ShapedPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="py-16 text-center text-neutral-500">
        No photos yet — check back soon, or upload some from{" "}
        <a href="/admin/login" className="underline">
          the admin dashboard
        </a>
        .
      </p>
    );
  }

  return (
    <>
      {/* `columns-*` (CSS multi-column layout) gives a masonry-style grid
          that respects each photo's real aspect ratio, without a JS
          layout library — good enough for a portfolio site and much
          simpler than reaching for a masonry package. */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <PhotoCard key={photo.id} photo={photo} onClick={() => setActiveIndex(index)} />
        ))}
      </div>

      {activeIndex !== null && (
        <Lightbox
          photos={photos}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </>
  );
}
