import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
  themeColor: "#060d26",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-SG" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
