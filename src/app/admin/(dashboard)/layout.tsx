import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";
import styles from "@/styles/Admin.module.css";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/admin/login" });
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.brand}>BXTXM</p>
        <nav className={styles.nav} aria-label="Admin">
          <Link className={styles.link} href="/admin">
            Sets
          </Link>
          <Link className={styles.link} href="/">
            Site
          </Link>
          <form action={logout}>
            <button className={styles.ghost} type="submit">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
