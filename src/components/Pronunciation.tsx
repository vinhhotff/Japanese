import { useState, useRef } from 'react';
import { Vocabulary } from '../types';
import { startSpeechRecognition, isSpeechRecognitionSupported, compareJapaneseText, speakText } from '../utils/speech';
import { evaluateExercise } from '../services/aiService';
import '../App.css';

interface PronunciationProps {
  vocabulary: Vocabulary[];
}

const Pronunciation = ({ vocabulary }: PronunciationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<{ match: boolean; similarity: number } | null>(null);
  const [aiFeedback, setAiFeedback] = useState<{ score: number; feedback: string; tips: string } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  const currentVocab = vocabulary[currentIndex];

  const handleStartRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    if (!currentVocab) return;

    setIsRecording(true);
    setTranscript('');
    setResult(null);
    setAiFeedback(null);

    const stopRecording = startSpeechRecognition(
      'ja-JP',
      async (recognitionResult) => {
        setTranscript(recognitionResult.transcript);
        setIsRecording(false);

        // 1. Basic Comparison (Fast)
        const expected = currentVocab.hiragana || currentVocab.word;
        const comparison = compareJapaneseText(expected, recognitionResult.transcript);
        setResult(comparison);

        // 2. AI Advanced Evaluation (Rich)
        setLoadingAI(true);
        try {
          const aiRes = await evaluateExercise('pronunciation', expected, recognitionResult.transcript);
          setAiFeedback(aiRes);
        } catch (e) {
          console.error('AI Eval Error:', e);
        } finally {
          setLoadingAI(false);
        }
      },
      (error) => {
        alert(error);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    stopRecordingRef.current = stopRecording;
  };

  const handleStopRecording = () => {
    if (stopRecordingRef.current) {
      stopRecordingRef.current();
      stopRecordingRef.current = null;
    }
    setIsRecording(false);
  };

  const handleNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTranscript('');
      setResult(null);
    } else {
      setCurrentIndex(0);
      setTranscript('');
      setResult(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setTranscript('');
      setResult(null);
    }
  };

  const handlePlayAudio = async () => {
    if (currentVocab) {
      await speakText(currentVocab.hiragana || currentVocab.word);
    }
  };

  if (vocabulary.length === 0) {
    return (
      <div className="section-container">
        <div className="empty-state">
          <p>Chưa có từ vựng để luyện phát âm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container pronunciation-section">
      <div className="section-header">
        <div className="section-icon">
          <svg style={{ width: '40px', height: '40px', color: 'var(--jp-primary, #b91c2c)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <h2>Luyện Phát Âm</h2>
          <p>Luyện phát âm từng từ vựng một cách chi tiết</p>
        </div>
      </div>

      <div className="pronunciation-content">
        <div className="pronunciation-progress">
          Từ {currentIndex + 1} / {vocabulary.length}
        </div>

        <div className="pronunciation-card">
          <div className="vocab-display-large">
            {currentVocab.kanji && (
              <div className="vocab-kanji-extra-large">{currentVocab.kanji}</div>
            )}
            <div className="vocab-hiragana-extra-large">{currentVocab.hiragana}</div>
            <div className="vocab-meaning-large">{currentVocab.meaning}</div>
          </div>

          <div className="pronunciation-actions">
            <button className="btn btn-play-large" onClick={handlePlayAudio}>
              <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Nghe phát âm
            </button>

            {!isRecording ? (
              <button className="btn btn-record-large" onClick={handleStartRecording}>
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Bắt đầu ghi âm
              </button>
            ) : (
              <button className="btn btn-stop-large" onClick={handleStopRecording}>
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Dừng ghi âm
              </button>
            )}
          </div>

          {transcript && (
            <div className="pronunciation-result">
              <div className="result-label">Bạn đã nói:</div>
              <div className="result-text">{transcript}</div>
            </div>
          )}

          {loadingAI && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--jp-primary, #b91c2c)' }}>
              <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ fontSize: '0.9rem' }}>AI đang phân tích phát âm của bạn...</p>
            </div>
          )}

          {aiFeedback && (
            <div className="ai-feedback-container" style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              animation: 'slideUp 0.4s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--jp-primary, #b91c2c)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 10px rgba(185, 28, 44, 0.3)'
                }}>
                  {aiFeedback.score}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--jp-primary, #b91c2c)', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Đánh giá</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{aiFeedback.score >= 80 ? 'Rất tuyệt vời!' : aiFeedback.score >= 50 ? 'Khá tốt!' : 'Cần cố gắng thêm'}</div>
                </div>
              </div>

              <p style={{ margin: '0 0 1rem 0', lineHeight: 1.5, color: 'var(--text-primary)' }}>{aiFeedback.feedback}</p>

              {aiFeedback.tips && (
                <div style={{
                  padding: '1rem',
                  background: 'var(--card-bg)',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  borderLeft: '4px solid var(--jp-primary, #b91c2c)'
                }}>
                  <strong>Mẹo:</strong> {aiFeedback.tips}
                </div>
              )}
            </div>
          )}

          {result && !aiFeedback && !loadingAI && (
            <div className={`pronunciation-feedback ${result.match ? 'match' : 'no-match'}`}>
              <div className="feedback-icon">{result.match ? '✅' : '⚠️'}</div>
              <div className="feedback-text">
                {result.match ? 'Phát âm tốt!' : 'Cần cải thiện'}
              </div>
              <div className="feedback-similarity">
                Độ tương đồng: {Math.round(result.similarity)}%
              </div>
            </div>
          )}

          <div className="pronunciation-navigation">
            <button
              className="btn btn-nav"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Trước
            </button>
            <button className="btn btn-nav" onClick={handleNext}>
              Sau →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pronunciation;

