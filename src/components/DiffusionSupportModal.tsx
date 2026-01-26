import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Share2, Facebook, Twitter } from 'lucide-react';

interface DiffusionSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiffusionSupportModal: React.FC<DiffusionSupportModalProps> = ({ isOpen, onClose }) => {
  const shareUrl = 'https://santapalabra.app';
  const shareText = '¡Hola! Te recomiendo SantaPalabra, tu catequista digital. Es una herramienta increíble para nuestra fe.';

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'native') => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title: 'SantaPalabra',
            text: shareText,
            url: shareUrl,
          }).catch(console.error);
        } else {
          navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
            .then(() => alert('Enlace copiado al portapapeles'))
            .catch(() => alert('Error al copiar enlace'));
        }
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                  <span className="text-3xl">📣</span>
                </div>
                <h2 className="text-2xl font-bold">Apoyo mediante difusión</h2>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-lg text-gray-700 text-center mb-8 italic font-medium">
                  "No puedo aportar dinero, pero aporto a la evangelización digital difundiendo SantaPalabra"
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-md shadow-green-500/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Compartir en WhatsApp
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl font-medium transition-all transform hover:scale-[1.02]"
                    >
                      <Facebook className="w-5 h-5" />
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-xl font-medium transition-all transform hover:scale-[1.02]"
                    >
                      <Twitter className="w-5 h-5" />
                      Twitter
                    </button>
                  </div>

                  <button
                    onClick={() => handleShare('native')}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    Otras opciones / Copiar enlace
                  </button>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    ¡Gracias por ayudarnos a llegar a más personas! 🙏
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
