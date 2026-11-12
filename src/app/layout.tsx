import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, Silkscreen } from "next/font/google";
import "./globals.css";

// Self-hosted at build time, so the offline kiosk never fetches fonts at runtime.
const pixel = Silkscreen({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-silkscreen", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: "wiTTy's Translation Rescue · SG Translate 2.0",
  description:
    "A 2-minute arcade game about faster, easier and more consistent government translation with SG Translate 2.0.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eff5e1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-SG" className={`h-full ${pixel.variable} ${jakarta.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
