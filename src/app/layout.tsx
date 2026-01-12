import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthFlowManager from "@/components/AuthFlowManager";

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
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthFlowManager>
          {children}
        </AuthFlowManager>
      </body>
    </html>
  );
}
