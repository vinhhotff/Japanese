import { useState, useEffect } from 'react';
import { Vocabulary } from '../types';
import '../styles/learning-sections-premium.css';

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
        <div className="flashcard-complete" style={{ textAlign: 'center' }}>
          <svg className="complete-icon" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', color: 'var(--success-color)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--text-primary)' }}>Xong rồi!</h2>
          <div className="mastery-stats" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
            <div className="stat-item">
              <div className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--success-color)' }}>{mastered.size}</div>
              <div className="stat-label" style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Đã thuộc</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--warning-color)' }}>{review.size}</div>
              <div className="stat-label" style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Cần ôn lại</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={reset}>
            Ôn lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      <div className="flashcard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="flashcard-progress" style={{ flex: 1 }}>
          <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{currentIndex + 1} / {vocabulary.length}</span>
          <div className="progress-bar" style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div
              className="progress-fill"
              style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }}
            ></div>
          </div>
        </div>
        <div className="flashcard-stats" style={{ marginLeft: '2rem', display: 'flex', gap: '0.5rem' }}>
          <span className="stat-badge mastered" style={{ background: 'var(--success-light)', color: 'var(--success-color)', padding: '0.4rem 0.8rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem' }}>
            {mastered.size} Thuộc
          </span>
          <span className="stat-badge review" style={{ background: 'var(--warning-light)', color: 'var(--warning-color)', padding: '0.4rem 0.8rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem' }}>
            {review.size} Ôn
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
            <div className="flashcard-hiragana" style={{ fontSize: '1.5rem', marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              {current.hiragana}
            </div>
            <div className="flashcard-hint" style={{ marginTop: '2rem', color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: '600' }}>
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
              <div className="flashcard-example" style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div className="example-jp" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{current.example}</div>
                {current.exampleTranslation && (
                  <div className="example-vi" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{current.exampleTranslation}</div>
                )}
              </div>
            )}
            <div className="flashcard-hint" style={{ marginTop: '2rem', color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: '600' }}>
              Nhấn để quay lại
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', minHeight: '50px' }}>
        {showAnswer && (
          <>
            <button
              className="btn btn-outline"
              onClick={(e) => { e.stopPropagation(); handleReview(); }}
              style={{ borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}
            >
              Cần ôn lại
            </button>
            <button
              className="btn btn-primary"
              onClick={(e) => { e.stopPropagation(); handleMaster(); }}
              style={{ background: 'var(--success-color)' }}
            >
              Đã thuộc
            </button>
          </>
        )}
      </div>
    </div>
  );
};


export default Flashcard;

