import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "HomeCost Canada — Ontario tax, affordability & home-cost planner",
    template: "%s · HomeCost Canada",
  },
  description:
    "A guided planner for your Ontario 2026 take-home pay, the home price you qualify for, how long to save a down payment, and your full monthly cost of ownership. Educational demonstration only — not financial advice.",
  applicationName: "HomeCost Canada",
  authors: [{ name: "Anuj Raja" }],
  keywords: [
    "Canadian mortgage calculator",
    "Ontario income tax 2026",
    "home affordability",
    "down payment savings",
    "take-home pay",
  ],
  openGraph: {
    title: "HomeCost Canada — Ontario tax, affordability & home-cost planner",
    description:
      "Know your take-home pay, the home you can afford, and your full monthly cost — built on 2026 Ontario tax rules.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#12140f" },
  ],
};

/** Set the saved theme before first paint to avoid a flash of the wrong theme. */
const themeScript = `(function(){try{var t=localStorage.getItem('afc-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
