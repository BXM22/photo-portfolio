// ============================================================================
// PHOTO CARD
// ============================================================================
// LEARNING NOTE: `next/image` is doing a lot of work here that a plain
// `<img>` tag would not:
//   - Serves a correctly-sized version of the image for the viewer's
//     screen/device pixel ratio instead of always sending the full-res file.
//   - Lazy-loads images that are off-screen automatically.
//   - Uses `width`/`height` (which we stored in the database at upload
//     time — see prisma/schema.prisma) to reserve the right amount of space
//     BEFORE the image loads, preventing content from jumping around
//     ("layout shift") as photos pop in.
//   - `placeholder="blur"` shows the tiny pre-generated `blurDataUrl` while
//     the real image streams in, instead of a blank gray box.
// ============================================================================

import Image from "next/image";
import type { ShapedPhoto } from "@/lib/queries";

export default function PhotoCard({
  photo,
  onClick,
}: {
  photo: ShapedPhoto;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg bg-neutral-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:bg-neutral-800"
    >
      <Image
        src={photo.url}
        alt={photo.title || "Untitled photo"}
        width={photo.width}
        height={photo.height}
        // `sizes` tells the browser roughly how wide the image will be
        // rendered at each breakpoint, so it can pick the right file from
        // next/image's auto-generated srcset instead of guessing.
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        placeholder={photo.blurDataUrl ? "blur" : "empty"}
        blurDataURL={photo.blurDataUrl ?? undefined}
        className="h-auto w-full transition-opacity hover:opacity-90"
      />
    </button>
  );
}
