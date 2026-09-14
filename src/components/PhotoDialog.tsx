"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import styles from "@/styles/PhotoDialog.module.css";

export type Photo = {
  src: StaticImageData;
  alt: string;
};

export default function PhotoDialog({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = index !== null;
  const photo = open ? photos[index] : null;
  const showNav = photos.length > 1;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) {
      return;
    }

    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const step = (delta: number) => {
    if (index === null || photos.length < 2) {
      return;
    }

    onIndexChange((index + delta + photos.length) % photos.length);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={photo ? "photo-caption" : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          step(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          step(-1);
        }
      }}
    >
      {photo ? (
        <>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4.2 4.2 15.8 15.8M15.8 4.2 4.2 15.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {showNav ? (
            <button
              type="button"
              className={`${styles.nav} ${styles.prev}`}
              onClick={() => step(-1)}
              aria-label="Previous photo"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M12.5 4.5 7 10l5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
          <figure className={styles.figure}>
            <div className={styles.imageWrap}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="100vw"
                className={styles.image}
                priority
              />
            </div>
            <figcaption id="photo-caption" className={styles.caption}>
              {photo.alt}
            </figcaption>
          </figure>
          {showNav ? (
            <button
              type="button"
              className={`${styles.nav} ${styles.next}`}
              onClick={() => step(1)}
              aria-label="Next photo"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M7.5 4.5 13 10l-5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </>
      ) : null}
    </dialog>
  );
}
