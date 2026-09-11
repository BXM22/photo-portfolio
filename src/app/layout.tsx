// ============================================================================
// ROOT LAYOUT
// ============================================================================
// LEARNING NOTE: every route in the App Router is wrapped by the nearest
// layout.tsx file(s) up its folder tree. This root layout wraps the ENTIRE
// app (public gallery AND admin dashboard), so it's the right place for
// truly global things: the <html>/<body> tags, global CSS, fonts, and the
// site-wide navigation bar. Unlike `page.tsx`, a layout does NOT re-render
// when you navigate between pages that share it — React just swaps out
// `children` — which is why layouts are also a performance tool, not just
// an organizational one.
// ============================================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Photo Portfolio",
  description: "A full-stack photo portfolio built with Next.js, PostgreSQL, and S3.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Photo Portfolio
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:underline">
                Gallery
              </Link>
              <Link href="/albums" className="hover:underline">
                Albums
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500 dark:border-neutral-800">
          Built with Next.js, PostgreSQL &amp; Prisma, and S3 — see the README for architecture details.
        </footer>
      </body>
    </html>
  );
}
