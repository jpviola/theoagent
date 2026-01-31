import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SantaPalabra.app - Catequista Digital Hispanoamericano",
  description: "Catequista digital católico especializado en la rica espiritualidad hispanoamericana. Con la sabiduría de Santa Teresa de Ávila, San Juan de la Cruz, CELAM y toda la tradición católica.",
  icons: {
    icon: [
      { url: '/santapalabra-logoSinLeyenda.ico', sizes: 'any' },
      { url: '/favicon-96x96.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/santapalabra-logoSinLeyenda.ico',
    apple: [
      { url: '/faviconAndroid-icon-144x144.svg', type: 'image/svg+xml' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SantaPalabra'
  },
  manifest: '/site.webmanifest'
};

// Force dynamic rendering to prevent prerendering issues with Supabase
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/santapalabra-logoSinLeyenda.ico" sizes="any" />
        <link rel="shortcut icon" href="/santapalabra-logoSinLeyenda.ico" />
        <meta name="theme-color" content="#eab308" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content="#eab308" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="apple-touch-icon" href="/faviconAndroid-icon-144x144.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200 overflow-x-hidden`}
      >
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
          <AppChrome>{children}</AppChrome>
        </main>
        
        <SpeedInsights />
      </body>
    </html>
  );
}
