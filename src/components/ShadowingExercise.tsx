import { useState, useRef, useEffect } from 'react';
import '../App.css';

interface ShadowingExerciseProps {
  sentences: Array<{
    id: string;
    japanese: string;
    romaji: string;
    translation: string;
    audioUrl?: string;
  }>;
}

const ShadowingExercise = ({ sentences }: ShadowingExerciseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);
  const [completedSentences, setCompletedSentences] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = sentences[currentIndex];

  useEffect(() => {
    if (current.audioUrl) {
      audioRef.current = new Audio(current.audioUrl);
      audioRef.current.playbackRate = playbackSpeed;
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentIndex, current.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      // Fallback to speech synthesis
      const utterance = new SpeechSynthesisUtterance(current.japanese);
      utterance.lang = 'ja-JP';
      utterance.rate = playbackSpeed;
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
      
      utterance.onend = () => setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const markAsCompleted = () => {
    setCompletedSentences(new Set([...completedSentences, current.id]));
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousSentence = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const progress = (completedSentences.size / sentences.length) * 100;

  return (
    <div className="shadowing-container">
      <div className="shadowing-header">
        <h3>Bài tập Shadowing</h3>
        <div className="shadowing-progress">
          <span>{completedSentences.size} / {sentences.length} hoàn thành</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="shadowing-instructions">
        <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <strong>Hướng dẫn:</strong> Nghe và lặp lại câu ngay sau khi nghe xong. 
          Cố gắng bắt chước giọng điệu và nhịp độ của người nói.
        </div>
      </div>

      <div className="shadowing-card">
        <div className="sentence-display">
          <div className="sentence-japanese">{current.japanese}</div>
          
          {showRomaji && (
            <div className="sentence-romaji">{current.romaji}</div>
          )}
          
          {showTranslation && (
            <div className="sentence-translation">{current.translation}</div>
          )}
        </div>

        <div className="shadowing-controls">
          <div className="playback-controls">
            {!isPlaying ? (
              <button className="btn btn-play-large" onClick={playAudio}>
                <svg style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Phát
              </button>
            ) : (
              <button className="btn btn-pause-large" onClick={pauseAudio}>
                <svg style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tạm dừng
              </button>
            )}
          </div>

          <div className="speed-control">
            <label>Tốc độ:</label>
            <div className="speed-buttons">
              {[0.5, 0.75, 1.0, 1.25, 1.5].map(speed => (
                <button
                  key={speed}
                  className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="display-toggles">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showRomaji}
                onChange={(e) => setShowRomaji(e.target.checked)}
              />
              <span>Hiện Romaji</span>
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
              />
              <span>Hiện dịch</span>
            </label>
          </div>
        </div>

        <div className="shadowing-actions">
          <button 
            className="btn btn-success" 
            onClick={markAsCompleted}
            disabled={completedSentences.has(current.id)}
          >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 13l4 4L19 7" />
            </svg>
            {completedSentences.has(current.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
          </button>
        </div>
      </div>

      <div className="shadowing-navigation">
        <button 
          className="btn btn-outline" 
          onClick={previousSentence}
          disabled={currentIndex === 0}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Câu trước
        </button>
        
        <span className="sentence-counter">
          {currentIndex + 1} / {sentences.length}
        </span>
        
        <button 
          className="btn btn-outline" 
          onClick={nextSentence}
          disabled={currentIndex === sentences.length - 1}
        >
          Câu sau
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {completedSentences.size === sentences.length && (
        <div className="completion-message">
          <svg style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 1rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Xuất sắc!</h3>
          <p>Bạn đã hoàn thành tất cả các câu shadowing!</p>
        </div>
      )}
    </div>
  );
};

export default ShadowingExercise;
