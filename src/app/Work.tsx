"use client";

import Image, { type StaticImageData } from "next/image";
import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import PhotoDialog, { type Photo } from "@/components/PhotoDialog";
import styles from "@/styles/Work.module.css";

export type Location = {
  id: string;
  title: string;
  year: string;
  left: Photo;
  center: Photo;
  right: Photo;
};

function shotsOf(location: Location): Photo[] {
  return [location.left, location.center, location.right];
}

function shotRatio(shot: Photo): string {
  if (typeof shot.src !== "string") {
    const image = shot.src as StaticImageData;
    return `${image.width} / ${image.height}`;
  }
  return `${shot.width ?? 1} / ${shot.height ?? 1}`;
}

function ShotFrame({
  shot,
  className,
  sizes,
  onOpen,
  children,
}: {
  shot: Photo;
  className: string;
  sizes: string;
  onOpen?: () => void;
  children?: ReactNode;
}) {
  const style = {
    "--shot-ratio": shotRatio(shot),
  } as CSSProperties;
  const media = (
    <>
      <Image
        src={shot.src}
        alt={shot.alt}
        fill
        sizes={sizes}
        className={styles.image}
      />
      {children}
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        aria-label={shot.alt}
        onClick={onOpen}
      >
        {media}
      </button>
    );
  }

  return (
    <div className={className} style={style}>
      {media}
    </div>
  );
}

function LocationSlide({
  location,
  clone = false,
  onOpenShot,
}: {
  location: Location;
  clone?: boolean;
  onOpenShot?: (shotIndex: number) => void;
}) {
  const titleId = clone ? undefined : `${location.id}-title`;

  return (
    <article
      className={styles.slide}
      aria-labelledby={titleId}
      aria-hidden={clone || undefined}
      inert={clone || undefined}
    >
      <div className={styles.stage}>
        <div className={styles.cluster}>
          <ShotFrame
            shot={location.left}
            className={`${styles.frame} ${styles.side} ${styles.left}`}
            sizes="(max-width: 640px) 24vw, 230px"
            onOpen={onOpenShot ? () => onOpenShot(0) : undefined}
          />
          <ShotFrame
            shot={location.center}
            className={`${styles.frame} ${styles.center}`}
            sizes="(max-width: 640px) 38vw, 360px"
            onOpen={onOpenShot ? () => onOpenShot(1) : undefined}
          >
            <p className={styles.year} aria-hidden="true">
              {location.year}
            </p>
          </ShotFrame>
          <ShotFrame
            shot={location.right}
            className={`${styles.frame} ${styles.side} ${styles.right}`}
            sizes="(max-width: 640px) 24vw, 230px"
            onOpen={onOpenShot ? () => onOpenShot(2) : undefined}
          />
        </div>
        <h2 id={titleId} className={styles.title}>
          {location.title}
        </h2>
      </div>
    </article>
  );
}

function locationFromScroll(
  scrollLeft: number,
  width: number,
  looping: boolean,
  count: number,
) {
  if (!width || count === 0) {
    return 0;
  }

  const raw = Math.round(scrollLeft / width);

  if (!looping) {
    return Math.min(Math.max(raw, 0), count - 1);
  }

  if (raw <= 0) {
    return count - 1;
  }

  if (raw >= count + 1) {
    return 0;
  }

  return raw - 1;
}

const DRAG_THRESHOLD = 10;

export default function Work({ locations }: { locations: Location[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: number;
    x: number;
    scroll: number;
    moved: boolean;
  } | null>(null);
  const skipClickRef = useRef(false);
  const loopable = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [viewer, setViewer] = useState<{ shots: Photo[]; index: number } | null>(
    null,
  );
  const first = locations[0];
  const last = locations[locations.length - 1];

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || locations.length < 2) {
      return;
    }

    const slideWidth = () => el.clientWidth;
    const jumpTo = (index: number) => {
      el.scrollLeft = index * slideWidth();
    };

    const syncActive = () => {
      setActive(
        locationFromScroll(
          el.scrollLeft,
          slideWidth(),
          loopable,
          locations.length,
        ),
      );
    };

    if (loopable) {
      jumpTo(1);
    }
    syncActive();

    let jumping = false;
    const wrap = () => {
      if (!loopable || jumping) {
        return;
      }

      const width = slideWidth();
      if (!width) {
        return;
      }

      const index = Math.round(el.scrollLeft / width);
      const lastReal = locations.length;

      if (index <= 0) {
        jumping = true;
        jumpTo(lastReal);
        jumping = false;
      } else if (index >= lastReal + 1) {
        jumping = true;
        jumpTo(1);
        jumping = false;
      }

      syncActive();
    };

    const supportsScrollEnd = "onscrollend" in window;
    let scrollTimeout = 0;
    const onScroll = () => {
      syncActive();
      if (!supportsScrollEnd) {
        window.clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(wrap, 80);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    if (supportsScrollEnd) {
      el.addEventListener("scrollend", wrap);
    }

    const resize = new ResizeObserver(() => {
      const width = slideWidth();
      if (!width) {
        return;
      }

      jumpTo(Math.round(el.scrollLeft / width));
      syncActive();
    });
    resize.observe(el);

    return () => {
      window.clearTimeout(scrollTimeout);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", wrap);
      resize.disconnect();
    };
  }, [loopable, locations]);

  const goTo = (locationIndex: number) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const offset = loopable ? 1 : 0;
    el.scrollLeft = (locationIndex + offset) * el.clientWidth;
    setActive(locationIndex);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag || drag.id !== event.pointerId) {
      return;
    }

    if (drag.moved) {
      skipClickRef.current = true;
      const width = el.clientWidth;
      if (width) {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        el.scrollTo({
          left: Math.round(el.scrollLeft / width) * width,
          behavior: reduced ? "auto" : "smooth",
        });
      }
    }

    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <section id="work" className={styles.section}>
      <p className={styles.label}>Work</p>
      <div
        ref={scrollerRef}
        className={`${styles.scroller} ${dragging ? styles.dragging : ""}`}
        tabIndex={0}
        aria-label="Locations"
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          const el = scrollerRef.current;
          if (!el) {
            return;
          }
          dragRef.current = {
            id: event.pointerId,
            x: event.clientX,
            scroll: el.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const el = scrollerRef.current;
          const drag = dragRef.current;
          if (!el || !drag || drag.id !== event.pointerId) {
            return;
          }
          const dx = event.clientX - drag.x;
          if (!drag.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD) {
              return;
            }
            drag.moved = true;
            try {
              el.setPointerCapture(event.pointerId);
            } catch {
              /* no active pointer */
            }
            setDragging(true);
          }
          el.scrollLeft = drag.scroll - dx;
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (!skipClickRef.current) {
            return;
          }
          skipClickRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {loopable && last ? (
          <LocationSlide key={`${last.id}-pre`} location={last} clone />
        ) : null}
        {locations.map((location) => (
          <LocationSlide
            key={location.id}
            location={location}
            onOpenShot={(shotIndex) =>
              setViewer({ shots: shotsOf(location), index: shotIndex })
            }
          />
        ))}
        {loopable && first ? (
          <LocationSlide key={`${first.id}-post`} location={first} clone />
        ) : null}
      </div>
      <div className={styles.dots} role="group" aria-label="Select a location">
        {locations.map((location, index) => (
          <button
            key={location.id}
            type="button"
            className={styles.dot}
            aria-label={location.title}
            aria-current={index === active ? "true" : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
      <PhotoDialog
        photos={viewer?.shots ?? []}
        index={viewer?.index ?? null}
        onClose={() => setViewer(null)}
        onIndexChange={(shotIndex) =>
          setViewer((current) =>
            current ? { ...current, index: shotIndex } : current,
          )
        }
      />
    </section>
  );
}
