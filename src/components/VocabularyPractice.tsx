import { useState, useRef, useEffect } from 'react';
import { speakText, getAvailableVoices } from '../utils/speech';
import '../App.css';

type Language = 'japanese' | 'chinese';

interface VocabularyItem {
  kanji: string;
  hiragana: string;
  meaning: string;
}

interface ChineseVocabularyItem {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

const VocabularyPractice = () => {
  const [language, setLanguage] = useState<Language>('japanese');
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [chineseVocabList, setChineseVocabList] = useState<ChineseVocabularyItem[]>([]);
  const [importText, setImportText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [incorrectWords, setIncorrectWords] = useState<VocabularyItem[]>([]);
  const [incorrectChineseWords, setIncorrectChineseWords] = useState<ChineseVocabularyItem[]>([]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(3);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const parseVocabularyList = (text: string): VocabularyItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const vocab: VocabularyItem[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split('=');
      if (parts.length >= 2) {
        const kanji = parts[0].trim();
        const hiragana = parts[1].trim();
        const meaning = parts[2]?.trim() || '';
        
        if (kanji && hiragana) {
          vocab.push({ kanji, hiragana, meaning });
        }
      }
    });

    return vocab;
  };

  const parseChineseVocabularyList = (text: string): ChineseVocabularyItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const vocab: ChineseVocabularyItem[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split('=');
      if (parts.length >= 2) {
        const hanzi = parts[0].trim();
        const pinyin = parts[1].trim();
        const meaning = parts[2]?.trim() || '';
        
        if (hanzi && pinyin) {
          vocab.push({ hanzi, pinyin, meaning });
        }
      }
    });

    return vocab;
  };

  const handleImport = () => {
    if (!importText.trim()) {
      alert('Vui lòng nhập danh sách từ vựng');
      return;
    }

    if (language === 'japanese') {
      const parsed = parseVocabularyList(importText);
      if (parsed.length === 0) {
        alert('Không tìm thấy từ vựng hợp lệ. Format: kanji=hiragana=tiếng việt');
        return;
      }
      setVocabList(parsed);
      setIncorrectWords([]);
    } else {
      const parsed = parseChineseVocabularyList(importText);
      if (parsed.length === 0) {
        alert('Không tìm thấy từ vựng hợp lệ. Format: hanzi=pinyin=tiếng việt');
        return;
      }
      setChineseVocabList(parsed);
      setIncorrectChineseWords([]);
    }

    setCurrentIndex(0);
    setStarted(true);
    setCompleted(false);
    setUserInput('');
    setShowAnswer(false);
    setIsCorrect(null);
  };

  const handleCheckAnswer = () => {
    if (!userInput.trim()) return;

    const normalizedInput = userInput.trim().toLowerCase();
    let correct = false;

    if (language === 'japanese') {
      const current = vocabList[currentIndex];
      const normalizedHiragana = current.hiragana.toLowerCase();
      correct = normalizedInput === normalizedHiragana;

      if (!correct) {
        setIncorrectWords(prev => {
          if (!prev.find(w => w.kanji === current.kanji)) {
            return [...prev, current];
          }
          return prev;
        });
      }
    } else {
      const current = chineseVocabList[currentIndex];
      const normalizedPinyin = current.pinyin.toLowerCase();
      correct = normalizedInput === normalizedPinyin;

      if (!correct) {
        setIncorrectChineseWords(prev => {
          if (!prev.find(w => w.hanzi === current.hanzi)) {
            return [...prev, current];
          }
          return prev;
        });
      }
    }

    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const handleSkip = () => {
    if (language === 'japanese') {
      const current = vocabList[currentIndex];
      setIncorrectWords(prev => {
        if (!prev.find(w => w.kanji === current.kanji)) {
          return [...prev, current];
        }
        return prev;
      });
    } else {
      const current = chineseVocabList[currentIndex];
      setIncorrectChineseWords(prev => {
        if (!prev.find(w => w.hanzi === current.hanzi)) {
          return [...prev, current];
        }
        return prev;
      });
    }

    setShowAnswer(true);
    setSkipping(true);
    setSkipCountdown(3);

    // Countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      setSkipCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto skip after 3 seconds
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
    }
    skipTimeoutRef.current = setTimeout(() => {
      handleNext();
    }, 3000);
  };

  const handleNext = () => {
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const totalWords = language === 'japanese' ? vocabList.length : chineseVocabList.length;
    
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowAnswer(false);
      setIsCorrect(null);
      setSkipping(false);
      setSkipCountdown(3);
    } else {
      setCompleted(true);
      setStarted(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setUserInput('');
    setShowAnswer(false);
    setIsCorrect(null);
    setIncorrectWords([]);
    setCompleted(false);
    setStarted(true);
    setSkipping(false);
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
    }
  };

  const handlePlayAudio = async () => {
    try {
      if (language === 'japanese' && vocabList[currentIndex]) {
        const text = vocabList[currentIndex].hiragana;
        console.log('Playing Japanese:', text);
        await speakText(text, { 
          lang: 'ja-JP',
          rate: 0.75,
          pitch: 1.0,
          volume: 1.0
        });
      } else if (language === 'chinese' && chineseVocabList[currentIndex]) {
        const text = chineseVocabList[currentIndex].hanzi;
        console.log('Playing Chinese:', text);
        
        // Đảm bảo voices đã được load
        if (window.speechSynthesis.getVoices().length === 0) {
          console.log('Waiting for voices to load...');
          await new Promise(resolve => {
            window.speechSynthesis.onvoiceschanged = () => {
              console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
              resolve(true);
            };
          });
        }
        
        await speakText(text, { 
          lang: 'zh-CN',
          rate: 0.7,
          pitch: 1.0,
          volume: 1.0
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Không thể phát âm. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    // Log available voices for debugging
    const logVoices = () => {
      const voices = getAvailableVoices();
      console.log('Available voices:', voices.length);
      const chineseVoices = voices.filter(v => v.lang.startsWith('zh'));
      console.log('Chinese voices:', chineseVoices.map(v => `${v.name} (${v.lang})`));
      const japaneseVoices = voices.filter(v => v.lang.startsWith('ja'));
      console.log('Japanese voices:', japaneseVoices.map(v => `${v.name} (${v.lang})`));
    };

    // Voices might not be loaded immediately
    if (window.speechSynthesis.getVoices().length > 0) {
      logVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = logVoices;
    }

    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const totalWords = language === 'japanese' ? vocabList.length : chineseVocabList.length;
  const progress = totalWords > 0 ? ((currentIndex + 1) / totalWords) * 100 : 0;
  const currentWord = language === 'japanese' ? vocabList[currentIndex] : null;
  const currentChineseWord = language === 'chinese' ? chineseVocabList[currentIndex] : null;

  if (completed) {
    return (
      <div className="container">
        <div className="header">
          <h1>
            <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Hoàn thành!
          </h1>
        </div>

        <div className="practice-result-card">
          <div className="result-summary">
            <div className="summary-item">
              <div className="summary-value">{vocabList.length}</div>
              <div className="summary-label">Tổng số từ</div>
            </div>
            <div className="summary-item">
              <div className="summary-value correct">{vocabList.length - incorrectWords.length}</div>
              <div className="summary-label">Đã thuộc</div>
            </div>
            <div className="summary-item">
              <div className="summary-value incorrect">{incorrectWords.length}</div>
              <div className="summary-label">Chưa thuộc</div>
            </div>
          </div>

          {incorrectWords.length > 0 && (
            <div className="incorrect-words-section">
              <h3>📖 Danh sách từ chưa thuộc</h3>
              <div className="incorrect-words-list">
                {incorrectWords.map((word, index) => (
                  <div key={index} className="incorrect-word-item">
                    <div className="word-kanji">{word.kanji}</div>
                    <div className="word-hiragana">{word.hiragana}</div>
                    <div className="word-meaning">{word.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button className="btn btn-primary" onClick={handleReset}>
              🔄 Làm lại
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setVocabList([]);
              setImportText('');
              setCompleted(false);
              setStarted(false);
              setIncorrectWords([]);
            }}>
              📝 Nhập danh sách mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="container">
        <div className="header">
          <h1>
            <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Luyện Từ Vựng
          </h1>
          <p>Chọn ngôn ngữ và nhập danh sách từ vựng để luyện tập</p>
        </div>

        {/* Language Tabs */}
        <div className="tab-container" style={{ marginBottom: '2rem' }}>
          <button
            className={`tab ${language === 'japanese' ? 'active' : ''}`}
            onClick={() => {
              setLanguage('japanese');
              setImportText('');
            }}
          >
            <span className="tab-icon">🇯🇵</span>
            <span className="tab-text">Tiếng Nhật</span>
          </button>
          <button
            className={`tab ${language === 'chinese' ? 'active' : ''}`}
            onClick={() => {
              setLanguage('chinese');
              setImportText('');
            }}
          >
            <span className="tab-icon">🇨🇳</span>
            <span className="tab-text">Tiếng Trung</span>
          </button>
        </div>

        <div className="practice-import-card">
          <div className="import-instructions">
            <h3>📝 Hướng dẫn nhập từ vựng</h3>
            {language === 'japanese' ? (
              <>
                <p>Format: <code>kanji=hiragana=tiếng việt</code></p>
                <p>Mỗi từ trên một dòng</p>
                <div className="example-box">
                  <strong>Ví dụ:</strong>
                  <pre>{`学生=がくせい=sinh viên
私=わたし=tôi
本=ほん=sách`}</pre>
                </div>
              </>
            ) : (
              <>
                <p>Format: <code>hanzi=pinyin=tiếng việt</code></p>
                <p>Mỗi từ trên một dòng</p>
                <div className="example-box">
                  <strong>Ví dụ:</strong>
                  <pre>{`你好=nǐ hǎo=xin chào
谢谢=xiè xie=cảm ơn
再见=zài jiàn=tạm biệt`}</pre>
                </div>
              </>
            )}
          </div>

          <div className="import-form">
            <label>Danh sách từ vựng:</label>
            <textarea
              className="import-textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={language === 'japanese' 
                ? "学生=がくせい=sinh viên&#10;私=わたし=tôi&#10;本=ほん=sách"
                : "你好=nǐ hǎo=xin chào&#10;谢谢=xiè xie=cảm ơn&#10;再见=zài jiàn=tạm biệt"
              }
              rows={10}
            />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleImport}>
                Bắt đầu luyện tập
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={async () => {
                  try {
                    const testText = language === 'japanese' ? 'こんにちは' : '你好';
                    const testLang = language === 'japanese' ? 'ja-JP' : 'zh-CN';
                    console.log('Testing voice:', testText, testLang);
                    await speakText(testText, { 
                      lang: testLang,
                      rate: language === 'japanese' ? 0.75 : 0.7,
                      pitch: 1.0,
                      volume: 1.0
                    });
                  } catch (error) {
                    console.error('Test voice error:', error);
                    alert('Lỗi: ' + error);
                  }
                }}
                title="Test giọng nói"
              >
                🔊 Test giọng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="practice-header">
        <h2>Luyện Từ Vựng {language === 'japanese' ? '🇯🇵' : '🇨🇳'}</h2>
        <div className="practice-progress">
          <div className="progress-info">
            Từ {currentIndex + 1} / {totalWords}
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="practice-card">
        <div className="practice-kanji-display">
          <div className="kanji-large">
            {language === 'japanese' ? currentWord?.kanji : currentChineseWord?.hanzi}
          </div>
          {showAnswer && (
            <div className="answer-display">
              <div className="hiragana-answer">
                {language === 'japanese' ? currentWord?.hiragana : currentChineseWord?.pinyin}
              </div>
              {(language === 'japanese' ? currentWord?.meaning : currentChineseWord?.meaning) && (
                <div className="meaning-answer">
                  {language === 'japanese' ? currentWord?.meaning : currentChineseWord?.meaning}
                </div>
              )}
            </div>
          )}
        </div>

        {!showAnswer && (
          <div className="practice-input-section">
            <label>{language === 'japanese' ? 'Gõ hiragana:' : 'Gõ pinyin:'}</label>
            <input
              type="text"
              className="practice-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userInput.trim()) {
                  handleCheckAnswer();
                }
              }}
              placeholder={language === 'japanese' ? 'Nhập hiragana...' : 'Nhập pinyin...'}
              autoFocus
            />
            <div className="practice-actions">
              <button
                className="btn btn-primary"
                onClick={handleCheckAnswer}
                disabled={!userInput.trim()}
              >
                Kiểm tra
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSkip}
              >
                Bỏ qua
              </button>
              <button
                className="btn btn-play"
                onClick={handlePlayAudio}
                title="Nghe phát âm"
              >
                🔊
              </button>
            </div>
          </div>
        )}

        {showAnswer && (
          <div className="practice-feedback">
            <div className={`feedback-message ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <>
                  <div className="feedback-icon">✅</div>
                  <div className="feedback-text">Chính xác!</div>
                </>
              ) : (
                <>
                  <div className="feedback-icon">⚠️</div>
                  <div className="feedback-text">Sai rồi</div>
                  <div className="feedback-correct-answer">
                    Đáp án đúng: <strong>
                      {language === 'japanese' ? currentWord?.hiragana : currentChineseWord?.pinyin}
                    </strong>
                  </div>
                </>
              )}
            </div>
            {skipping && (
              <div className="skip-countdown">
                Tự động chuyển sau <strong>{skipCountdown}</strong> giây...
              </div>
            )}
            <button className="btn btn-primary" onClick={handleNext}>
              {currentIndex < totalWords - 1 ? 'Từ tiếp theo →' : 'Hoàn thành'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyPractice;

