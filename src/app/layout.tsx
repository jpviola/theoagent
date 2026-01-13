import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
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
        <header className="w-full border-b py-4 px-6 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold text-lg">SantaPalabra</Link>
            <nav className="hidden md:flex gap-4 text-sm">
              <Link href="/catholic-chat">Chat</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/support">Apoyar</Link>
            </nav>
          </div>
          <div>
            <a href="https://www.buymeacoffee.com/santapalabra" target="_blank" rel="noreferrer" className="bg-yellow-400 text-black px-4 py-2 rounded-md text-sm">Donar ☕</a>
          </div>
        </header>

        <main className="min-h-screen">
          <AppChrome>{children}</AppChrome>
        </main>

        <footer className="w-full border-t py-6 px-6 text-center text-sm bg-white">
          <div>© {new Date().getFullYear()} SantaPalabra · Una iniciativa de evangelización digital</div>
          <div className="mt-2">
            <a href="https://www.buymeacoffee.com/santapalabra" target="_blank" rel="noreferrer" className="underline">Invítanos un café</a>
          </div>
        </footer>

        <SpeedInsights />
      </body>
    </html>
  );
}
