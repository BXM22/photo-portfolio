"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import styles from "@/styles/Admin.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className={styles.login}>
      <form className={styles.loginForm} onSubmit={onSubmit}>
        <p className={styles.label}>Admin</p>
        <h1 className={styles.title}>Sign in</h1>
        <label className={styles.field}>
          <span>Email</span>
          <input
            className={styles.input}
            type="email"
            name="email"
            autoComplete="username"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
