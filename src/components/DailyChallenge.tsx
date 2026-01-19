import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProgress, getTodayChallenge, updateDailyChallenge, checkAllChallengesCompleted } from '../utils/storage';
import { addExperiencePoints, updateStreak, getUserStats } from '../services/statsService';
import { checkAndAwardBadges } from '../services/badgeService';
import VocabularyChallenge from './challenges/VocabularyChallenge';
import ListeningChallenge from './challenges/ListeningChallenge';
import SpeakingChallenge from './challenges/SpeakingChallenge';
import GrammarChallenge from './challenges/GrammarChallenge';
import Celebration from './Celebration';
import '../App.css';

const DailyChallenge = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(getUserProgress());
  const [todayChallenge, setTodayChallenge] = useState(getTodayChallenge());
  const [activeChallenge, setActiveChallenge] = useState<'vocabulary' | 'listening' | 'speaking' | 'grammar' | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [cloudStats, setCloudStats] = useState<any>(null);

  useEffect(() => {
    const updatedProgress = getUserProgress();
    setProgress(updatedProgress);
    setTodayChallenge(getTodayChallenge());

    if (user) {
      loadCloudStats();
    }
  }, [user]);

  const loadCloudStats = async () => {
    const stats = await getUserStats(user!.id);
    if (stats) setCloudStats(stats);
  };

  const handleChallengeComplete = async (
    type: 'vocabulary' | 'listening' | 'speaking' | 'grammar',
    score: number
  ) => {
    updateDailyChallenge(type, score, true);
    const updatedProgress = getUserProgress();
    setProgress(updatedProgress);
    setTodayChallenge(getTodayChallenge());
    setActiveChallenge(null);

    // Sync Gamification to Cloud
    if (user) {
      await addExperiencePoints(user.id, score * 10);
      await updateStreak(user.id);

      const newBadges = await checkAndAwardBadges(user.id);
      if (newBadges.length > 0) {
        alert(`Chúc mừng! Bạn đã nhận được ${newBadges.length} huy hiệu mới: ${newBadges.map(b => b.name).join(', ')}`);
      }

      loadCloudStats();
    }

    // Check if all challenges completed
    if (checkAllChallengesCompleted()) {
      setShowCelebration(true);
      if (user) await addExperiencePoints(user.id, 100); // Bonus for all clear
      setTimeout(() => setShowCelebration(false), 5000);
    }
  };

  const challenges = [
    {
      id: 'vocabulary' as const,
      name: 'Từ vựng',
      icon: '📖',
      color: '#3b82f6',
      description: 'Học 10 từ vựng mới'
    },
    {
      id: 'listening' as const,
      name: 'Nghe',
      icon: '🎧',
      color: '#f59e0b',
      description: 'Luyện nghe hiểu'
    },
    {
      id: 'speaking' as const,
      name: 'Nói',
      icon: '🎤',
      color: '#ef4444',
      description: 'Luyện phát âm'
    },
    {
      id: 'grammar' as const,
      name: 'Ngữ pháp',
      icon: '📖',
      color: '#10b981',
      description: 'Học ngữ pháp mới'
    }
  ];

  const getChallengeStatus = (id: 'vocabulary' | 'listening' | 'speaking' | 'grammar') => {
    if (!todayChallenge) return { completed: false, score: 0 };
    return {
      completed: todayChallenge[id].completed,
      score: todayChallenge[id].score
    };
  };

  const completedCount = challenges.filter(c => getChallengeStatus(c.id).completed).length;

  return (
    <>
      {showCelebration && <Celebration />}

      <div className="daily-challenge-card">
        <div className="daily-challenge-header">
          <div>
            <h2>
              <svg style={{ width: '32px', height: '32px', display: 'inline', marginRight: '0.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Thử Thách Hàng Ngày
            </h2>
            <p>Hoàn thành 4 thử thách để nhận điểm thưởng!</p>
          </div>
          <div className="challenge-stats">
            <div className="stat-item">
              <div className="stat-value">{cloudStats ? cloudStats.currentStreak : progress.currentStreak}</div>
              <div className="stat-label">🔥 Streak</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{cloudStats ? cloudStats.totalPoints : progress.totalPoints}</div>
              <div className="stat-label">⭐ Điểm</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{completedCount}/4</div>
              <div className="stat-label">✅ Hoàn thành</div>
            </div>
          </div>
        </div>

        <div className="challenge-progress-bar">
          <div
            className="challenge-progress-fill"
            style={{ width: `${(completedCount / 4) * 100}%` }}
          ></div>
        </div>

        <div className="challenges-grid">
          {challenges.map((challenge) => {
            const status = getChallengeStatus(challenge.id);
            return (
              <div
                key={challenge.id}
                className={`challenge-card ${status.completed ? 'completed' : ''}`}
                onClick={() => setActiveChallenge(challenge.id)}
              >
                <div className="challenge-icon" style={{ color: challenge.color }}>
                  {challenge.icon}
                </div>
                <div className="challenge-info">
                  <h3>{challenge.name}</h3>
                  <p>{challenge.description}</p>
                  {status.completed && (
                    <div className="challenge-score">
                      ⭐ {status.score} điểm
                    </div>
                  )}
                </div>
                {status.completed ? (
                  <div className="challenge-check">✅</div>
                ) : (
                  <div className="challenge-arrow">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeChallenge && (
        <div className="challenge-modal">
          <div className="challenge-modal-content">
            <button
              className="challenge-modal-close"
              onClick={() => setActiveChallenge(null)}
            >
              ✕
            </button>
            {activeChallenge === 'vocabulary' && (
              <VocabularyChallenge
                onComplete={(score) => handleChallengeComplete('vocabulary', score)}
                onClose={() => setActiveChallenge(null)}
              />
            )}
            {activeChallenge === 'listening' && (
              <ListeningChallenge
                onComplete={(score) => handleChallengeComplete('listening', score)}
                onClose={() => setActiveChallenge(null)}
              />
            )}
            {activeChallenge === 'speaking' && (
              <SpeakingChallenge
                onComplete={(score) => handleChallengeComplete('speaking', score)}
                onClose={() => setActiveChallenge(null)}
              />
            )}
            {activeChallenge === 'grammar' && (
              <GrammarChallenge
                onComplete={(score) => handleChallengeComplete('grammar', score)}
                onClose={() => setActiveChallenge(null)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DailyChallenge;
