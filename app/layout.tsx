import type { Metadata, Viewport } from "next";
import { satoshi, timesRoman, unbounded } from "./fonts";
import "./globals.css";
import Providers from "@/contexts/Providers";
import SharedShell from "@/components/SharedShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6C63FF",
};

export const metadata: Metadata = {
  title: "Ambi Tasker | Smart Service Booking Platform",
  description: "Ambi Tasker is a modern service booking platform connecting customers with trusted local service providers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ambi Tasker",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${satoshi.variable} ${timesRoman.variable} ${unbounded.variable} ${satoshi.className} font-sans antialiased text-text bg-background text-base`}
        suppressHydrationWarning
      >
        <Providers>
          <SharedShell>{children}</SharedShell>
        </Providers>
      </body>
    </html>
  );
}
