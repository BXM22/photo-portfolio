import styles from "@/styles/Navbar.module.css";

const links = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Instagram" },
] as const;

export default function Navbar() {
  return (
    <ul className={styles.list}>
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href} className={styles.link}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
