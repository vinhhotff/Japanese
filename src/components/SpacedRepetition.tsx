import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getVocabularyByLevel } from '../services/supabaseService.v2';
import { speakText } from '../utils/speech';
import type { Language } from '../services/supabaseService.v2';
import { VolumeIcon, CheckIcon, XIcon, CelebrationIcon } from './icons/Icons';
import '../App.css';
import '../styles/spaced-repetition.css';

interface VocabItem {
  id: string;
  word: string;
  kanji?: string;
  character?: string;
  hiragana?: string;
  pinyin?: string;
  meaning: string;
}

interface ReviewItem extends VocabItem {
  nextReview: number; // timestamp
  interval: number; // days
  ease: number; // ease factor
  repetitions: number;
}

interface SpacedRepetitionProps {
  language?: Language;
}

const SpacedRepetition = ({ language }: SpacedRepetitionProps) => {
  const navigate = useNavigate();
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ReviewItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // New state for statistics
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });

  useEffect(() => {
    if (selectedLevel) {
      loadReviewItems(selectedLevel);
    }
  }, [selectedLevel, language]);

  const loadReviewItems = async (level: string) => {
    setLoading(true);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 }); // Reset stats
    try {
      const allVocab = await getVocabularyByLevel(level, language as Language);
      const stored = localStorage.getItem(`spaced_repetition_${language}_${level}`);
      const savedItems: Record<string, ReviewItem> = stored ? JSON.parse(stored) : {};

      const items: ReviewItem[] = allVocab.map((v: any) => {
        const saved = savedItems[v.id];
        if (saved && saved.nextReview > Date.now()) {
          return saved;
        }
        return {
          id: v.id,
          word: v.word,
          kanji: v.character || v.kanji,
          character: v.character,
          hiragana: v.hiragana,
          pinyin: v.pinyin,
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
        setSessionStats(prev => ({ ...prev, total: dueItems.length }));
      } else {
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

    // Update Stats
    if (quality >= 3) {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    const updated = calculateNextReview(quality, currentItem);

    const stored = localStorage.getItem(`spaced_repetition_${language}_${selectedLevel}`);
    const savedItems: Record<string, ReviewItem> = stored ? JSON.parse(stored) : {};
    savedItems[updated.id] = updated;
    localStorage.setItem(`spaced_repetition_${language}_${selectedLevel}`, JSON.stringify(savedItems));

    // Remove current item and move to next
    const remaining = reviewItems.filter(item => item.id !== currentItem.id);
    setReviewItems(remaining);
    setCurrentItem(remaining.length > 0 ? remaining[0] : null);
    setShowAnswer(false);
  };

  const handlePlayAudio = async () => {
    if (currentItem) {
      // Ensure voices are loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise<void>(resolve => {
          const id = setTimeout(() => resolve(), 2000); // Timeout fallback
          window.speechSynthesis.onvoiceschanged = () => {
            clearTimeout(id);
            resolve();
          };
        });
      }

      const textToSpeak = language === 'japanese'
        ? (currentItem.hiragana || currentItem.word)
        : (currentItem.pinyin || currentItem.character || currentItem.word);
      await speakText(textToSpeak);
    }
  };

  if (!language) {
    return (
      <div className="container" data-language="both">
        {/* Floating Characters Background */}
        <div className="floating-characters">
          <span className="float-char jp-char char-1">あ</span>
          <span className="float-char jp-char char-2">か</span>
          <span className="float-char jp-char char-3">さ</span>
          <span className="float-char jp-char char-4">た</span>
          <span className="float-char jp-char char-5">な</span>
          <span className="float-char jp-char char-6">は</span>
          <span className="float-char jp-char char-7">ま</span>
          <span className="float-char jp-char char-8">や</span>
          <span className="float-char jp-char char-9">ら</span>
          <span className="float-char jp-char char-10">わ</span>
          <span className="float-char jp-char char-11">学</span>
          <span className="float-char jp-char char-12">日</span>
          <span className="float-char cn-char char-1">你</span>
          <span className="float-char cn-char char-2">好</span>
          <span className="float-char cn-char char-3">学</span>
          <span className="float-char cn-char char-4">习</span>
          <span className="float-char cn-char char-5">中</span>
          <span className="float-char cn-char char-6">文</span>
          <span className="float-char cn-char char-7">汉</span>
          <span className="float-char cn-char char-8">字</span>
          <span className="float-char cn-char char-9">语</span>
          <span className="float-char cn-char char-10">言</span>
          <span className="float-char cn-char char-11">书</span>
          <span className="float-char cn-char char-12">写</span>
        </div>

        <div className="header">
          <h1>
            <span className="title-highlight">Ôn Tập Spaced Repetition</span>
          </h1>
          <p>Chọn ngôn ngữ bạn muốn ôn tập</p>
        </div>
        <div className="lang-selection">
          <button
            onClick={() => navigate('/japanese/spaced-repetition')}
            className="feature-card feature-card-japanese"
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem', fontWeight: '800' }}>
              JP
            </div>
            <h3>Tiếng Nhật (JLPT)</h3>
          </button>
          <button
            onClick={() => navigate('/chinese/spaced-repetition')}
            className="feature-card feature-card-chinese"
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem', fontWeight: '800' }}>
              CN
            </div>
            <h3>Tiếng Trung (HSK)</h3>
          </button>
        </div>
      </div>
    );
  }

  if (!selectedLevel) {
    return (
      <div className="container" data-language={language}>
        {/* Floating Characters for selected language */}
        <div className="floating-characters">
          {language === 'japanese' ? (
            <>
              <span className="float-char jp-char char-1">あ</span>
              <span className="float-char jp-char char-2">か</span>
              <span className="float-char jp-char char-3">さ</span>
              <span className="float-char jp-char char-4">た</span>
              <span className="float-char jp-char char-5">な</span>
              <span className="float-char jp-char char-6">は</span>
              <span className="float-char jp-char char-7">ま</span>
              <span className="float-char jp-char char-8">や</span>
              <span className="float-char jp-char char-9">ら</span>
              <span className="float-char jp-char char-10">わ</span>
              <span className="float-char jp-char char-11">学</span>
              <span className="float-char jp-char char-12">日</span>
            </>
          ) : (
            <>
              <span className="float-char cn-char char-1">你</span>
              <span className="float-char cn-char char-2">好</span>
              <span className="float-char cn-char char-3">学</span>
              <span className="float-char cn-char char-4">习</span>
              <span className="float-char cn-char char-5">中</span>
              <span className="float-char cn-char char-6">文</span>
              <span className="float-char cn-char char-7">汉</span>
              <span className="float-char cn-char char-8">字</span>
              <span className="float-char cn-char char-9">语</span>
              <span className="float-char cn-char char-10">言</span>
              <span className="float-char cn-char char-11">书</span>
              <span className="float-char cn-char char-12">写</span>
            </>
          )}
        </div>

        <div className="header">
          <h1>

            <span className="title-highlight">Ôn Tập Spaced Repetition</span>
          </h1>
          <p>Chọn cấp độ để bắt đầu ôn tập</p>
          <button className="back-button" onClick={() => navigate('/spaced-repetition')}>← Chọn ngôn ngữ khác</button>
        </div>

        <div className="level-grid">
          {(language === 'japanese'
            ? ['N5', 'N4', 'N3', 'N2', 'N1']
            : ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']
          ).map(lvl => (
            <button
              key={lvl}
              className="btn-level"
              onClick={() => setSelectedLevel(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải dữ liệu {selectedLevel}...</div>
      </div>
    );
  }

  if (reviewItems.length === 0) {
    return (
      <div className="container">
        <div className="header">
          <h1>
            <CelebrationIcon size={40} /> Hoàn thành xuất sắc!
          </h1>
          <p>Bạn đã hoàn thành phiên ôn tập {selectedLevel}</p>
        </div>

        {/* Session Stats Summary */}
        <div className="stats-card" style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          maxWidth: '500px',
          margin: '2rem auto',
          textAlign: 'center'
        }}>
          <h3>Thống kê phiên học</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '12px', color: '#059669' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{sessionStats.correct}</div>
              <div>Đã thuộc</div>
            </div>
            <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '12px', color: '#dc2626' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{sessionStats.incorrect}</div>
              <div>Chưa thuộc</div>
            </div>
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
            <p style={{ color: '#64748b' }}>Tổng số từ ôn tập: {sessionStats.correct + sessionStats.incorrect}</p>
          </div>
        </div>

        <div className="action-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedLevel(null)}
          >
            Chọn cấp độ khác
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setReviewItems([]);
              setCurrentItem(null);
              loadReviewItems(selectedLevel!);
            }}
          >
            Ôn tập tiếp
          </button>
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
    <div className="container" data-language={language}>
      {/* Floating Characters for selected language */}
      <div className="floating-characters">
        {language === 'japanese' ? (
          <>
            <span className="float-char jp-char char-1">あ</span>
            <span className="float-char jp-char char-2">か</span>
            <span className="float-char jp-char char-3">さ</span>
            <span className="float-char jp-char char-4">た</span>
            <span className="float-char jp-char char-5">な</span>
            <span className="float-char jp-char char-6">は</span>
            <span className="float-char jp-char char-7">ま</span>
            <span className="float-char jp-char char-8">や</span>
            <span className="float-char jp-char char-9">ら</span>
            <span className="float-char jp-char char-10">わ</span>
            <span className="float-char jp-char char-11">学</span>
            <span className="float-char jp-char char-12">日</span>
          </>
        ) : (
          <>
            <span className="float-char cn-char char-1">你</span>
            <span className="float-char cn-char char-2">好</span>
            <span className="float-char cn-char char-3">学</span>
            <span className="float-char cn-char char-4">习</span>
            <span className="float-char cn-char char-5">中</span>
            <span className="float-char cn-char char-6">文</span>
            <span className="float-char cn-char char-7">汉</span>
            <span className="float-char cn-char char-8">字</span>
            <span className="float-char cn-char char-9">语</span>
            <span className="float-char cn-char char-10">言</span>
            <span className="float-char cn-char char-11">书</span>
            <span className="float-char cn-char char-12">写</span>
          </>
        )}
      </div>

      <div className="header">
        <h1>

          <span className="title-highlight">Ôn Tập Spaced Repetition</span>
        </h1>
        <p>Còn {reviewItems.length} từ cần ôn tập</p>
        <button
          onClick={() => setSelectedLevel(null)}
          className="back-button"
        >
          ← Chọn cấp độ khác
        </button>
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
                {(currentItem.character || currentItem.kanji) ? (
                  <div className="kanji-large">{currentItem.character || currentItem.kanji}</div>
                ) : (
                  <div className="kanji-large">{currentItem.word}</div>
                )}
              </div>
              <button className="btn btn-play" onClick={handlePlayAudio}>
                <VolumeIcon size={20} /> Nghe phát âm
              </button>
            </>
          ) : (
            <div className="srs-answer">
              <div className="answer-kanji">{currentItem.character || currentItem.kanji || currentItem.word}</div>
              {language === 'japanese' ? (
                <div className="answer-hiragana">{currentItem.hiragana}</div>
              ) : (
                <div className="answer-hiragana">{currentItem.pinyin}</div>
              )}
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
            <p className="description-text">Bạn có thuộc từ này không?</p>
            <div className="quality-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <button
                className="srs-btn srs-btn-danger"
                onClick={() => handleReview(0)} // 0 = Again
              >
                <div className="srs-btn-content">
                  <XIcon size={24} />
                  <span>Không thuộc</span>
                </div>
                <span className="srs-btn-subtitle">(Ôn lại ngay)</span>
              </button>
              <button
                className="srs-btn srs-btn-success"
                onClick={() => handleReview(5)} // 5 = Easy
              >
                <div className="srs-btn-content">
                  <CheckIcon size={24} />
                  <span>Đã thuộc</span>
                </div>
                <span className="srs-btn-subtitle">(Qua từ tiếp)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacedRepetition;

