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

// Lấy toàn bộ tiến độ
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

// Lưu tiến độ
const saveUserProgress = (progress: UserProgress) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// Lấy tiến độ của một bài học
export const getLessonProgress = (lessonId: string): LessonProgress | null => {
  const progress = getUserProgress();
  return progress.lessons[lessonId] || null;
};

// Cập nhật tiến độ bài học
export const updateLessonProgress = (
  lessonId: string,
  completedSteps: string[],
  totalSteps: number = 6
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

  // Cập nhật hoặc thêm mới
  const wasNew = !progress.lessons[lessonId];
  const wasIncomplete = progress.lessons[lessonId] && !progress.lessons[lessonId].completedAt;
  
  progress.lessons[lessonId] = lessonProgress;
  progress.lastActivity = new Date().toISOString();

  // Đếm lại số bài học
  if (wasNew) {
    progress.totalLessonsStarted += 1;
  }
  if (isCompleted && wasIncomplete) {
    progress.totalLessonsCompleted += 1;
  }

  saveUserProgress(progress);
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
export const resetLessonProgress = (lessonId: string) => {
  const progress = getUserProgress();
  if (progress.lessons[lessonId]) {
    delete progress.lessons[lessonId];
    progress.totalLessonsStarted = Math.max(0, progress.totalLessonsStarted - 1);
    if (progress.lessons[lessonId]?.completedAt) {
      progress.totalLessonsCompleted = Math.max(0, progress.totalLessonsCompleted - 1);
    }
    saveUserProgress(progress);
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
