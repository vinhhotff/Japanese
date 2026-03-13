import { useState, useEffect } from 'react';
import { SentenceGame as SentenceGameType } from '../types';
import '../styles/learning-sections-premium.css';

interface SentenceGameProps {
  sentences: SentenceGameType[];
  onComplete?: (score: number, total: number) => void;
}

const SentenceGame = ({ sentences, onComplete }: SentenceGameProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const currentSentence = sentences[currentIndex];

  useEffect(() => {
    if (currentSentence) {
      const shuffled = [...currentSentence.words].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
      setSelectedWords([]);
      setIsCorrect(null);
      setShowHint(false);
    }
  }, [currentIndex, currentSentence]);

  const handleWordClick = (word: string, index: number) => {
    if (isCorrect !== null) return; // Game đã kết thúc

    const newSelected = [...selectedWords, word];
    const newAvailable = availableWords.filter((_, i) => i !== index);

    setSelectedWords(newSelected);
    setAvailableWords(newAvailable);
  };

  const handleRemoveWord = (index: number) => {
    if (isCorrect !== null) return;

    const word = selectedWords[index];
    const newSelected = selectedWords.filter((_, i) => i !== index);
    const newAvailable = [...availableWords, word];

    setSelectedWords(newSelected);
    setAvailableWords(newAvailable);
  };

  const checkAnswer = () => {
    if (!currentSentence) return;

    const userOrder = selectedWords.map(word =>
      currentSentence.words.findIndex(w => w === word)
    );
    const isAnswerCorrect = JSON.stringify(userOrder) === JSON.stringify(currentSentence.correctOrder);

    setIsCorrect(isAnswerCorrect);
    if (isAnswerCorrect) {
      setScore(score + 1);
    }
  };

  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameComplete(true);
      if (onComplete) {
        onComplete(score + (isCorrect ? 1 : 0), sentences.length);
      }
    }
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameComplete(false);
    setIsCorrect(null);
    const shuffled = [...sentences[0].words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
  };

  if (gameComplete) {
    const percentage = Math.round((score / sentences.length) * 100);
    const performanceClass = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'needs-improvement';

    return (
      <div className="game-container game-result">
        <svg className="result-icon" style={{ width: '100px', height: '100px', color: 'var(--success-color)', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 style={{ color: 'var(--text-primary)', fontWeight: '900' }}>Hoàn thành bài tập!</h2>
        <div className="score-display" style={{ margin: '2rem 0' }}>
          <div className="score-number" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary-color)' }}>{score}/{sentences.length}</div>
          <div className="score-label" style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Câu đúng</div>
          <div className={`score-percentage ${performanceClass}`} style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>
            {percentage}%
          </div>
        </div>
        <p className="result-message" style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          {percentage >= 80 ? 'Tuyệt vời! Bạn đã làm rất tốt! 🎉' :
            percentage >= 60 ? 'Khá tốt! Hãy thử lại để đạt điểm cao hơn! 👍' :
              'Cần luyện tập thêm. Đừng bỏ cuộc! 💪'}
        </p>
        <button className="btn btn-primary" onClick={resetGame}>
          🔄 Chơi lại
        </button>
      </div>
    );
  }

  if (!currentSentence) {
    return <div>Không có câu hỏi</div>;
  }

  return (
    <div className="game-container">
      <div className="game-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="game-progress" style={{ flex: 1 }}>
          <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Câu {currentIndex + 1} / {sentences.length}</span>
          <div className="progress-bar" style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / sentences.length) * 100}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }}
            ></div>
          </div>
        </div>
        <div className="game-score" style={{ marginLeft: '2rem', fontWeight: '800', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--primary-color)' }}>Điểm: {score}/{sentences.length}</div>
      </div>

      <div className="game-question" style={{ marginBottom: '2rem' }}>
        <div className="question-translation">
          <span className="question-label" style={{ fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Sắp xếp các từ để tạo thành câu:</span>
          <div className="translation-text" style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{currentSentence.translation}</div>
        </div>
        {showHint && currentSentence.hint && (
          <div className="game-hint" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--warning-light)', borderRadius: '12px', color: 'var(--warning-color)', fontWeight: '600', border: '1px solid var(--warning-color)' }}>
            💡 Gợi ý: {currentSentence.hint}
          </div>
        )}
      </div>

      <div className="selected-words-container" style={{ marginBottom: '2rem' }}>
        <div className="selected-label" style={{ fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Câu của bạn:
        </div>
        <div className="selected-words" style={{ minHeight: '80px', padding: '1rem', background: 'var(--bg-color)', border: '2px dashed var(--border-color)', borderRadius: '20px', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
          {selectedWords.length === 0 ? (
            <div className="empty-slot" style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Nhấn vào các từ bên dưới để tạo câu
            </div>
          ) : (
            selectedWords.map((word, index) => (
              <button
                key={index}
                className="word-chip selected"
                onClick={() => handleRemoveWord(index)}
              >
                {word}
                <span className="remove-icon" style={{ marginLeft: '0.5rem', opacity: 0.6 }}>×</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="available-words-container" style={{ marginBottom: '2rem' }}>
        <div className="available-label" style={{ fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Nhấn vào từ để thêm:
        </div>
        <div className="available-words" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          {availableWords.map((word, index) => (
            <button
              key={index}
              className="word-chip available"
              onClick={() => handleWordClick(word, index)}
              disabled={isCorrect !== null}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {isCorrect !== null && (
        <div className={`game-feedback ${isCorrect ? 'correct' : 'incorrect'}`} style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: isCorrect ? 'var(--success-light)' : 'var(--danger-light)', border: `1px solid ${isCorrect ? 'var(--success-color)' : 'var(--danger-color)'}`, color: isCorrect ? 'var(--success-color)' : 'var(--danger-color)' }}>
          <span className="feedback-text" style={{ fontWeight: '700' }}>{isCorrect ? 'Chính xác!' : 'Chưa đúng!'} Câu đúng là: <strong>{currentSentence.sentence}</strong></span>
        </div>
      )}

      <div className="game-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {!showHint && currentSentence.hint && isCorrect === null && (
          <button
            className="btn btn-outline"
            onClick={() => setShowHint(true)}
          >
            Xem gợi ý
          </button>
        )}
        {isCorrect === null ? (
          <button
            className="btn btn-primary"
            onClick={checkAnswer}
            disabled={selectedWords.length !== currentSentence.words.length}
          >
            Kiểm tra
          </button>
        ) : (
          <button className="btn btn-primary" onClick={nextSentence}>
            {currentIndex < sentences.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
          </button>
        )}
      </div>
    </div>
  );
};


export default SentenceGame;

