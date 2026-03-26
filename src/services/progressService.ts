import { supabase } from '../config/supabase';

// Service quản lý tiến độ học tập
export interface LessonProgress {
  lessonId: string;
  completedSteps: string[];
  lastStudied: string;
  totalSteps: number;
  completedAt?: string;
}

export interface UserProgress {
  lessons: Record<string, LessonProgress>;
  totalLessonsStarted: number;
  totalLessonsCompleted: number;
  lastActivity: string;
}

const PROGRESS_KEY = 'user-learning-progress';

// Sync state management to prevent loops
let lastSyncTime = 0;
let syncInProgress = false;
const SYNC_COOLDOWN_MS = 5000; // Minimum 5 seconds between syncs

// Lấy toàn bộ tiến độ (ưu tiên local, sau đó đồng bộ cloud)
export const getUserProgress = (): UserProgress => {
  const saved = localStorage.getItem(PROGRESS_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    lessons: {},
    totalLessonsStarted: 0,
    totalLessonsCompleted: 0,
    lastActivity: new Date().toISOString(),
  };
};

// Lưu tiến độ vào localStorage
const saveUserProgress = (progress: UserProgress) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// Đồng bộ từ Cloud về Local (với debounce)
export const syncProgressFromCloud = async (userId: string): Promise<boolean> => {
  // Prevent rapid re-syncs
  const now = Date.now();
  if (syncInProgress) {
    console.log('⏳ Sync already in progress, skipping...');
    return false;
  }
  
  if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
    console.log('⏳ Sync cooldown active, skipping...');
    return false;
  }

  syncInProgress = true;
  lastSyncTime = now;

  try {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .limit(500); // Limit to prevent loading too much data

    if (error) {
      console.error('Error syncing from cloud:', error);
      return false;
    }

    if (data && data.length > 0) {
      const localProgress = getUserProgress();
      data.forEach((item: any) => {
        localProgress.lessons[item.lesson_id] = {
          lessonId: item.lesson_id,
          completedSteps: item.completed_steps || [],
          lastStudied: item.last_studied_at,
          totalSteps: 6, // Default
          completedAt: item.completed_at
        };
      });

      // Recalculate stats
      const lessons = Object.values(localProgress.lessons);
      localProgress.totalLessonsStarted = lessons.length;
      localProgress.totalLessonsCompleted = lessons.filter(l => l.completedAt).length;

      saveUserProgress(localProgress);
      console.log('✅ Progress synced from cloud');
    }
    
    return true;
  } catch (e) {
    console.error('Failed to sync from cloud:', e);
    return false;
  } finally {
    syncInProgress = false;
  }
};

// Lấy tiến độ của một bài học
export const getLessonProgress = (lessonId: string): LessonProgress | null => {
  const progress = getUserProgress();
  return progress.lessons[lessonId] || null;
};

// Cập nhật tiến độ bài học
export const updateLessonProgress = async (
  lessonId: string,
  completedSteps: string[],
  totalSteps: number = 6,
  userId?: string
) => {
  const progress = getUserProgress();
  const isCompleted = completedSteps.length >= totalSteps;

  const lessonProgress: LessonProgress = {
    lessonId,
    completedSteps,
    lastStudied: new Date().toISOString(),
    totalSteps,
    ...(isCompleted && !progress.lessons[lessonId]?.completedAt
      ? { completedAt: new Date().toISOString() }
      : {}),
  };

  // Cập nhật Local
  const wasNew = !progress.lessons[lessonId];
  const wasIncomplete = progress.lessons[lessonId] && !progress.lessons[lessonId].completedAt;

  progress.lessons[lessonId] = lessonProgress;
  progress.lastActivity = new Date().toISOString();

  if (wasNew) progress.totalLessonsStarted += 1;
  if (isCompleted && wasIncomplete) progress.totalLessonsCompleted += 1;

  saveUserProgress(progress);

  // Cập nhật Cloud nếu có userId
  if (userId) {
    try {
      await supabase.from('user_learning_progress').upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed_steps: completedSteps,
        is_completed: isCompleted,
        completed_at: lessonProgress.completedAt,
        last_studied_at: lessonProgress.lastStudied
      }, {
        onConflict: 'user_id,lesson_id'
      });
    } catch (e) {
      console.error('Failed to sync to cloud:', e);
    }
  }

  return lessonProgress;
};

// Tính phần trăm hoàn thành của bài học
export const getLessonCompletionPercentage = (lessonId: string): number => {
  const lessonProgress = getLessonProgress(lessonId);
  if (!lessonProgress) return 0;
  return Math.round((lessonProgress.completedSteps.length / lessonProgress.totalSteps) * 100);
};

// Kiểm tra bài học đã hoàn thành chưa
export const isLessonCompleted = (lessonId: string): boolean => {
  const lessonProgress = getLessonProgress(lessonId);
  return lessonProgress?.completedAt !== undefined;
};

// Lấy danh sách bài học đã bắt đầu
export const getStartedLessons = (): LessonProgress[] => {
  const progress = getUserProgress();
  return Object.values(progress.lessons).sort(
    (a, b) => new Date(b.lastStudied).getTime() - new Date(a.lastStudied).getTime()
  );
};

// Lấy danh sách bài học đã hoàn thành
export const getCompletedLessons = (): LessonProgress[] => {
  const progress = getUserProgress();
  return Object.values(progress.lessons)
    .filter((l) => l.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
};

// Reset tiến độ một bài học
export const resetLessonProgress = async (lessonId: string, userId?: string) => {
  const progress = getUserProgress();
  if (progress.lessons[lessonId]) {
    delete progress.lessons[lessonId];
    progress.totalLessonsStarted = Math.max(0, progress.totalLessonsStarted - 1);
    if (progress.lessons[lessonId]?.completedAt) {
      progress.totalLessonsCompleted = Math.max(0, progress.totalLessonsCompleted - 1);
    }
    saveUserProgress(progress);

    if (userId) {
      await supabase.from('user_learning_progress').delete().eq('user_id', userId).eq('lesson_id', lessonId);
    }
  }
};

// Reset toàn bộ tiến độ
export const resetAllProgress = () => {
  localStorage.removeItem(PROGRESS_KEY);
};

// Thống kê tổng quan
export const getProgressStats = () => {
  const progress = getUserProgress();
  const lessons = Object.values(progress.lessons);

  const totalSteps = lessons.reduce((sum, l) => sum + l.completedSteps.length, 0);
  const totalPossibleSteps = lessons.reduce((sum, l) => sum + l.totalSteps, 0);

  return {
    totalLessonsStarted: progress.totalLessonsStarted,
    totalLessonsCompleted: progress.totalLessonsCompleted,
    totalStepsCompleted: totalSteps,
    overallProgress: totalPossibleSteps > 0 ? Math.round((totalSteps / totalPossibleSteps) * 100) : 0,
    lastActivity: progress.lastActivity,
    recentLessons: lessons.slice(0, 5),
  };
};

