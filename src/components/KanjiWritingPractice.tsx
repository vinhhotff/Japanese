import { useState, useRef, useEffect } from 'react';
import { getKanji } from '../services/supabaseService';
import '../App.css';

interface KanjiItem {
  id: string;
  character: string;
  meaning: string;
  onyomi?: string[];
  kunyomi?: string[];
  strokeCount?: number;
}

const KanjiWritingPractice = () => {
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'stroke' | 'meaning' | 'reading'>('meaning');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    loadKanji();
  }, []);

  const loadKanji = async () => {
    try {
      setLoading(true);
      setError(null);
      const allKanji = await getKanji();
      
      if (!allKanji || allKanji.length === 0) {
        setError('Không có kanji nào. Vui lòng thêm kanji trong Admin Panel.');
        setLoading(false);
        return;
      }

      const shuffled = allKanji.sort(() => Math.random() - 0.5).slice(0, 20);
      const mappedKanji = shuffled.map((k: any) => ({
        id: k.id,
        character: k.character || '',
        meaning: k.meaning || '',
        onyomi: Array.isArray(k.onyomi) ? k.onyomi : [],
        kunyomi: Array.isArray(k.kunyomi) ? k.kunyomi : [],
        strokeCount: k.stroke_count || undefined
      })).filter((k: KanjiItem) => k.character && k.meaning);

      if (mappedKanji.length === 0) {
        setError('Không có kanji hợp lệ để luyện tập.');
        setLoading(false);
        return;
      }

      setKanjiList(mappedKanji);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading kanji:', error);
      setError('Lỗi khi tải kanji: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const currentKanji = kanjiList[currentIndex];

  const handleNext = () => {
    if (currentIndex < kanjiList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      clearCanvas();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
      clearCanvas();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải kanji...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="header">
          <h1>Luyện Viết Kanji</h1>
        </div>
        <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadKanji} style={{ marginTop: '1rem' }}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (kanjiList.length === 0) {
    return (
      <div className="container">
        <div className="header">
          <h1>Luyện Viết Kanji</h1>
        </div>
        <div className="empty-state">
          <p>Không có kanji để luyện tập</p>
          <button className="btn btn-primary" onClick={loadKanji} style={{ marginTop: '1rem' }}>
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentKanji) {
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
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Luyện Viết Kanji
        </h1>
        <p>Luyện tập viết và nhớ kanji</p>
      </div>

      <div className="kanji-practice-mode">
        <button
          className={`mode-btn ${practiceMode === 'meaning' ? 'active' : ''}`}
          onClick={() => setPracticeMode('meaning')}
        >
          Nghĩa → Kanji
        </button>
        <button
          className={`mode-btn ${practiceMode === 'reading' ? 'active' : ''}`}
          onClick={() => setPracticeMode('reading')}
        >
          Đọc → Kanji
        </button>
        <button
          className={`mode-btn ${practiceMode === 'stroke' ? 'active' : ''}`}
          onClick={() => setPracticeMode('stroke')}
        >
          Viết Kanji
        </button>
      </div>

      <div className="kanji-practice-card">
        <div className="practice-progress">
          Kanji {currentIndex + 1} / {kanjiList.length}
        </div>

        {practiceMode === 'meaning' && (
          <div className="kanji-practice-content">
            <div className="practice-question">
              <h2>Nghĩa: {currentKanji.meaning}</h2>
              <p>Hãy viết kanji này</p>
            </div>
            <div className="kanji-answer-display">
              {showAnswer ? (
                <div className="kanji-large">{currentKanji.character}</div>
              ) : (
                <div className="kanji-placeholder">?</div>
              )}
            </div>
          </div>
        )}

        {practiceMode === 'reading' && (
          <div className="kanji-practice-content">
            <div className="practice-question">
              <h2>
                {currentKanji.onyomi && currentKanji.onyomi.length > 0 && (
                  <span>Onyomi: {currentKanji.onyomi.join(', ')}</span>
                )}
                {currentKanji.kunyomi && currentKanji.kunyomi.length > 0 && (
                  <span>Kunyomi: {currentKanji.kunyomi.join(', ')}</span>
                )}
              </h2>
              <p>Hãy viết kanji này</p>
            </div>
            <div className="kanji-answer-display">
              {showAnswer ? (
                <div className="kanji-large">{currentKanji.character}</div>
              ) : (
                <div className="kanji-placeholder">?</div>
              )}
            </div>
          </div>
        )}

        {practiceMode === 'stroke' && (
          <div className="kanji-practice-content">
            <div className="practice-question">
              <h2>Kanji: {currentKanji.character}</h2>
              <p>Nghĩa: {currentKanji.meaning}</p>
              {currentKanji.strokeCount && (
                <p>Số nét: {currentKanji.strokeCount}</p>
              )}
            </div>
            <div className="kanji-writing-area">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="kanji-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <button className="btn btn-secondary" onClick={clearCanvas}>
                Xóa
              </button>
            </div>
          </div>
        )}

        <div className="practice-actions">
          {practiceMode !== 'stroke' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}
            </button>
          )}
          <div className="navigation-buttons">
            <button
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Trước
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={currentIndex === kanjiList.length - 1}
            >
              Sau →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanjiWritingPractice;

