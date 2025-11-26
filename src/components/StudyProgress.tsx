import { useState, useEffect } from 'react';
import { getVocabulary, getKanji, getLessons } from '../services/supabaseService';
import '../App.css';

interface StudyStats {
  totalVocab: number;
  masteredVocab: number;
  totalKanji: number;
  masteredKanji: number;
  lessonsCompleted: number;
  totalLessons: number;
  studyStreak: number;
  totalStudyTime: number; // minutes
}

const StudyProgress = () => {
  const [stats, setStats] = useState<StudyStats>({
    totalVocab: 0,
    masteredVocab: 0,
    totalKanji: 0,
    masteredKanji: 0,
    lessonsCompleted: 0,
    totalLessons: 0,
    studyStreak: 0,
    totalStudyTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [vocabData, kanjiData, lessonsData] = await Promise.all([
        getVocabulary(),
        getKanji(),
        getLessons()
      ]);

      // Get from localStorage
      const masteredVocab = JSON.parse(localStorage.getItem('mastered_vocab') || '[]');
      const masteredKanji = JSON.parse(localStorage.getItem('mastered_kanji') || '[]');
      const completedLessons = JSON.parse(localStorage.getItem('completed_lessons') || '[]');
      const streakInfo = JSON.parse(localStorage.getItem('study_streak') || '{"currentStreak": 0}');
      const studyTime = parseInt(localStorage.getItem('total_study_time') || '0');

      setStats({
        totalVocab: vocabData.length,
        masteredVocab: masteredVocab.length,
        totalKanji: kanjiData.length,
        masteredKanji: masteredKanji.length,
        lessonsCompleted: completedLessons.length,
        totalLessons: lessonsData.length,
        studyStreak: streakInfo.currentStreak || 0,
        totalStudyTime: studyTime
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải thống kê...</div>
      </div>
    );
  }

  const vocabProgress = stats.totalVocab > 0 ? (stats.masteredVocab / stats.totalVocab) * 100 : 0;
  const kanjiProgress = stats.totalKanji > 0 ? (stats.masteredKanji / stats.totalKanji) * 100 : 0;
  const lessonProgress = stats.totalLessons > 0 ? (stats.lessonsCompleted / stats.totalLessons) * 100 : 0;

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Thống Kê Học Tập
        </h1>
        <p>Theo dõi tiến độ học tập của bạn</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.masteredVocab}/{stats.totalVocab}</div>
          <div className="stat-label">Từ vựng đã thuộc</div>
          <div className="stat-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${vocabProgress}%` }}></div>
            </div>
            <span className="progress-text">{Math.round(vocabProgress)}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🈳</div>
          <div className="stat-value">{stats.masteredKanji}/{stats.totalKanji}</div>
          <div className="stat-label">Kanji đã thuộc</div>
          <div className="stat-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${kanjiProgress}%` }}></div>
            </div>
            <span className="progress-text">{Math.round(kanjiProgress)}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-value">{stats.lessonsCompleted}/{stats.totalLessons}</div>
          <div className="stat-label">Bài học đã hoàn thành</div>
          <div className="stat-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${lessonProgress}%` }}></div>
            </div>
            <span className="progress-text">{Math.round(lessonProgress)}%</span>
          </div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.studyStreak}</div>
          <div className="stat-label">Ngày học liên tiếp</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{Math.round(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m</div>
          <div className="stat-label">Tổng thời gian học</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">
            {stats.totalVocab + stats.totalKanji > 0 
              ? Math.round(((stats.masteredVocab + stats.masteredKanji) / (stats.totalVocab + stats.totalKanji)) * 100)
              : 0}%
          </div>
          <div className="stat-label">Tổng tiến độ</div>
        </div>
      </div>
    </div>
  );
};

export default StudyProgress;

