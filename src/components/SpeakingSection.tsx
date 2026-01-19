import { useState, useRef } from 'react';
import { SpeakingExercise, Vocabulary } from '../types';
import { startSpeechRecognition, isSpeechRecognitionSupported, compareJapaneseText, speakText, isSpeechSynthesisSupported } from '../utils/speech';
import { evaluateExercise } from '../services/aiService';
import '../App.css';

interface SpeakingSectionProps {
  speaking: SpeakingExercise[];
  vocabulary?: Vocabulary[];
}

const SpeakingSection = ({ speaking, vocabulary = [] }: SpeakingSectionProps) => {
  const [recordingStates, setRecordingStates] = useState<Record<string, {
    isRecording: boolean;
    transcript: string;
    confidence: number | null;
    isAnalyzing: boolean;
    result: {
      match: boolean;
      similarity: number;
      differences: string[];
    } | null;
    aiFeedback?: { score: number; feedback: string; tips: string } | null;
  }>>({});

  const [vocabRecordingStates, setVocabRecordingStates] = useState<Record<string, {
    isRecording: boolean;
    transcript: string;
    confidence: number | null;
    isAnalyzing: boolean;
    result: {
      match: boolean;
      similarity: number;
      differences: string[];
    } | null;
    aiFeedback?: { score: number; feedback: string; tips: string } | null;
  }>>({});

  const [activeTab, setActiveTab] = useState<'exercises' | 'vocabulary'>('exercises');

  const stopRecordingRefs = useRef<Record<string, () => void>>({});

  const handleStartRecording = (exerciseId: string, expectedText?: string) => {
    if (!isSpeechRecognitionSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome hoặc Edge.');
      return;
    }

    setRecordingStates((prev: any) => ({
      ...prev,
      [exerciseId]: {
        isRecording: true,
        transcript: '',
        confidence: null,
        isAnalyzing: false,
        result: null
      }
    }));

    const stopRecording = startSpeechRecognition(
      'ja-JP',
      (result) => {
        setRecordingStates(prev => ({
          ...prev,
          [exerciseId]: {
            ...prev[exerciseId],
            transcript: result.transcript,
            confidence: result.confidence,
            isRecording: false
          }
        }));

        // Compare with expected text if available
        if (expectedText) {
          setRecordingStates(prev => ({
            ...prev,
            [exerciseId]: {
              ...prev[exerciseId],
              isAnalyzing: true
            }
          }));

          // Local comparison first
          const comparison = compareJapaneseText(expectedText, result.transcript);

          // AI Evaluation
          evaluateExercise('pronunciation', expectedText, result.transcript)
            .then(aiRes => {
              setRecordingStates((prev: any) => ({
                ...prev,
                [exerciseId]: {
                  ...prev[exerciseId],
                  isAnalyzing: false,
                  result: comparison,
                  aiFeedback: aiRes
                }
              }));
            })
            .catch(e => {
              console.error('AI Eval Error:', e);
              setRecordingStates((prev: any) => ({
                ...prev,
                [exerciseId]: {
                  ...prev[exerciseId],
                  isAnalyzing: false,
                  result: comparison
                }
              }));
            });
        }
      },
      (error: string) => {
        alert(error);
        setRecordingStates((prev: any) => ({
          ...prev,
          [exerciseId]: {
            ...prev[exerciseId],
            isRecording: false
          }
        }));
      },
      () => {
        setRecordingStates((prev: any) => ({
          ...prev,
          [exerciseId]: {
            ...prev[exerciseId],
            isRecording: false
          }
        }));
      }
    );

    stopRecordingRefs.current[exerciseId] = stopRecording;
  };

  const handleStopRecording = (exerciseId: string) => {
    if (stopRecordingRefs.current[exerciseId]) {
      stopRecordingRefs.current[exerciseId]();
      delete stopRecordingRefs.current[exerciseId];
    }
  };

  const handlePlayExample = async (text: string) => {
    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
      alert('Có lỗi xảy ra khi phát âm');
    }
  };

  const handlePlayRecording = async (text: string) => {
    if (!text) return;

    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
      alert('Có lỗi xảy ra khi phát âm');
    }
  };

  // Vocabulary speaking handlers
  const handleStartVocabRecording = (vocabId: string, vocab: Vocabulary) => {
    if (!isSpeechRecognitionSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome hoặc Edge.');
      return;
    }

    setVocabRecordingStates((prev: any) => ({
      ...prev,
      [vocabId]: {
        isRecording: true,
        transcript: '',
        confidence: null,
        isAnalyzing: false,
        result: null
      }
    }));

    const stopRecording = startSpeechRecognition(
      'ja-JP',
      (result: any) => {
        setVocabRecordingStates((prev: any) => ({
          ...prev,
          [vocabId]: {
            ...prev[vocabId],
            transcript: result.transcript,
            confidence: result.confidence,
            isRecording: false
          }
        }));

        // Compare with both kanji and hiragana
        setVocabRecordingStates((prev: any) => ({
          ...prev,
          [vocabId]: {
            ...prev[vocabId],
            isAnalyzing: true
          }
        }));

        const expectedTexts = [
          vocab.hiragana,
          vocab.kanji || vocab.word,
          vocab.word
        ].filter(Boolean) as string[];

        const primaryExpected = vocab.hiragana || vocab.word;

        // Compare locally for quick feedback
        let bestMatch = { match: false, similarity: 0, differences: [] as string[] };
        for (const expected of expectedTexts) {
          const comparison = compareJapaneseText(expected, result.transcript);
          if (comparison.similarity > bestMatch.similarity) {
            bestMatch = comparison;
          }
        }

        // AI Evaluation
        evaluateExercise('pronunciation', primaryExpected, result.transcript)
          .then(aiRes => {
            setVocabRecordingStates((prev: any) => ({
              ...prev,
              [vocabId]: {
                ...prev[vocabId],
                isAnalyzing: false,
                result: bestMatch,
                aiFeedback: aiRes
              }
            }));
          })
          .catch(e => {
            console.error('AI Vocab Eval Error:', e);
            setVocabRecordingStates((prev: any) => ({
              ...prev,
              [vocabId]: {
                ...prev[vocabId],
                isAnalyzing: false,
                result: bestMatch
              }
            }));
          });
      },
      (error: string) => {
        alert(error);
        setVocabRecordingStates((prev: any) => ({
          ...prev,
          [vocabId]: {
            ...prev[vocabId],
            isRecording: false
          }
        }));
      },
      () => {
        setVocabRecordingStates((prev: any) => ({
          ...prev,
          [vocabId]: {
            ...prev[vocabId],
            isRecording: false
          }
        }));
      }
    );

    stopRecordingRefs.current[`vocab-${vocabId}`] = stopRecording;
  };

  const handleStopVocabRecording = (vocabId: string) => {
    if (stopRecordingRefs.current[`vocab-${vocabId}`]) {
      stopRecordingRefs.current[`vocab-${vocabId}`]();
      delete stopRecordingRefs.current[`vocab-${vocabId}`];
    }
  };

  const handlePlayVocab = async (text: string) => {
    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
      alert('Có lỗi xảy ra khi phát âm');
    }
  };

  const state = (exerciseId: string) => recordingStates[exerciseId] || {
    isRecording: false,
    transcript: '',
    confidence: null,
    isAnalyzing: false,
    result: null
  };

  const vocabState = (vocabId: string) => vocabRecordingStates[vocabId] || {
    isRecording: false,
    transcript: '',
    confidence: null,
    isAnalyzing: false,
    result: null
  };

  return (
    <div className="section-container speaking-section">
      <div className="section-header speaking-header">
        <div className="section-icon speaking-icon">
          <svg style={{ width: '40px', height: '40px', color: '#ef4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <h2>Luyện nói</h2>
          <p>Thực hành phát âm và giao tiếp bằng tiếng Nhật</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="speaking-tabs">
        <button
          className={`speaking-tab ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          📝 Bài tập nói
          {speaking.length > 0 && <span className="tab-badge">{speaking.length}</span>}
        </button>
        {vocabulary.length > 0 && (
          <button
            className={`speaking-tab ${activeTab === 'vocabulary' ? 'active' : ''}`}
            onClick={() => setActiveTab('vocabulary')}
          >
            📖 Luyện từ vựng
            <span className="tab-badge">{vocabulary.length}</span>
          </button>
        )}
      </div>

      <div className="section-content">
        {activeTab === 'exercises' && (
          <>
            {speaking.length > 0 ? (
              speaking.map((exercise) => {
                const currentState = state(exercise.id);
                return (
                  <div key={exercise.id} className="speaking-card">
                    <h3 className="exercise-title">{exercise.title}</h3>
                    <div className="prompt-box">
                      <div className="prompt-header">
                        <div className="prompt-label">📋 Đề bài:</div>
                        {exercise.exampleResponse && (
                          <button
                            className="btn-play-example"
                            onClick={() => handlePlayExample(exercise.exampleResponse!)}
                            title="Nghe ví dụ"
                          >
                            🔊 Nghe ví dụ
                          </button>
                        )}
                      </div>
                      <div className="prompt-text">{exercise.prompt}</div>
                    </div>
                    {exercise.exampleResponse && (
                      <div className="example-response-box">
                        <div className="example-label">💡 Ví dụ trả lời:</div>
                        <div className="example-response-text">{exercise.exampleResponse}</div>
                      </div>
                    )}

                    <div className="recording-controls">
                      {!currentState.isRecording ? (
                        <button
                          className="btn btn-record"
                          onClick={() => handleStartRecording(exercise.id, exercise.exampleResponse)}
                        >
                          <span className="record-icon">🎤</span>
                          Bắt đầu ghi âm
                        </button>
                      ) : (
                        <button
                          className="btn btn-stop"
                          onClick={() => handleStopRecording(exercise.id)}
                        >
                          <span className="recording-indicator">🔴</span>
                          Đang ghi âm... (Nhấn để dừng)
                        </button>
                      )}
                    </div>

                    {currentState.transcript && (
                      <div className="recording-result">
                        <div className="result-header">
                          <div className="result-label">📝 Bạn đã nói:</div>
                          <div className="result-confidence">
                            Độ chính xác: {currentState.confidence ? `${Math.round(currentState.confidence * 100)}%` : 'N/A'}
                          </div>
                        </div>
                        <div className="result-transcript">{currentState.transcript}</div>
                        <div className="result-actions">
                          <button
                            className="btn btn-play-recording"
                            onClick={() => handlePlayRecording(currentState.transcript)}
                          >
                            ▶️ Phát lại bản ghi âm
                          </button>
                        </div>
                      </div>
                    )}

                    {currentState.isAnalyzing && (
                      <div className="analyzing-indicator">
                        <span className="spinner">⏳</span>
                        Đang phân tích...
                      </div>
                    )}

                    {currentState.aiFeedback && (
                      <div className="ai-feedback-rich" style={{
                        marginTop: '1.5rem',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '20px',
                        border: '1px solid #bae6fd',
                        boxShadow: '0 4px 12px rgba(186, 230, 253, 0.2)',
                        animation: 'slideUp 0.4s ease-out'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            background: 'var(--primary-color)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.1rem'
                          }}>
                            {currentState.aiFeedback.score}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Gemini Evaluation</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{currentState.aiFeedback.score >= 80 ? 'Xuất sắc!' : 'Khá ổn!'}</div>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.95rem', margin: '0 0 0.75rem 0', color: '#1e293b' }}>{currentState.aiFeedback.feedback}</p>
                        {currentState.aiFeedback.tips && (
                          <div style={{ fontSize: '0.85rem', color: '#475569', background: 'white', padding: '0.75rem', borderRadius: '12px' }}>
                            💡 <strong>Mẹo:</strong> {currentState.aiFeedback.tips}
                          </div>
                        )}
                      </div>
                    )}

                    {currentState.result && !currentState.aiFeedback && (
                      <div className={`comparison-result ${currentState.result.match ? 'match' : 'no-match'}`}>
                        {currentState.result.match ? (
                          <>
                            <div className="result-icon">✅</div>
                            <div className="result-title">Tuyệt vời! Phát âm chính xác!</div>
                            <div className="result-similarity">
                              Độ tương đồng: {Math.round(currentState.result.similarity)}%
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="result-icon">⚠️</div>
                            <div className="result-title">Cần cải thiện phát âm</div>
                            <div className="result-similarity">
                              Độ tương đồng: {Math.round(currentState.result.similarity)}%
                            </div>
                            {currentState.result.differences.length > 0 && (
                              <div className="result-differences">
                                {currentState.result.differences.map((diff, idx) => (
                                  <div key={idx} className="difference-item">{diff}</div>
                                ))}
                              </div>
                            )}
                            <div className="result-suggestion">
                              💡 Hãy nghe lại ví dụ và thử lại nhé!
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {!isSpeechRecognitionSupported() && (
                      <div className="browser-warning">
                        ⚠️ Tính năng nhận diện giọng nói chỉ hoạt động trên Chrome, Edge hoặc Safari.
                        Vui lòng sử dụng một trong các trình duyệt này.
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>Bài này chưa có bài tập nói</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'vocabulary' && vocabulary.length > 0 && (
          <div className="vocab-speaking-list">
            <div className="vocab-speaking-header">
              <h3>Luyện phát âm từ vựng</h3>
              <p>Nghe và lặp lại các từ vựng trong bài học</p>
            </div>
            <div className="vocab-speaking-grid">
              {vocabulary.map((vocab) => {
                const currentVocabState = vocabState(vocab.id);
                const displayText = vocab.kanji || vocab.word;
                const expectedText = vocab.hiragana || vocab.word;

                return (
                  <div key={vocab.id} className="vocab-speaking-card">
                    <div className="vocab-display">
                      <div className="vocab-japanese">
                        {vocab.kanji && (
                          <span className="vocab-kanji">{vocab.kanji}</span>
                        )}
                        <span className="vocab-hiragana">{vocab.hiragana}</span>
                      </div>
                      <div className="vocab-meaning">{vocab.meaning}</div>
                    </div>

                    <div className="vocab-actions">
                      <button
                        className="btn btn-play-vocab"
                        onClick={() => handlePlayVocab(expectedText)}
                        title="Nghe phát âm"
                      >
                        🔊 Nghe
                      </button>
                      {!currentVocabState.isRecording ? (
                        <button
                          className="btn btn-record-vocab"
                          onClick={() => handleStartVocabRecording(vocab.id, vocab)}
                        >
                          🎤 Ghi âm
                        </button>
                      ) : (
                        <button
                          className="btn btn-stop-vocab"
                          onClick={() => handleStopVocabRecording(vocab.id)}
                        >
                          🔴 Dừng
                        </button>
                      )}
                    </div>

                    {currentVocabState.transcript && (
                      <div className="vocab-result">
                        <div className="result-header">
                          <div className="result-label">📝 Bạn đã nói:</div>
                          {currentVocabState.confidence && (
                            <div className="result-confidence">
                              Độ chính xác: {Math.round(currentVocabState.confidence * 100)}%
                            </div>
                          )}
                        </div>
                        <div className="result-transcript">{currentVocabState.transcript}</div>
                      </div>
                    )}

                    {currentVocabState.isAnalyzing && (
                      <div className="analyzing-indicator">
                        <span className="spinner">⏳</span>
                        Đang phân tích...
                      </div>
                    )}

                    {currentVocabState.aiFeedback && (
                      <div className="ai-vocab-feedback" style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>AI Feedback</span>
                          <span style={{ fontWeight: 800 }}>{currentVocabState.aiFeedback.score}/100</span>
                        </div>
                        <p style={{ margin: '0 0 0.5rem 0' }}>{currentVocabState.aiFeedback.feedback}</p>
                        {currentVocabState.aiFeedback.tips && (
                          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>💡 {currentVocabState.aiFeedback.tips}</div>
                        )}
                      </div>
                    )}

                    {currentVocabState.result && !currentVocabState.aiFeedback && (
                      <div className={`vocab-comparison-result ${currentVocabState.result.match ? 'match' : 'no-match'}`}>
                        {currentVocabState.result.match ? (
                          <>
                            <div className="result-icon">✅</div>
                            <div className="result-title">Phát âm chính xác!</div>
                            <div className="result-similarity">
                              Độ tương đồng: {Math.round(currentVocabState.result.similarity)}%
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="result-icon">⚠️</div>
                            <div className="result-title">Cần cải thiện</div>
                            <div className="result-similarity">
                              Độ tương đồng: {Math.round(currentVocabState.result.similarity)}%
                            </div>
                            <div className="result-suggestion">
                              💡 Hãy nghe lại và thử lại nhé!
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'vocabulary' && vocabulary.length === 0 && (
          <div className="empty-state">
            <p>Bài này chưa có từ vựng để luyện nói</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakingSection;

