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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.svg', sizes: '96x96', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-icon-76x76.svg', sizes: '76x76', type: 'image/svg+xml' }
    ],
    other: [
      { rel: 'icon', url: '/faviconAndroid-icon-144x144.svg', sizes: '144x144', type: 'image/svg+xml' },
      { rel: 'msapplication-TileImage', url: '/ms-icon-150x150.svg' },
      { rel: 'msapplication-square310x310logo', url: '/ms-icon-310x310.svg' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SantaPalabra'
  },
  manifest: '/site.webmanifest'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
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
        <AppChrome>{children}</AppChrome>
        <SpeedInsights />
      </body>
    </html>
  );
}
