"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DonationButton } from "@/components/DonationButton";
import { useModal } from "@/components/ModalContext";

const STORAGE_KEY = "santapalabra_donation_modal_closed";

export default function DonationModal() {
  const { activeModal, closeModal } = useModal();
  const isOpen = activeModal === 'donation';

  const close = (remember = false) => {
    closeModal('donation');
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
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => close(false)}
          />
        
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5"
          >
            {/* Header with decorative background */}
            <div className="relative h-20 bg-amber-50">
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white p-1.5 shadow-sm border border-amber-100">
                <Image
                  src="/santapalabra-logoSinLeyenda.ico"
                  alt="SantaPalabra"
                  width={48}
                  height={48}
                  className="h-10 w-10"
                />
              </div>
              <button
                onClick={() => close(false)}
                className="absolute right-3 top-3 rounded-full bg-white/50 p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
              >
                <svg
                  className="h-4 w-4"
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

            <div className="px-5 pb-5 pt-8 text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-1.5">
                Apoya nuestra misión
              </h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed px-2">
                SantaPalabra es un proyecto independiente. Tu donación nos ayuda a seguir evangelizando.
              </p>

              <div className="mb-4 rounded-lg bg-amber-50/50 border border-amber-100 p-3 text-xs text-amber-800 italic">
                &ldquo;Dios ama al que da con alegría.&rdquo;
                <span className="block mt-0.5 font-semibold text-amber-700 not-italic">2 Corintios 9:7</span>
              </div>

              <div className="space-y-3">
                {/* Donation Options */}
                <div className="grid grid-cols-1 gap-2.5">
                  <DonationButton
                    provider="buymeacoffee"
                    href="https://www.buymeacoffee.com/santapalabra"
                    className="w-full"
                    label="Invítanos un café"
                  />

                  <DonationButton
                    provider="paypal"
                    href="https://www.paypal.com/ncp/links/YTAYJCFUN8MCY"
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
        </div>
      )}
    </AnimatePresence>
  );
}