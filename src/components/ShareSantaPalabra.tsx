'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, MessageCircle, Facebook, Twitter, Mail, Check, Heart, Star } from 'lucide-react';

interface ShareSantaPalabraProps {
  onShare?: () => void;
  onReferralTracked?: () => void;
}

export default function ShareSantaPalabra({ onShare, onReferralTracked }: ShareSantaPalabraProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://santapalabra.lat';
  const shareText = '🙏 ¡Descubrí SantaPalabra! Una catequista digital hispanoamericana con IA que me ayuda a profundizar mi fe católica. ✨ Combina Sagrada Escritura, Tradición y Magisterio en una experiencia única.';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      handleShare('copy');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleShare = (platform: string) => {
    onShare?.();
    onReferralTracked?.();
    
    // Tracking para analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'referral',
        item_id: 'santapalabra_app'
      });
    }
  };

  const shareOptions = [
    {
      name: 'Copiar enlace',
      icon: <Copy className="h-5 w-5" />,
      action: handleCopyLink,
      color: 'bg-gray-500 hover:bg-gray-600',
      platform: 'copy'
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-5 w-5" />,
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        window.open(whatsappUrl, '_blank');
        handleShare('whatsapp');
      },
      color: 'bg-green-500 hover:bg-green-600',
      platform: 'whatsapp'
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank');
        handleShare('facebook');
      },
      color: 'bg-blue-600 hover:bg-blue-700',
      platform: 'facebook'
    },
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=CatolicosDigitales,SantaPalabra,Fe`;
        window.open(twitterUrl, '_blank');
        handleShare('twitter');
      },
      color: 'bg-sky-500 hover:bg-sky-600',
      platform: 'twitter'
    },
    {
      name: 'Email',
      icon: <Mail className="h-5 w-5" />,
      action: () => {
        const emailUrl = `mailto:?subject=${encodeURIComponent('Te recomiendo SantaPalabra')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        window.location.href = emailUrl;
        handleShare('email');
      },
      color: 'bg-purple-500 hover:bg-purple-600',
      platform: 'email'
    }
  ];

  return (
    <>
      {/* Botón para abrir el modal de compartir */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-sky-600 dark:to-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 className="h-5 w-5" />
        <span>Compartir SantaPalabra</span>
        <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
          <Star className="h-3 w-3 text-yellow-300" />
          <span>+10-200 XP</span>
        </div>
      </motion.button>

      {/* Modal de compartir */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-yellow-200 dark:from-gray-800 dark:to-gray-700 dark:border-amber-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Comparte la Fe!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Ayuda a más personas a descubrir SantaPalabra y gana XP por cada referido
                </p>
              </div>

              {/* Preview del mensaje */}
              <div className="bg-white rounded-2xl p-4 mb-6 border-2 border-yellow-200 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-200">
                  {shareText}
                </p>
                <p className="text-xs text-blue-600 mt-2 font-mono dark:text-blue-300">
                  {shareUrl}
                </p>
              </div>

              {/* Opciones de compartir */}
              <div className="space-y-3 mb-6">
                {shareOptions.map((option, index) => (
                  <motion.button
                    key={option.platform}
                    onClick={option.action}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-white font-semibold transition-all duration-200 ${option.color}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {option.platform === 'copy' && copied ? (
                      <Check className="h-5 w-5 text-green-300" />
                    ) : (
                      option.icon
                    )}
                    <span className="flex-1 text-left">
                      {option.platform === 'copy' && copied ? '¡Copiado!' : option.name}
                    </span>
                    <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      +{option.platform === 'copy' ? '10' : '50'} XP
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Información sobre recompensas */}
              <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-2xl p-4 mb-6 dark:from-amber-900 dark:to-amber-800 dark:text-gray-200">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 dark:text-white">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Recompensas por Referidos
                </h4>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                  <div className="flex justify-between">
                    <span>Primer referido:</span>
                    <span className="font-semibold text-yellow-700">+50 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>5 referidos:</span>
                    <span className="font-semibold text-yellow-700">+150 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10 referidos:</span>
                    <span className="font-semibold text-yellow-700">+200 XP</span>
                  </div>
                </div>
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 transition-colors font-semibold"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}