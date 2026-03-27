import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { getLessons, type Language } from '../services/supabaseService.v2';
import { evaluateExercise } from '../services/aiService';
import { JapanFlag, ChinaFlag } from './icons/Icons';
import '../App.css';
import '../styles/spaced-repetition.css';

interface KanjiItem {
  id: string;
  character: string;
  meaning: string;
  onyomi?: string[];
  kunyomi?: string[];
  pinyin?: string;
  radical?: string;
  simplified?: string;
  traditional?: string;
  strokeCount?: number;
  level?: string;
}

interface KanjiWritingPracticeProps {
  language?: Language;
}

const KanjiWritingPractice = ({ language }: KanjiWritingPracticeProps) => {
  const navigate = useNavigate();
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'stroke' | 'meaning' | 'reading'>('meaning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [validationResult, setValidationResult] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState<{ score: number; feedback: string; tips: string } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Helper wrapper for timeout
  const withTimeout = <T,>(promise: Promise<T> | PromiseLike<T>, ms = 5000): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 5 seconds')), ms)
    );
    return Promise.race([Promise.resolve(promise), timeoutPromise]);
  };

  useEffect(() => {
    if (selectedLevel && language) {
      loadKanji(selectedLevel);
    }
  }, [language, selectedLevel]);

  const loadKanji = async (level: string) => {
    console.log('Starting loadKanji for level:', level);
    console.log('Language:', language);
    try {
      setLoading(true);
      setError(null);

      // 1. Get lessons for this level
      console.log('Fetching lessons for level:', level);
      console.time('getLessons');

      const lessonsResponse = await getLessons(undefined, language, level as any, 1, 100);
      console.timeEnd('getLessons');

      const lessons = lessonsResponse.data;
      console.log('Lessons response:', {
        found: lessons?.length,
        total: lessonsResponse.total,
        page: lessonsResponse.page
      });

      if (!lessons || lessons.length === 0) {
        setError(`Không có bài học nào cho cấp độ ${level}. Vui lòng thêm bài học trong Admin Panel.`);
        setLoading(false);
        return;
      }

      const lessonIds = lessons.map(l => l.id);
      console.log('Lesson IDs:', lessonIds);

      // 2. Get kanji for these lessons
      console.log('Fetching kanji for', lessonIds.length, 'lessons');
      console.time('getKanji');

      const { data: allKanji, error: queryError } = await supabase
        .from('kanji')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: true });

      console.timeEnd('getKanji');

      if (queryError) {
        console.error('Kanji query error:', queryError);
        throw queryError;
      }

      console.log('Kanji found:', allKanji?.length);

      if (!allKanji || allKanji.length === 0) {
        setError(`Không có ${language === 'japanese' ? 'kanji' : 'hán tự'} nào cho cấp độ ${level}. Vui lòng thêm trong Admin Panel.`);
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
        pinyin: k.pinyin || undefined,
        radical: k.radical || undefined,
        simplified: k.simplified || undefined,
        traditional: k.traditional || undefined,
        strokeCount: k.stroke_count || undefined,
        level: k.level || level
      })).filter((k: KanjiItem) => k.character && k.meaning);

      if (mappedKanji.length === 0) {
        setError(`Không có ${language === 'japanese' ? 'kanji' : 'hán tự'} hợp lệ để luyện tập.`);
        setLoading(false);
        return;
      }

      setKanjiList(mappedKanji);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading kanji:', error);
      setError(`Lỗi khi tải ${language === 'japanese' ? 'kanji' : 'hán tự'}: ` + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const currentKanji = kanjiList[currentIndex];

  const handleNext = () => {
    if (currentIndex < kanjiList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setValidationResult(null);
      setScore(0);
      clearCanvas();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
      setValidationResult(null);
      setScore(0);
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
      setValidationResult(null);
      setScore(0);
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

  const getBoundingBox = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 20) { // Threshold for "drawn"
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    return found ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null;
  };

  const checkWriting = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentKanji) return;

    // 1. Get User Drawing
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const userBox = getBoundingBox(ctx, canvas.width, canvas.height);
    if (!userBox) {
      alert("Bạn chưa viết gì cả!");
      return;
    }

    // 2. Normalize User Input (Resize to 100x100)
    const normalizedSize = 100;
    const userCanvas = document.createElement('canvas');
    userCanvas.width = normalizedSize;
    userCanvas.height = normalizedSize;
    const userCtx = userCanvas.getContext('2d');
    if (!userCtx) return;

    // Draw trimmed user image scaled to 100x100
    userCtx.drawImage(
      canvas,
      userBox.x, userBox.y, userBox.w, userBox.h,
      0, 0, normalizedSize, normalizedSize
    );
    const updatedUserData = userCtx.getImageData(0, 0, normalizedSize, normalizedSize).data;

    // 3. Generate Reference (Correct Kanji)
    const refCanvas = document.createElement('canvas');
    refCanvas.width = canvas.width;
    refCanvas.height = canvas.height;
    const refCtx = refCanvas.getContext('2d');
    if (!refCtx) return;

    // Draw centered text
    refCtx.font = `bold ${canvas.width * 0.8}px \"Noto Sans JP\", sans-serif`;
    refCtx.fillStyle = 'black';
    refCtx.textAlign = 'center';
    refCtx.textBaseline = 'middle';
    refCtx.fillText(currentKanji.character, canvas.width / 2, canvas.height / 2);

    const refBox = getBoundingBox(refCtx, canvas.width, canvas.height);
    if (!refBox) return; // Should not happen

    // Normalize Reference (Resize to 100x100)
    const normRefCanvas = document.createElement('canvas');
    normRefCanvas.width = normalizedSize;
    normRefCanvas.height = normalizedSize;
    const normRefCtx = normRefCanvas.getContext('2d');
    if (!normRefCtx) return;

    normRefCtx.drawImage(
      refCanvas,
      refBox.x, refBox.y, refBox.w, refBox.h,
      0, 0, normalizedSize, normalizedSize
    );
    const updatedRefData = normRefCtx.getImageData(0, 0, normalizedSize, normalizedSize).data;

    // 4. Compare Pixel by Pixel
    let intersection = 0; // Both filled
    let union = 0;        // Either filled
    let targetArea = 0;   // Reference filled

    for (let i = 0; i < updatedUserData.length; i += 4) {
      const userAlpha = updatedUserData[i + 3];
      const refAlpha = updatedRefData[i + 3];

      const userFilled = userAlpha > 50; // Threshold
      const refFilled = refAlpha > 50;

      if (userFilled || refFilled) {
        union++;
      }
      if (userFilled && refFilled) {
        intersection++;
      }
      if (refFilled) {
        targetArea++;
      }
    }

    // 5. Calculate Score
    const overlapScore = (intersection / targetArea) * 100; // Coverage
    const accuracyScore = (intersection / union) * 100; // Loosely IoU

    // 5. Calculate Score (Local)
    const finalScore = Math.round((overlapScore * 0.6) + (accuracyScore * 0.4));
    setScore(finalScore);

    // 6. AI Detailed Evaluation (Cloud)
    setLoadingAI(true);
    try {
      const imageData = canvas.toDataURL('image/png');
      const aiRes = await evaluateExercise('writing', currentKanji.character, '', language || 'japanese', imageData);
      setAiFeedback(aiRes);

      // Use AI score if local score is low but AI says it's ok
      if (aiRes.score > finalScore) {
        setScore(aiRes.score);
      }

      if (aiRes.score >= 60 || finalScore >= 50) {
        setValidationResult('correct');
      } else {
        setValidationResult('incorrect');
      }
    } catch (e) {
      console.error('AI Eval Writing Error:', e);
      if (finalScore >= 50) setValidationResult('correct');
      else setValidationResult('incorrect');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="container" data-language={language}>
        <div className="loading">Đang tải {language === 'japanese' ? 'kanji' : 'hán tự'}...</div>
      </div>
    );
  }

  // Language selection screen
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

            <span className="title-highlight">Kanji & Hán Tự</span>
          </h1>
          <p>Chọn ngôn ngữ bạn muốn luyện viết</p>
        </div>
        <div className="lang-selection">
          <button
            type="button"
            onClick={() => navigate('/japanese/kanji-writing')}
            className="feature-card feature-card-japanese"
          >
            <div className="lang-card-badge lang-card-badge--jp" aria-hidden>
              JP
            </div>
            <h3>Luyện Viết Kanji (JLPT)</h3>
          </button>
          <button
            type="button"
            onClick={() => navigate('/chinese/hanzi-writing')}
            className="feature-card feature-card-chinese"
          >
            <div className="lang-card-badge lang-card-badge--cn" aria-hidden>
              CN
            </div>
            <h3>Luyện Viết Hán Tự (HSK)</h3>
          </button>
        </div>
      </div>
    );
  }

  // Level selection screen
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
            <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="title-text">Luyện Viết</span>
            <span className="title-highlight">{language === 'japanese' ? 'Kanji' : 'Hán Tự'}</span>
          </h1>
          <p>Chọn cấp độ để bắt đầu luyện viết</p>
          <button className="back-button" onClick={() => navigate('/kanji-writing')}>← Chọn ngôn ngữ khác</button>
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

  if (error) {
    return (
      <div className="container" data-language={language}>
        <div className="header">
          <h1>
            <span className="title-text">Luyện Viết</span>
            <span className="title-highlight">{language === 'japanese' ? 'Kanji' : 'Hán Tự'}</span>
          </h1>
        </div>
        <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => loadKanji(selectedLevel!)} style={{ marginTop: '1rem' }}>
            Thử lại
          </button>
          <button className="btn btn-secondary" onClick={() => setSelectedLevel(null)} style={{ marginTop: '1rem', marginLeft: '1rem' }}>
            Chọn cấp độ khác
          </button>
        </div>
      </div>
    );
  }

  if (kanjiList.length === 0) {
    return (
      <div className="container" data-language={language}>
        <div className="header">
          <h1>
            <span className="title-text">Luyện Viết</span>
            <span className="title-highlight">{language === 'japanese' ? 'Kanji' : 'Hán Tự'}</span>
          </h1>
        </div>
        <div className="empty-state">
          <p>Không có {language === 'japanese' ? 'kanji' : 'hán tự'} để luyện tập</p>
          <button className="btn btn-primary" onClick={() => loadKanji(selectedLevel!)} style={{ marginTop: '1rem' }}>
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentKanji) {
    return (
      <div className="container" data-language={language}>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container" data-language={language}>
      <div className="header">
        <h1>

          <span className="title-highlight">Luyện Viết {language === 'japanese' ? 'Kanji' : 'Hán Tự'}</span>
          <span className="title-text">({selectedLevel})</span>
        </h1>
        <p>Luyện tập viết và nhớ {language === 'japanese' ? 'kanji' : 'hán tự'}</p>
        <button
          onClick={() => setSelectedLevel(null)}
          className="back-button"
        >
          ← Chọn cấp độ khác
        </button>
      </div>

      <div className="kanji-practice-mode">
        <button
          className={`mode-btn ${practiceMode === 'meaning' ? 'active' : ''}`}
          onClick={() => setPracticeMode('meaning')}
        >
          Nghĩa → {language === 'japanese' ? 'Kanji' : 'Hán tự'}
        </button>
        <button
          className={`mode-btn ${practiceMode === 'reading' ? 'active' : ''}`}
          onClick={() => setPracticeMode('reading')}
        >
          {language === 'japanese' ? 'Đọc' : 'Pinyin'} → {language === 'japanese' ? 'Kanji' : 'Hán tự'}
        </button>
        <button
          className={`mode-btn ${practiceMode === 'stroke' ? 'active' : ''}`}
          onClick={() => setPracticeMode('stroke')}
        >
          Viết {language === 'japanese' ? 'Kanji' : 'Hán tự'}
        </button>
      </div>

      <div className="kanji-practice-card">
        <div className="practice-progress">
          {language === 'japanese' ? 'Kanji' : 'Hán tự'} {currentIndex + 1} / {kanjiList.length}
        </div>

        {practiceMode === 'meaning' && (
          <div className="kanji-practice-content">
            <div className="practice-question">
              <h2>Nghĩa: {currentKanji.meaning}</h2>
              <p>Hãy viết {language === 'japanese' ? 'kanji' : 'hán tự'} này</p>
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
              <div style={{ marginBottom: '1rem' }}>
                {language === 'japanese' ? (
                  <>
                    {currentKanji.onyomi && currentKanji.onyomi.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Onyomi (音読み):</strong> {currentKanji.onyomi.join(', ')}
                      </div>
                    )}
                    {currentKanji.kunyomi && currentKanji.kunyomi.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Kunyomi (訓読み):</strong> {currentKanji.kunyomi.join(', ')}
                      </div>
                    )}
                    {(!currentKanji.onyomi || currentKanji.onyomi.length === 0) &&
                      (!currentKanji.kunyomi || currentKanji.kunyomi.length === 0) && (
                        <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                          <strong>Nghĩa:</strong> {currentKanji.meaning}
                          <br />
                          <span style={{ fontSize: '0.875rem' }}>(Chưa có thông tin đọc âm)</span>
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    {currentKanji.pinyin && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Pinyin:</strong> {currentKanji.pinyin}
                      </div>
                    )}
                    {currentKanji.radical && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Bộ thủ:</strong> {currentKanji.radical}
                      </div>
                    )}
                    {!currentKanji.pinyin && (
                      <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        <strong>Nghĩa:</strong> {currentKanji.meaning}
                        <br />
                        <span style={{ fontSize: '0.875rem' }}>(Chưa có thông tin pinyin)</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <p>Hãy viết {language === 'japanese' ? 'kanji' : 'hán tự'} này</p>
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
              <div
                style={{
                  position: 'relative',
                  width: '300px',
                  height: '300px',
                  border: validationResult === 'correct' ? '4px solid #10b981' : validationResult === 'incorrect' ? '4px solid #ef4444' : '4px solid #e5e7eb',
                  borderRadius: '16px',
                  transition: 'border-color 0.3s'
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="kanji-canvas"
                  style={{ borderRadius: '12px' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />

                {/* Result Overlay */}
                {validationResult && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                    {validationResult === 'correct' ? (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '99px',
                        fontWeight: 'bold',
                        fontSize: '1.5rem',
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>🎉</span> Chính xác ({score}%)
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '99px',
                        fontWeight: 'bold',
                        fontSize: '1.5rem',
                        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>❌</span> Sai rồi ({score}%)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {loadingAI && (
                <div style={{ marginTop: '1rem', textAlign: 'center', color: '#3b82f6' }}>
                  <div className="spinner-small" style={{ margin: '0 auto 0.5rem' }}></div>
                  <p style={{ fontSize: '0.8rem' }}>AI đang chấm điểm nét viết...</p>
                </div>
              )}

              {aiFeedback && (
                <div className="ai-writing-feedback" style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '12px',
                  borderLeft: `4px solid ${aiFeedback.score >= 60 ? '#10b981' : '#ef4444'}`,
                  maxWidth: '300px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b', marginBottom: '0.25rem' }}>AI FEEDBACK:</div>
                  <p style={{ fontSize: '0.85rem', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>{aiFeedback.feedback}</p>
                  {aiFeedback.tips && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      💡 {aiFeedback.tips}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    clearCanvas();
                    setValidationResult(null);
                  }}
                >
                  Xóa
                </button>
                <button
                  className="btn btn-primary"
                  onClick={checkWriting}
                  style={{ minWidth: '120px' }}
                >
                  Kiểm tra
                </button>
              </div>
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

