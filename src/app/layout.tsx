import type { Metadata, Viewport } from "next";
import { Fraunces, Inter_Tight, Parisienne } from "next/font/google";

import "./globals.css";

// Display face. The SOFT and WONK axes are what stop this reading as a
// stock serif — they are used on the signature lines only.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK"],
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
  themeColor: "#3e362e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${fraunces.variable} ${interTight.variable} ${parisienne.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
