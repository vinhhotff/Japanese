/**
 * LocalStorage utilities for saving user progress
 */

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  vocabulary: {
    completed: boolean;
    score: number;
    attempts: number;
  };
  listening: {
    completed: boolean;
    score: number;
    attempts: number;
  };
  speaking: {
    completed: boolean;
    score: number;
    attempts: number;
  };
  grammar: {
    completed: boolean;
    score: number;
    attempts: number;
  };
}

export interface UserProgress {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyChallenges: Record<string, DailyChallenge>;
  completedLessons: string[];
  masteredVocabulary: string[];
  badges: string[];
}

const STORAGE_KEY = 'japanese_learning_progress';

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getUserProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const progress = JSON.parse(stored);
      // Check if streak needs to be reset
      const today = getTodayDate();
      const lastActive = progress.lastActiveDate || today;
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff > 1) {
        // Streak broken
        progress.currentStreak = 0;
      } else if (daysDiff === 1) {
        // Continue streak
        // Keep current streak
      }
      
      progress.lastActiveDate = today;
      return progress;
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  }
  
  return {
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: getTodayDate(),
    dailyChallenges: {},
    completedLessons: [],
    masteredVocabulary: [],
    badges: []
  };
};

export const saveUserProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const getTodayChallenge = (): DailyChallenge | null => {
  const progress = getUserProgress();
  const today = getTodayDate();
  return progress.dailyChallenges[today] || null;
};

export const updateDailyChallenge = (
  challengeType: 'vocabulary' | 'listening' | 'speaking' | 'grammar',
  score: number,
  completed: boolean
): void => {
  const progress = getUserProgress();
  const today = getTodayDate();
  
  if (!progress.dailyChallenges[today]) {
    progress.dailyChallenges[today] = {
      date: today,
      vocabulary: { completed: false, score: 0, attempts: 0 },
      listening: { completed: false, score: 0, attempts: 0 },
      speaking: { completed: false, score: 0, attempts: 0 },
      grammar: { completed: false, score: 0, attempts: 0 }
    };
  }
  
  const challenge = progress.dailyChallenges[today][challengeType];
  challenge.attempts += 1;
  if (completed && score > challenge.score) {
    challenge.score = score;
    challenge.completed = completed;
    
    // Add points
    progress.totalPoints += score;
    
    // Update streak
    const lastActive = progress.lastActiveDate || today;
    const daysDiff = Math.floor(
      (new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff === 1 || daysDiff === 0) {
      progress.currentStreak += 1;
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak;
      }
    } else {
      progress.currentStreak = 1;
    }
    
    progress.lastActiveDate = today;
  }
  
  saveUserProgress(progress);
};

export const checkAllChallengesCompleted = (): boolean => {
  const challenge = getTodayChallenge();
  if (!challenge) return false;
  
  return (
    challenge.vocabulary.completed &&
    challenge.listening.completed &&
    challenge.speaking.completed &&
    challenge.grammar.completed
  );
};

export const addPoints = (points: number): void => {
  const progress = getUserProgress();
  progress.totalPoints += points;
  saveUserProgress(progress);
};

export const addBadge = (badgeId: string): void => {
  const progress = getUserProgress();
  if (!progress.badges.includes(badgeId)) {
    progress.badges.push(badgeId);
    saveUserProgress(progress);
  }
};

