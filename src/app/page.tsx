import Image, { type StaticImageData } from "next/image";
import hero from "@/assets/hero.jpg";
import about from "@/assets/about.jpg";
import lake from "@/assets/tetons-lake.jpg";
import street from "@/assets/japan-street.jpg";
import sunset from "@/assets/contact-orbit-2.jpg";
import Navbar from "@/components/Navbar";
import Work from "./Work";
import Contact from "./Contact";
import styles from "@/styles/page.module.css";

const aboutShots: { src: StaticImageData; alt: string; position?: string }[] = [
  {
    src: lake,
    alt: "Still lake between two granite peaks, with forest along the shore",
  },
  {
    src: about,
    alt: "Hand holding a phone, taking a group selfie on a lawn at dusk under string lights",
    position: "58% 28%",
  },
  {
    src: street,
    alt: "Crowded night street in Japan, photographed in black and white",
  },
];

export default function Home() {
  return (
    <main>
      <a className={styles.skipLink} href="#work">
        Skip to work
      </a>

      <section className={styles.hero}>
        <div className={styles.heroImageWrap}>
          <Image
            src={hero}
            alt="People standing on a still salt lake, with mountains reflected in the water"
            fill
            fetchPriority="high"
            loading="eager"
            placeholder="blur"
            sizes="100vw"
            className={styles.heroImage}
          />
        </div>
        <div aria-hidden="true" className={styles.heroOverlay} />

        <nav
          aria-label="Primary"
          className={`${styles.heroEnter} ${styles.nav}`}
        >
          <p className={styles.brand}>Brennen Meregillano</p>
          <Navbar />
        </nav>

        <div className={styles.heroIntro}>
          <h1
            className={`${styles.heroEnter} ${styles.heroEnterDelay1} ${styles.heroTitle}`}
          >
            Still water
            <br />
            Still light
          </h1>
          <p
            className={`${styles.heroEnter} ${styles.heroEnterDelay2} ${styles.heroLead}`}
          >
            A photography practice built on vibes pretty much.
          </p>
        </div>

        <div className={styles.heroWordmarkWrap}>
          <p
            aria-hidden="true"
            className={`${styles.heroEnter} ${styles.heroEnterDelay3} ${styles.heroWordmark}`}
          >
            BXTXM
          </p>
        </div>
      </section>

      <section id="about" className={styles.about}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutIntro}>
            <span className={styles.aboutMark} aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path
                  fill="currentColor"
                  d="M15.2 2h1.6v12.05l8.52-8.52 1.13 1.13-8.52 8.52H30v1.6H17.93l8.52 8.52-1.13 1.13-8.52-8.52V30h-1.6V17.93l-8.52 8.52-1.13-1.13 8.52-8.52H2v-1.6h12.05L5.53 7.66 6.66 6.53l8.52 8.52V2Z"
                />
              </svg>
            </span>
            <div className={styles.aboutHeading}>
              <h2 className={styles.aboutTitle}>
                I take a lot of
                <br />
                photos
                <span className={styles.aboutInline}>
                  <Image
                    src={sunset}
                    alt=""
                    fill
                    sizes="80px"
                    className={styles.aboutInlineImage}
                  />
                </span>
                that
                <br />
                <span className={styles.aboutMuted}>catch the</span>
                <br />
                candid world
              </h2>
              <p className={styles.aboutBody}>
                I&apos;m a photographer with a real love for nature, street
                scenes, and the candid, unscripted moments in between, plus the
                occasional portraits. This is where I share the world as I see
                it through my lens: wild landscapes, city life caught off
                guard, and the small moments that usually go unnoticed.
              </p>
            </div>
          </div>

          <div className={styles.aboutFooter}>
            <p className={styles.aboutLabel}>
              About
              <br />
              the work
            </p>
            <div className={styles.aboutShots}>
              {aboutShots.map((shot) => (
                <div key={shot.src.src} className={styles.aboutShot}>
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 720px) 30vw, 280px"
                    placeholder="blur"
                    className={styles.aboutImage}
                    style={
                      shot.position
                        ? { objectPosition: shot.position }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Work />
      <Contact />
    </main>
  );
}
