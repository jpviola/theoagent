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
        <header className="sticky top-0 z-50 w-full border-b border-yellow-200 bg-white/90 backdrop-blur-xl shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo y título principal - más grande y prominente */}
              <Link href="/" className="flex items-center gap-4 group transition-transform hover:scale-[1.02]">
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100 p-2 shadow-md group-hover:shadow-lg transition-shadow">
                  <img src="/santapalabra-logo.svg" alt="SantaPalabra" className="h-full w-full object-contain" />
                </div>
                <div className="leading-tight">
                  <div className="text-2xl font-black text-gray-900 tracking-tight">SantaPalabra</div>
                  <div className="text-sm text-gray-600 font-medium">Catequista digital hispanoamericano</div>
                </div>
              </Link>

              {/* Navegación principal - más atractiva */}
              <nav className="hidden lg:flex items-center gap-1 bg-yellow-50 rounded-full p-2 border border-yellow-200">
                <Link href="/catholic-chat" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">
                  <span className="text-lg">💬</span>
                  Chat Católico
                </Link>
                <Link href="/blog" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">
                  <span className="text-lg">📖</span>
                  Blog
                </Link>
                <Link href="/support" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">
                  <span className="text-lg">🙏</span>
                  Apoyar
                </Link>
                <Link href="/admin" className="flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 hover:shadow-sm transition-all duration-200 border border-amber-200">
                  <span className="text-sm">⚙️</span>
                  Panel
                </Link>
              </nav>

              {/* Navegación móvil */}
              <nav className="flex lg:hidden items-center gap-2">
                <Link href="/catholic-chat" className="p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                  <span className="text-xl">💬</span>
                </Link>
                <Link href="/blog" className="p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                  <span className="text-xl">📖</span>
                </Link>
                <Link href="/support" className="p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                  <span className="text-xl">🙏</span>
                </Link>
                <Link href="/admin" className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors border border-amber-200">
                  <span className="text-sm">⚙️</span>
                </Link>
              </nav>

              {/* Botones de acción - más dinámicos */}
              <div className="flex items-center gap-3">
                <Link href="/support" className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  <span className="group-hover:animate-pulse">❤️</span>
                  <span className="hidden sm:inline">¡Quiero donar!</span>
                </Link>
                <a href="https://www.buymeacoffee.com/santapalabra" target="_blank" rel="noreferrer" className="group relative hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  <span className="group-hover:animate-bounce">☕</span>
                  <span>¡Quiero un café!</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-screen">
          <AppChrome>{children}</AppChrome>
        </main>



        <SpeedInsights />
      </body>
    </html>
  );
}
