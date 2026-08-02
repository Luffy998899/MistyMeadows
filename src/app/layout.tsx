import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter_Tight, Parisienne } from "next/font/google";

import "./globals.css";

// Display face. The reference sets every heading in a high-contrast old-style
// serif; Cormorant Garamond is the closest free equivalent, and its lighter
// weights are what let the big centred headings stay elegant rather than
// shouty.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});

// Signature script. Loaded for a handful of words per page, so a single
// weight is all that is needed.
const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-parisienne",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mistymeadowsresorts.com"),
  title: {
    default: "Misty Meadows Resorts — Kasauli Hills, Himachal Pradesh",
    template: "%s · Misty Meadows Resorts",
  },
  description:
    "A star-class resort at 5,800 ft in the Kasauli hills. Valley-facing rooms, a multi-cuisine restaurant and conference facilities at Kumarhatti, Solan.",
  openGraph: {
    type: "website",
    siteName: "Misty Meadows Resorts",
    locale: "en_IN",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08402a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${cormorant.variable} ${interTight.variable} ${parisienne.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
