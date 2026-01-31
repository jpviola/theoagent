
import { useState, useEffect } from 'react';
import { analyzeMessageInterests, LearnerProfile, INITIAL_PROFILE } from '@/lib/learning-utils';

const STORAGE_KEY = 'santaPalabra_learner_profile';

export function useLearningEngine() {
  const [profile, setProfile] = useState<LearnerProfile>(INITIAL_PROFILE);

  // Load profile on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse learner profile', e);
        }
      }
    }
  }, []);

  // Save profile on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  const learnFromInteraction = (userMessage: string) => {
    const newInterests = analyzeMessageInterests(userMessage);
    
    setProfile(prev => {
      const updatedInterests = { ...prev.interests };
      
      newInterests.forEach(interest => {
        updatedInterests[interest] = (updatedInterests[interest] || 0) + 1;
      });

      const newCount = prev.queryCount + 1;
      
      // Simple heuristic for complexity: more queries -> higher level
      let level: 'beginner' | 'intermediate' | 'advanced' = prev.complexityLevel;
      if (newCount > 50) level = 'intermediate';
      if (newCount > 200) level = 'advanced';

      return {
        ...prev,
        interests: updatedInterests,
        queryCount: newCount,
        lastActive: new Date().toISOString(),
        complexityLevel: level
      };
    });
  };

  return {
    profile,
    learnFromInteraction
  };
}
