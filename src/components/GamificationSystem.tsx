'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Book, Heart, Flame, Award } from 'lucide-react';

interface UserProgress {
  level: number;
  xp: number;
  xpToNext: number;
  achievements: string[];
  streak: number;
  totalInteractions: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  xp: number;
  unlocked?: boolean;
}

const achievements: Achievement[] = [
  {
    id: 'first_question',
    name: 'Primer Encuentro',
    description: 'Has hecho tu primera pregunta a SantaPalabra',
    icon: <Heart className="h-5 w-5" />,
    xp: 10
  },
  {
    id: 'daily_reader',
    name: 'Lector Diario',
    description: 'Has consultado el Evangelio del día',
    icon: <Book className="h-5 w-5" />,
    xp: 20
  },
  {
    id: 'first_referral',
    name: 'Evangelizador Digital',
    description: 'Has compartido SantaPalabra con tu primer amigo',
    icon: <Star className="h-5 w-5" />,
    xp: 50
  },
  {
    id: 'multiple_referrals',
    name: 'Misionero de la Fe',
    description: 'Has recomendado SantaPalabra a 5 amigos',
    icon: <Flame className="h-5 w-5" />,
    xp: 150
  },
  {
    id: 'referral_master',
    name: 'Apóstol Digital',
    description: 'Has compartido SantaPalabra con 10 personas',
    icon: <Trophy className="h-5 w-5" />,
    xp: 200
  }
];

export function ProgressBar({ progress }: { progress: UserProgress }) {
  const progressPercent = (progress.xp / progress.xpToNext) * 100;

  return (
    <div className="rounded-2xl p-6 border-2 border-amber-200 shadow-lg bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-full text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Nivel {progress.level}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Peregrino Espiritual</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{progress.xp} XP</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{progress.xpToNext - progress.xp} para siguiente nivel</p>
        </div>
      </div>

      <div className="relative h-3 bg-amber-200 rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute inset-y-0 left-0 bg-linear-to-r from-amber-500 to-orange-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <span>🔥 Racha: {progress.streak} días</span>
        <span>📖 Consultas: {progress.totalInteractions}</span>
      </div>
    </div>
  );
}

export function AchievementNotification({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-linear-to-r from-amber-500 to-orange-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-300 dark:from-amber-700 dark:to-orange-700 dark:border-amber-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-full">
            {achievement.icon}
          </div>
          <div>
            <h4 className="font-bold">¡Logro Desbloqueado!</h4>
            <p className="text-amber-100 text-sm">+{achievement.xp} XP</p>
          </div>
        </div>
        <h3 className="font-bold text-lg">{achievement.name}</h3>
        <p className="text-amber-100 text-sm dark:text-amber-200">{achievement.description}</p>
      </div>
    </motion.div>
  );
}

export function AchievementsList({ userProgress }: { userProgress: UserProgress }) {
  const unlockedAchievements = achievements.filter(a => userProgress.achievements.includes(a.id));
  const lockedAchievements = achievements.filter(a => !userProgress.achievements.includes(a.id));

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4 dark:text-gray-100">🏆 Tus Logros Espirituales</h3>
      
      {/* Logros desbloqueados */}
      {unlockedAchievements.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-700 dark:text-amber-400">Desbloqueados</h4>
          {unlockedAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              className="flex items-center gap-4 p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 dark:from-neutral-800 dark:to-neutral-700 dark:border-gray-700"
              whileHover={{ scale: 1.02 }}
            >
              <div className="p-2 bg-amber-500 text-white rounded-full">
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-gray-100">{achievement.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.description}</p>
              </div>
              <div className="text-amber-600 font-bold">+{achievement.xp} XP</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Logros por desbloquear */}
      {lockedAchievements.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-500 dark:text-gray-300">Por desbloquear</h4>
          {lockedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:opacity-80"
            >
              <div className="p-2 bg-gray-300 text-gray-600 rounded-full dark:bg-gray-700 dark:text-gray-200">
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-700 dark:text-gray-100">{achievement.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-300">{achievement.description}</p>
              </div>
              <div className="text-gray-400 font-bold dark:text-gray-400">+{achievement.xp} XP</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper para cookies
function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Hook para manejar progreso del usuario
export function useUserProgress() {
  const defaultProgress: UserProgress = {
    level: 1,
    xp: 0,
    xpToNext: 100,
    achievements: [],
    streak: 0,
    totalInteractions: 0
  };

  const [progress, setProgress] = useState<UserProgress>(defaultProgress);

  // Hydrate state from client storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Intentar recuperar de localStorage primero
    const saved = localStorage.getItem('santapalabra_progress');
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
        return;
      } catch {
        // Si falla localStorage, intentar cookie
      }
    }
    
    // Intentar recuperar de cookie si no hay localStorage
    const cookieSaved = getCookie('santapalabra_progress');
    if (cookieSaved) {
      try {
        setProgress(JSON.parse(decodeURIComponent(cookieSaved)));
      } catch {}
    }
  }, []);

  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const saveProgress = (newProgress: UserProgress) => {
    const json = JSON.stringify(newProgress);
    localStorage.setItem('santapalabra_progress', json);
    setCookie('santapalabra_progress', encodeURIComponent(json), 365); // Guardar por 1 año
    
    // Notificar a otros componentes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('santapalabra_progress_updated'));
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('santapalabra_progress');
      if (saved) {
        try {
          setProgress(JSON.parse(saved));
        } catch {}
      }
    };

    window.addEventListener('santapalabra_progress_updated', handleStorageChange);
    // También escuchar storage events para pestañas cruzadas
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('santapalabra_progress_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addXP = (amount: number) => {
    setProgress(prev => {
      const newXP = prev.xp + amount;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;

      // Calcular nuevo nivel
      while (newXP >= newXpToNext) {
        newLevel++;
        newXpToNext = newLevel * 100; // Cada nivel requiere más XP
      }

      const newProgress = {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNext: newXpToNext,
        totalInteractions: prev.totalInteractions + 1
      };

      setTimeout(() => saveProgress(newProgress), 0);
      
      return newProgress;
    });
  };

  const unlockAchievement = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    setProgress(prev => {
      if (prev.achievements.includes(achievementId)) return prev; // Ya desbloqueado

      const newProgress = {
        ...prev,
        achievements: [...prev.achievements, achievementId],
        xp: prev.xp + achievement.xp
      };

      // Mostrar notificación
      setNewAchievement(achievement);

      setTimeout(() => saveProgress(newProgress), 0);
      
      return newProgress;
    });
  };

  const trackReferral = () => {
    const referrals = JSON.parse(localStorage.getItem('santapalabra_referrals') || '[]');
    const newReferralCount = referrals.length + 1;
    
    // Agregar nuevo referido
    referrals.push({
      timestamp: new Date().toISOString(),
      id: `referral_${newReferralCount}`
    });
    
    localStorage.setItem('santapalabra_referrals', JSON.stringify(referrals));
    // También guardar referidos en cookie (solo conteo para simplificar)
    setCookie('santapalabra_referral_count', newReferralCount.toString(), 365);
    
    // Desbloquear logros por referidos
    if (newReferralCount === 1) {
      unlockAchievement('first_referral');
      addXP(50);
    } else if (newReferralCount === 5) {
      unlockAchievement('multiple_referrals');
      addXP(150);
    } else if (newReferralCount === 10) {
      unlockAchievement('referral_master');
      addXP(200);
    } else {
      addXP(10);
    }
    
    return newReferralCount;
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('santapalabra_last_visit');
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastVisit === yesterday) {
      setProgress(prev => {
        const newProgress = { ...prev, streak: prev.streak + 1 };
        setTimeout(() => saveProgress(newProgress), 0);
        return newProgress;
      });
    } else if (lastVisit !== today) {
      setProgress(prev => {
        const newProgress = { ...prev, streak: 1 };
        setTimeout(() => saveProgress(newProgress), 0);
        return newProgress;
      });
    }

    localStorage.setItem('santapalabra_last_visit', today);
    setCookie('santapalabra_last_visit', today, 365);
  };

  return {
    progress,
    newAchievement,
    setNewAchievement,
    addXP,
    unlockAchievement,
    updateStreak,
    trackReferral
  };
}

export function GamificationModal({ 
  isOpen, 
  onClose, 
  progress 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  progress: UserProgress;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Tu Progreso
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <ProgressBar progress={progress} />
          <AchievementsList userProgress={progress} />
        </div>
      </motion.div>
    </div>
  );
}
