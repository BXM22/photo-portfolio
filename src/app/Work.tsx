"use client";

import Image, { type StaticImageData } from "next/image";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import lake from "@/assets/tetons-lake.jpg";
import meadow from "@/assets/tetons-meadow.jpg";
import grouse from "@/assets/tetons-grouse.jpg";
import umeda from "@/assets/japan-umeda.jpg";
import street from "@/assets/japan-street.jpg";
import silhouette from "@/assets/japan-silhouette.jpg";
import styles from "@/styles/Work.module.css";

type Shot = {
  src: StaticImageData;
  alt: string;
};

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
      src: lake,
      alt: "Still lake between two granite peaks, with forest along the shore",
    },
    right: {
      src: grouse,
      alt: "Grouse standing in forest undergrowth",
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

function ShotFrame({
  shot,
  className,
  sizes,
  children,
}: {
  shot: Shot;
  className: string;
  sizes: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={className}
      style={
        {
          "--shot-ratio": `${shot.src.width} / ${shot.src.height}`,
        } as CSSProperties
      }
    >
      <Image
        src={shot.src}
        alt={shot.alt}
        fill
        sizes={sizes}
        className={styles.image}
      />
      {children}
    </div>
  );
}

function LocationSlide({
  location,
  clone = false,
}: {
  location: Location;
  clone?: boolean;
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
          />
          <ShotFrame
            shot={location.center}
            className={`${styles.frame} ${styles.center}`}
            sizes="(max-width: 640px) 38vw, 360px"
          >
            <p className={styles.year}>{location.year}</p>
          </ShotFrame>
          <ShotFrame
            shot={location.right}
            className={`${styles.frame} ${styles.side} ${styles.right}`}
            sizes="(max-width: 640px) 24vw, 230px"
          />
        </div>
        <h2 id={titleId} className={styles.title}>
          {location.title}
        </h2>
      </div>
    </article>
  );
}

export default function Work() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [loopable, setLoopable] = useState(false);
  const first = locations[0];
  const last = locations[locations.length - 1];

  useLayoutEffect(() => {
    setLoopable(true);
  }, []);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || !loopable || locations.length < 2) {
      return;
    }

    const slideWidth = () => el.clientWidth;
    const jumpTo = (index: number) => {
      el.scrollLeft = index * slideWidth();
    };

    jumpTo(1);

    let jumping = false;
    const wrap = () => {
      if (jumping) {
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
        return;
      }

      if (index >= lastReal + 1) {
        jumping = true;
        jumpTo(1);
        jumping = false;
      }
    };

    const supportsScrollEnd = "onscrollend" in window;
    let scrollTimeout = 0;
    const onScroll = () => {
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(wrap, 80);
    };

    if (supportsScrollEnd) {
      el.addEventListener("scrollend", wrap);
    } else {
      el.addEventListener("scroll", onScroll, { passive: true });
    }

    const resize = new ResizeObserver(() => {
      const width = slideWidth();
      if (!width) {
        return;
      }

      jumpTo(Math.round(el.scrollLeft / width));
    });
    resize.observe(el);

    return () => {
      window.clearTimeout(scrollTimeout);
      el.removeEventListener("scrollend", wrap);
      el.removeEventListener("scroll", onScroll);
      resize.disconnect();
    };
  }, [loopable]);

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
          <LocationSlide key={location.id} location={location} />
        ))}
        {loopable && first ? (
          <LocationSlide key={`${first.id}-post`} location={first} clone />
        ) : null}
      </div>
    </section>
  );
}
