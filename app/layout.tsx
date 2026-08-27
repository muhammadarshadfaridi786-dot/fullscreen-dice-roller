import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Schema from "@/app/components/Schema";
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
  title: "Fullscreen Dice Roller – Roll Virtual Dice Online | Free & Instant",
  description:
    "Roll a virtual dice online in fullscreen mode. Free online dice roller for board games, classrooms, and probability. Click to roll – instant random results from 1 to 6.",
  keywords:
    "fullscreen dice roller, online dice roller, virtual dice, roll a dice online, random dice, dice for classroom, free dice roller, dice probability, roll dice online free",
  openGraph: {
    title: "Fullscreen Dice Roller – Roll Virtual Dice Online",
    description:
      "Free fullscreen dice roller for board games, classrooms & probability. Click the dice for instant random results.",
    url: "https://fullscreen-dice-roller.vercel.app",
    siteName: "Fullscreen Dice Roller",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fullscreen Dice Roller – Roll Virtual Dice Online",
    description:
      "Free fullscreen dice roller for board games, classrooms & probability. Click the dice for instant random results.",
  },
  alternates: {
    canonical: "https://fullscreen-dice-roller.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Schema />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
