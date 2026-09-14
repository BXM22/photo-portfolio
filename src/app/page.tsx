import Image from "next/image";
import hero from "@/assets/hero.jpg";
import Navbar from "@/components/Navbar";
import Work from "./Work";
import Contact from "./Contact";
import styles from "@/styles/page.module.css";

const INSTAGRAM_URL = "https://www.instagram.com/bxtxm_photos/";

export default function Home() {
  return (
    <main>
      <a className={styles.skipLink} href="#about">
        Skip to about
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
          <p className={styles.brand}>BXTXM</p>
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
            A photography practice built around quiet landscapes and the moments
            just before or after everything happens.
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
          <div className={styles.aboutHeading}>
            <p className={styles.aboutLabel}>About</p>
            <h2 className={styles.aboutTitle}>
              I TAKE A
              <br />
              LOT OF PHOTOS
            </h2>
          </div>
          <div className={styles.aboutCopy}>
            <p className={styles.aboutBody}>
            I'm a photographer with a real love for nature, street scenes, and the candid, 
            unscripted moments in between, plus the occasional portraits. 
            This is where I share the world as I see it through my lens: 
            wild landscapes, city life caught off guard, and the small moments 
            that usually go unnoticed.
            </p>
          </div>
        </div>
      </section>
      <Work />
      <Contact />
    </main>
  );
}
