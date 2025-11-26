import { useState, useEffect } from 'react';
import { Vocabulary } from '../types';
import '../App.css';

interface FlashcardProps {
  vocabulary: Vocabulary[];
  onComplete?: (mastered: number, total: number) => void;
}

const Flashcard = ({ vocabulary, onComplete }: FlashcardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);

  const current = vocabulary[currentIndex];
  const progress = ((currentIndex + 1) / vocabulary.length) * 100;

  useEffect(() => {
    setIsFlipped(false);
    setShowAnswer(false);
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setShowAnswer(true);
    }
  };

  const handleMaster = () => {
    if (current) {
      setMastered(new Set([...mastered, current.id]));
      nextCard();
    }
  };

  const handleReview = () => {
    if (current) {
      setReview(new Set([...review, current.id]));
      nextCard();
    }
  };

  const nextCard = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (onComplete) {
        onComplete(mastered.size, vocabulary.length);
      }
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setMastered(new Set());
    setReview(new Set());
    setIsFlipped(false);
    setShowAnswer(false);
  };

  if (!current) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-complete">
          <svg className="complete-icon" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '1rem' }}>Hoàn thành!</h2>
          <div className="mastery-stats">
            <div className="stat-item">
              <div className="stat-number">{mastered.size}</div>
              <div className="stat-label">Đã thuộc</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{review.size}</div>
              <div className="stat-label">Cần ôn lại</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={reset}>
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ôn lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      <div className="flashcard-header">
        <div className="flashcard-progress">
          <span>{currentIndex + 1} / {vocabulary.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <div className="flashcard-stats">
          <span className="stat-badge mastered">
            <svg style={{ width: '14px', height: '14px', display: 'inline', marginRight: '0.25rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
            {mastered.size}
          </span>
          <span className="stat-badge review">
            <svg style={{ width: '14px', height: '14px', display: 'inline', marginRight: '0.25rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {review.size}
          </span>
        </div>
      </div>

      <div 
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
      >
        <div className="flashcard-front">
          <div className="flashcard-content">
            <div className="flashcard-word">
              {current.kanji || current.word}
            </div>
            <div className="flashcard-hiragana">
              {current.hiragana}
            </div>
            <div className="flashcard-hint">
              <svg style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Nhấn để xem nghĩa
            </div>
          </div>
        </div>
        <div className="flashcard-back">
          <div className="flashcard-content">
            <div className="flashcard-meaning">
              {current.meaning}
            </div>
            {current.example && (
              <div className="flashcard-example">
                <div className="example-jp">{current.example}</div>
                {current.exampleTranslation && (
                  <div className="example-vi">{current.exampleTranslation}</div>
                )}
              </div>
            )}
            <div className="flashcard-hint">
              <svg style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Nhấn để quay lại
            </div>
          </div>
        </div>
      </div>

      {showAnswer && (
        <div className="flashcard-actions">
          <button 
            className="btn btn-review" 
            onClick={handleReview}
          >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ôn lại
          </button>
          <button 
            className="btn btn-master" 
            onClick={handleMaster}
          >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Đã thuộc
          </button>
        </div>
      )}
    </div>
  );
};

export default Flashcard;

