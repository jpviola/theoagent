"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const STORAGE_KEY = "santapalabra_donation_modal_closed";

export default function DonationModal() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      const path = window.location?.pathname ?? "/";
      if (path !== "/") return false;

      const value = localStorage.getItem(STORAGE_KEY);
      if (value === "true") return false;

      return true;
    } catch {
      return true;
    }
  });

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

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/50"
          onClick={() => close(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-md mx-4 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <Image
              src="/santapalabra-logoSinLeyenda.ico"
              alt="SantaPalabra"
              width={48}
              height={48}
              className="h-12 w-12"
              aria-hidden="true"
            />

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Apoya a SantaPalabra
              </h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Somos un equipo pequeño (2–5 personas). Con tu aporte podemos
                lanzar la app móvil, mantener servidores y mejorar contenido.
              </p>
            </div>

            <div className="mt-4 w-full">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="flex flex-col items-center">
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                    Para Europeos
                  </div>
                  <a
                    href="https://www.buymeacoffee.com/santapalabra"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-black px-5 py-2.5 rounded-full shadow hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                    style={{ minWidth: 160 }}
                  >
                    <span className="text-lg">☕</span>
                    <span>Invítanos un café</span>
                  </a>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                    Para Latinoamericanos
                  </div>
                  <a
                    href={
                      process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID
                        ? `https://www.paypal.com/donate?hosted_button_id=${process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID}`
                        : "/support"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 px-5 py-2.5 rounded-full shadow border hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                    style={{ minWidth: 160 }}
                  >
                    <svg
                      width="36"
                      height="18"
                      viewBox="0 0 100 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <rect width="100" height="40" fill="transparent" />
                      <path
                        d="M12 10c-3 0-5 2-5 5v8c0 3 2 5 5 5h8c3 0 5-2 6-5l4-18H22l-4 14h-5l3-14H12z"
                        fill="#003087"
                      />
                      <text
                        x="36"
                        y="26"
                        fontFamily="Arial, Helvetica, sans-serif"
                        fontSize="14"
                        fill="#003087"
                      >
                        PayPal
                      </text>
                    </svg>
                    <span>Donar con PayPal</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(STORAGE_KEY, "true");
                  } catch {
                  }
                  close(true);
                }}
                className="text-sm text-gray-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Prefiero probar la app primero
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => close(true)}
                  className="ml-2 bg-amber-600 text-white px-4 py-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Pronto adquiérala en:
              </span>
              <svg
                width="120"
                height="36"
                viewBox="0 0 200 60"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <g transform="translate(8,6)">
                  <polygon points="0,0 28,18 0,36" fill="#34A853" />
                  <polygon
                    points="0,0 18,18 0,36"
                    fill="#4285F4"
                    transform="translate(10,0)"
                  />
                </g>
                <g transform="translate(60,10)">
                  <text
                    x="0"
                    y="10"
                    fontFamily="Arial, Helvetica, sans-serif"
                    fontSize="8"
                    fill="#6b7280"
                  >
                    GET IT ON
                  </text>
                  <text
                    x="0"
                    y="30"
                    fontFamily="Arial, Helvetica, sans-serif"
                    fontWeight="700"
                    fontSize="16"
                    fill="#000"
                  >
                    Google Play
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
