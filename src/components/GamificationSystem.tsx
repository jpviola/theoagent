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
    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200 shadow-lg dark:from-neutral-800 dark:to-neutral-700 dark:bg-none dark:bg-gradient-to-r dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500 rounded-full text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Nivel {progress.level}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Peregrino Espiritual</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{progress.xp} XP</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{progress.xpToNext - progress.xp} para siguiente nivel</p>
        </div>
      </div>

      <div className="relative h-3 bg-yellow-200 rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
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
      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-yellow-300 dark:from-yellow-700 dark:to-amber-700 dark:border-yellow-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-full">
            {achievement.icon}
          </div>
          <div>
            <h4 className="font-bold">¡Logro Desbloqueado!</h4>
            <p className="text-yellow-100 text-sm">+{achievement.xp} XP</p>
          </div>
        </div>
        <h3 className="font-bold text-lg">{achievement.name}</h3>
        <p className="text-yellow-100 text-sm dark:text-yellow-200">{achievement.description}</p>
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
          <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">Desbloqueados</h4>
          {unlockedAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 dark:from-neutral-800 dark:to-neutral-700 dark:border-gray-700"
              whileHover={{ scale: 1.02 }}
            >
              <div className="p-2 bg-yellow-500 text-white rounded-full">
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-gray-100">{achievement.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.description}</p>
              </div>
              <div className="text-yellow-600 font-bold">+{achievement.xp} XP</div>
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

// Hook para manejar progreso del usuario
export function useUserProgress() {
  const [progress, setProgress] = useState<UserProgress>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    achievements: [],
    streak: 0,
    totalInteractions: 0
  });
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    // Cargar progreso desde localStorage
    const saved = localStorage.getItem('santapalabra_progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  const addXP = (amount: number, reason?: string) => {
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

      // Guardar en localStorage
      localStorage.setItem('santapalabra_progress', JSON.stringify(newProgress));
      
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

      // Guardar en localStorage
      localStorage.setItem('santapalabra_progress', JSON.stringify(newProgress));
      
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
    
    // Desbloquear logros por referidos
    if (newReferralCount === 1) {
      unlockAchievement('first_referral');
      addXP(50, 'Primer referido');
    } else if (newReferralCount === 5) {
      unlockAchievement('multiple_referrals');
      addXP(150, '5 referidos');
    } else if (newReferralCount === 10) {
      unlockAchievement('referral_master');
      addXP(200, '10 referidos');
    } else {
      addXP(10, 'Nuevo referido');
    }
    
    return newReferralCount;
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('santapalabra_last_visit');
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastVisit === yesterday) {
      setProgress(prev => ({ ...prev, streak: prev.streak + 1 }));
    } else if (lastVisit !== today) {
      setProgress(prev => ({ ...prev, streak: 1 }));
    }

    localStorage.setItem('santapalabra_last_visit', today);
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