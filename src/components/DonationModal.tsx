"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DonationButton } from "@/components/DonationButton";

const STORAGE_KEY = "santapalabra_donation_modal_closed";

export default function DonationModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // Solo mostrar en la página de inicio
      const path = window.location?.pathname ?? "/";
      if (path !== "/") {
        return;
      }

      const value = localStorage.getItem(STORAGE_KEY);

      // Si el usuario ya cerró permanentemente el modal
      if (value === "true") {
        return;
      }

      // Si hay una fecha de "snooze" (posponer por 7 días)
      if (value && !isNaN(Number(value))) {
        const snoozeUntil = Number(value);
        if (Date.now() < snoozeUntil) {
           return;
        }
      }

      // Si no hay restricciones, mostrar el modal
      // Pequeño delay para que la animación de entrada sea más suave
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
      
    } catch (e) {
      // En caso de error (ej. acceso a localStorage bloqueado), mostramos el modal por seguridad (o podrías decidir ocultarlo)
      // Para ser menos intrusivos en caso de error, mejor no mostrarlo:
      console.error(e);
    }
  }, []);

  const close = (remember = false) => {
    setOpen(false);
    try {
      if (remember) {
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        const ts = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, String(ts));
      }
    } catch {
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            {/* Header with decorative background */}
            <div className="relative h-32 bg-gradient-to-br from-yellow-400 to-amber-600">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white p-2 shadow-lg">
                <Image
                  src="/santapalabra-logoSinLeyenda.ico"
                  alt="SantaPalabra"
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
              </div>
              <button
                onClick={() => close(false)}
                className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6 pt-12 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Apoya nuestra misión
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                SantaPalabra es un proyecto independiente mantenido por un pequeño equipo. 
                Tu donación nos ayuda a desarrollar la app móvil y crear más contenido para evangelizar.
              </p>

              <div className="space-y-4">
                {/* Donation Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DonationButton
                    provider="buymeacoffee"
                    href="https://www.buymeacoffee.com/santapalabra"
                    className="w-full"
                    label="Invítanos un café"
                  />

                  <DonationButton
                    provider="paypal"
                    href={
                      process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID
                        ? `https://www.paypal.com/donate?hosted_button_id=${process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID}`
                        : "/support"
                    }
                    className="w-full"
                    label="PayPal"
                  />
                </div>

                {/* Secondary Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                  <Link
                    href="/support"
                    className="text-sm font-semibold text-gray-700 hover:text-amber-600 hover:underline transition-colors"
                    onClick={() => close(false)}
                  >
                    Ver más opciones de apoyo (MercadoPago, etc.) &rarr;
                  </Link>

                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem(STORAGE_KEY, "true");
                      } catch {}
                      close(true);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    No gracias, prefiero continuar a la app
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>Próximamente en:</span>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-500">Google Play</span>
                  <span>&</span>
                  <span className="font-semibold text-gray-500">App Store</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}