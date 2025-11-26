import { useState, useEffect } from 'react';
import { getVocabulary } from '../services/supabaseService';
import { speakText } from '../utils/speech';
import '../App.css';

interface VocabItem {
  id: string;
  word: string;
  kanji?: string;
  hiragana: string;
  meaning: string;
}

interface ReviewItem extends VocabItem {
  nextReview: number; // timestamp
  interval: number; // days
  ease: number; // ease factor
  repetitions: number;
}

const SpacedRepetition = () => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ReviewItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewItems();
  }, []);

  const loadReviewItems = async () => {
    try {
      const allVocab = await getVocabulary();
      const stored = localStorage.getItem('spaced_repetition');
      const savedItems: Record<string, ReviewItem> = stored ? JSON.parse(stored) : {};

      const items: ReviewItem[] = allVocab.map((v: any) => {
        const saved = savedItems[v.id];
        if (saved && saved.nextReview > Date.now()) {
          return saved;
        }
        return {
          id: v.id,
          word: v.word,
          kanji: v.kanji,
          hiragana: v.hiragana,
          meaning: v.meaning,
          nextReview: Date.now(),
          interval: 0,
          ease: 2.5,
          repetitions: 0
        };
      });

      // Filter items due for review
      const dueItems = items.filter(item => item.nextReview <= Date.now());
      if (dueItems.length > 0) {
        setReviewItems(dueItems);
        setCurrentItem(dueItems[0]);
      } else {
        // All items reviewed, show next scheduled reviews
        const upcoming = items
          .filter(item => item.nextReview > Date.now())
          .sort((a, b) => a.nextReview - b.nextReview);
        setReviewItems(upcoming);
      }
    } catch (error) {
      console.error('Error loading review items:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextReview = (quality: number, item: ReviewItem): ReviewItem => {
    // SM-2 Algorithm simplified
    let { interval, ease, repetitions } = item;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    return {
      ...item,
      interval,
      ease,
      repetitions,
      nextReview
    };
  };

  const handleReview = (quality: number) => {
    if (!currentItem) return;

    const updated = calculateNextReview(quality, currentItem);
    const stored = localStorage.getItem('spaced_repetition');
    const savedItems: Record<string, ReviewItem> = stored ? JSON.parse(stored) : {};
    savedItems[updated.id] = updated;
    localStorage.setItem('spaced_repetition', JSON.stringify(savedItems));

    // Remove current item and move to next
    const remaining = reviewItems.filter(item => item.id !== currentItem.id);
    setReviewItems(remaining);
    setCurrentItem(remaining.length > 0 ? remaining[0] : null);
    setShowAnswer(false);
  };

  const handlePlayAudio = async () => {
    if (currentItem) {
      await speakText(currentItem.hiragana);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (reviewItems.length === 0) {
    return (
      <div className="container">
        <div className="header">
          <h1>🎉 Tuyệt vời!</h1>
          <p>Bạn đã hoàn thành tất cả từ cần ôn tập hôm nay</p>
        </div>
        <div className="empty-state">
          <p>Hãy quay lại vào ngày mai để tiếp tục ôn tập</p>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Ôn Tập Spaced Repetition
        </h1>
        <p>Còn {reviewItems.length} từ cần ôn tập</p>
      </div>

      <div className="srs-card">
        <div className="srs-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((reviewItems.length - reviewItems.indexOf(currentItem) - 1) / reviewItems.length) * 100}%` }}
            ></div>
          </div>
          <span>{reviewItems.length - reviewItems.indexOf(currentItem)} / {reviewItems.length}</span>
        </div>

        <div className="srs-question">
          {!showAnswer ? (
            <>
              <div className="srs-kanji-display">
                {currentItem.kanji ? (
                  <div className="kanji-large">{currentItem.kanji}</div>
                ) : (
                  <div className="kanji-large">{currentItem.word}</div>
                )}
              </div>
              <button className="btn btn-play" onClick={handlePlayAudio}>
                🔊 Nghe phát âm
              </button>
            </>
          ) : (
            <div className="srs-answer">
              <div className="answer-kanji">{currentItem.kanji || currentItem.word}</div>
              <div className="answer-hiragana">{currentItem.hiragana}</div>
              <div className="answer-meaning">{currentItem.meaning}</div>
            </div>
          )}
        </div>

        {!showAnswer ? (
          <button className="btn btn-primary" onClick={() => setShowAnswer(true)}>
            Hiện đáp án
          </button>
        ) : (
          <div className="srs-quality-buttons">
            <p>Bạn nhớ từ này như thế nào?</p>
            <div className="quality-grid">
              <button
                className="btn btn-quality again"
                onClick={() => handleReview(0)}
              >
                ❌ Quên<br />1 phút
              </button>
              <button
                className="btn btn-quality hard"
                onClick={() => handleReview(1)}
              >
                ⚠️ Khó<br />10 phút
              </button>
              <button
                className="btn btn-quality good"
                onClick={() => handleReview(3)}
              >
                ✅ Tốt<br />1 ngày
              </button>
              <button
                className="btn btn-quality easy"
                onClick={() => handleReview(5)}
              >
                🎉 Dễ<br />4 ngày
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacedRepetition;

