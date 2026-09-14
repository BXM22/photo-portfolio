"use client";

import Image from "next/image";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import PhotoDialog, { type Photo } from "@/components/PhotoDialog";
import lake from "@/assets/tetons-lake.jpg";
import meadow from "@/assets/tetons-meadow.jpg";
import grouse from "@/assets/tetons-grouse.jpg";
import umeda from "@/assets/japan-umeda.jpg";
import street from "@/assets/japan-street.jpg";
import silhouette from "@/assets/japan-silhouette.jpg";
import styles from "@/styles/Work.module.css";

type Shot = Photo;

type Location = {
  id: string;
  title: string;
  year: string;
  left: Shot;
  center: Shot;
  right: Shot;
};

const locations: Location[] = [
  {
    id: "tetons",
    title: "GRAND TETONS",
    year: "2026",
    left: {
      src: meadow,
      alt: "Sagebrush meadow in front of a cloud-covered mountain range",
    },
    center: {
      src: grouse,
      alt: "Grouse standing in forest undergrowth",
    },
    right: {
      src: lake,
      alt: "Still lake between two granite peaks, with forest along the shore",
    },
  },
  {
    id: "japan",
    title: "JAPAN",
    year: "2026",
    left: {
      src: street,
      alt: "Crowded night street in Japan, photographed in black and white",
    },
    center: {
      src: umeda,
      alt: "Looking up at the Umeda Sky Building circular aperture against the sky",
    },
    right: {
      src: silhouette,
      alt: "Silhouette of a person against a night city skyline",
    },
  },
];

function shotsOf(location: Location): Shot[] {
  return [location.left, location.center, location.right];
}

function ShotFrame({
  shot,
  className,
  sizes,
  onOpen,
  children,
}: {
  shot: Shot;
  className: string;
  sizes: string;
  onOpen?: () => void;
  children?: ReactNode;
}) {
  const style = {
    "--shot-ratio": `${shot.src.width} / ${shot.src.height}`,
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

function locationFromScroll(scrollLeft: number, width: number, looping: boolean) {
  if (!width) {
    return 0;
  }

  const raw = Math.round(scrollLeft / width);
  const count = locations.length;

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

export default function Work() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [loopable, setLoopable] = useState(false);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<{ shots: Shot[]; index: number } | null>(
    null,
  );
  const first = locations[0];
  const last = locations[locations.length - 1];

  useLayoutEffect(() => {
    setLoopable(true);
  }, []);

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
      setActive(locationFromScroll(el.scrollLeft, slideWidth(), loopable));
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
  }, [loopable]);

  const goTo = (locationIndex: number) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const offset = loopable ? 1 : 0;
    el.scrollLeft = (locationIndex + offset) * el.clientWidth;
    setActive(locationIndex);
  };

  return (
    <section id="work" className={styles.section}>
      <p className={styles.label}>Work</p>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        tabIndex={0}
        aria-label="Locations"
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
