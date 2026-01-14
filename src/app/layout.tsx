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
      { url: '/santapalabra-logoSinLeyenda.ico', sizes: 'any' }
    ],
    shortcut: '/santapalabra-logoSinLeyenda.ico'
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
        <meta name="theme-color" content="#eab308" />
        <meta name="msapplication-TileColor" content="#eab308" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="min-h-screen">
          <AppChrome>{children}</AppChrome>
        </main>



        <SpeedInsights />
      </body>
    </html>
  );
}
