import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import avatar from "@/assets/contact-avatar.jpg";
import orbit1 from "@/assets/contact-orbit-1.jpg";
import orbit2 from "@/assets/contact-orbit-2.jpg";
import orbit3 from "@/assets/contact-orbit-3.jpg";
import orbit4 from "@/assets/contact-orbit-4.jpg";
import orbit5 from "@/assets/contact-orbit-5.jpg";
import styles from "@/styles/Contact.module.css";

const INSTAGRAM_URL = "https://www.instagram.com/bxtxm_photos/";

const orbitPhotos: StaticImageData[] = [orbit1, orbit2, orbit3, orbit4, orbit5];

export default function Contact() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-label">
      <p id="contact-label" className={styles.label}>
        Contact
      </p>
      <div className={styles.inner}>
        <div className={styles.stage}>
          <div className={styles.ring} aria-hidden="true">
            {orbitPhotos.map((src, index) => (
              <div
                key={src.src}
                className={styles.satWrap}
                style={{ "--i": index } as CSSProperties}
              >
                <div className={styles.sat}>
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className={styles.image}
                  />
                </div>
              </div>
            ))}
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.avatar}
          >
            <Image
              src={avatar}
              alt="Person walking across a still salt lake, with mountains under a cloudy sky"
              fill
              sizes="(max-width: 640px) 48vw, 220px"
              placeholder="blur"
              className={styles.avatarImage}
            />
            <span className={styles.overlay}>
              View Instagram
              <span aria-hidden="true">↗</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
