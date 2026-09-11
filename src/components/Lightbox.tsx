// ============================================================================
// LIGHTBOX (Client Component)
// ============================================================================
// A full-screen photo viewer with keyboard (←/→/Esc) and click navigation.
// Kept dependency-free and simple on purpose — plenty of npm packages do
// this, but building one yourself is a good exercise in managing keyboard
// events and focus with `useEffect`.
// ============================================================================

"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import type { ShapedPhoto } from "@/lib/queries";

export default function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: ShapedPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const photo = photos[index];

  const goNext = useCallback(
    () => onNavigate((index + 1) % photos.length),
    [index, photos.length, onNavigate]
  );
  const goPrev = useCallback(
    () => onNavigate((index - 1 + photos.length) % photos.length),
    [index, photos.length, onNavigate]
  );

  // Wire up keyboard navigation while the lightbox is open, and clean it up
  // when it closes — the classic `useEffect` + cleanup-function pattern for
  // subscribing to something outside React (here, the `document`'s
  // keydown events).
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-2xl text-white/80 hover:text-white"
        aria-label="Close"
      >
        ✕
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
        className="absolute left-4 text-3xl text-white/70 hover:text-white"
        aria-label="Previous photo"
      >
        ‹
      </button>

      {/* Stop propagation so clicking the image itself doesn't trigger the
          backdrop's onClose handler. */}
      <div onClick={(e) => e.stopPropagation()} className="relative max-h-[85vh] max-w-5xl">
        <Image
          src={photo.url}
          alt={photo.title || "Untitled photo"}
          width={photo.width}
          height={photo.height}
          sizes="100vw"
          className="max-h-[85vh] w-auto object-contain"
          priority
        />
        {(photo.title || photo.description) && (
          <div className="mt-3 text-center text-white">
            {photo.title && <p className="font-medium">{photo.title}</p>}
            {photo.description && (
              <p className="text-sm text-white/70">{photo.description}</p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        className="absolute right-4 text-3xl text-white/70 hover:text-white"
        aria-label="Next photo"
      >
        ›
      </button>
    </div>
  );
}
