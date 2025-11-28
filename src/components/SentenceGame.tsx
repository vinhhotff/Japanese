import { useState, useEffect } from 'react';
import { SentenceGame as SentenceGameType } from '../types';
import '../App.css';

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
      <div className="game-container">
        <div className="game-result">
          <svg className="result-icon" style={{ width: '100px', height: '100px', color: '#10b981', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2>Hoàn thành xuất sắc!</h2>
          <div className="score-display">
            <div className="score-number">{score}/{sentences.length}</div>
            <div className="score-label">Câu đúng</div>
            <div className={`score-percentage ${performanceClass}`}>
              {percentage}%
            </div>
          </div>
          <p className="result-message">
            {percentage >= 80 ? 'Tuyệt vời! Bạn đã làm rất tốt! 🎉' : 
             percentage >= 60 ? 'Khá tốt! Hãy thử lại để đạt điểm cao hơn! 👍' : 
             'Cần luyện tập thêm. Đừng bỏ cuộc! 💪'}
          </p>
          <button className="btn btn-primary" onClick={resetGame}>
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            🔄 Chơi lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentSentence) {
    return <div>Không có câu hỏi</div>;
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-progress">
          <span>Câu {currentIndex + 1} / {sentences.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / sentences.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="game-score">Điểm: {score}/{sentences.length}</div>
      </div>

      <div className="game-question">
        <div className="question-translation">
          <span className="question-label">Sắp xếp các từ để tạo thành câu:</span>
          <div className="translation-text">{currentSentence.translation}</div>
        </div>
        {showHint && currentSentence.hint && (
          <div className="game-hint">
            💡 Gợi ý: {currentSentence.hint}
          </div>
        )}
      </div>

      <div className="selected-words-container">
        <div className="selected-label">
          <svg style={{ width: '24px', height: '24px', color: '#ec4899' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Câu của bạn:
        </div>
        <div className="selected-words">
          {selectedWords.length === 0 ? (
            <div className="empty-slot">
              <svg style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', color: '#9ca3af' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
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
                <span className="remove-icon">×</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="available-words-container">
        <div className="available-label">
          <svg style={{ width: '24px', height: '24px', color: '#ec4899' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Nhấn vào từ để thêm:
        </div>
        <div className="available-words">
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
        <div className={`game-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? (
            <>
              <svg className="feedback-icon" style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="feedback-text">Chính xác! Câu đúng là: <strong>{currentSentence.sentence}</strong></span>
            </>
          ) : (
            <>
              <svg className="feedback-icon" style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="feedback-text">Chưa đúng! Câu đúng là: <strong>{currentSentence.sentence}</strong></span>
            </>
          )}
        </div>
      )}

      <div className="game-actions">
        {!showHint && currentSentence.hint && isCorrect === null && (
          <button 
            className="btn btn-outline" 
            onClick={() => setShowHint(true)}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Xem gợi ý
          </button>
        )}
        {isCorrect === null ? (
          <button 
            className="btn btn-primary"
            onClick={checkAnswer}
            disabled={selectedWords.length !== currentSentence.words.length}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Kiểm tra câu trả lời
          </button>
        ) : (
          <button className="btn btn-primary" onClick={nextSentence}>
            {currentIndex < sentences.length - 1 ? (
              <>
                Câu tiếp theo
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Hoàn thành
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SentenceGame;

