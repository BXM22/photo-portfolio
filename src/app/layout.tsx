import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BXTXM",
  description:
    "A photography practice built around quiet landscapes and the moments just before or after everything happens.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${archivoBlack.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
