import { useState } from 'react';
import { ListeningExercise } from '../types';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../utils/speech';
import AudioPlayer from './AudioPlayer';
import '../App.css';

interface ListeningSectionProps {
  listening: ListeningExercise[];
}

const ListeningSection = ({ listening }: ListeningSectionProps) => {
  const [selectedExercise, setSelectedExercise] = useState<ListeningExercise | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index); // 0->A,1->B...

  const handleSpeak = async (text: string, id: string) => {
    if (isSpeaking && speakingId === id) {
      stopSpeaking();
      setIsSpeaking(false);
      setSpeakingId(null);
      return;
    }

    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    setIsSpeaking(true);
    setSpeakingId(id);
    
    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
      alert('Có lỗi xảy ra khi phát âm');
    } finally {
      setIsSpeaking(false);
      setSpeakingId(null);
    }
  };

  // Màn hình chọn bài nghe
  if (!selectedExercise) {
    return (
      <div className="section-container listening-section">
        <div className="section-header listening-header">
          <div className="section-icon listening-icon">
            <svg style={{ width: '40px', height: '40px', color: 'var(--warning-color)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <div>
            <h2>Luyện nghe</h2>
            <p>Chọn bài nghe để bắt đầu luyện tập</p>
          </div>
        </div>
        <div className="section-content">
          {listening.length > 0 ? (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {listening.map((exercise, index) => (
                <div key={exercise.id} className="listening-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedExercise(exercise)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px', 
                      background: 'var(--warning-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 className="exercise-title" style={{ marginBottom: '0.5rem' }}>{exercise.title}</h3>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span>
                          <svg style={{ width: '16px', height: '16px', display: 'inline', marginRight: '0.25rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {exercise.questions.length} câu hỏi
                        </span>
                        {exercise.audioUrl && (
                          <span>
                            <svg style={{ width: '16px', height: '16px', display: 'inline', marginRight: '0.25rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            Có audio
                          </span>
                        )}
                      </div>
                    </div>
                    <svg style={{ width: '24px', height: '24px', color: 'var(--warning-color)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {exercise.imageUrl && (
                    <div className="listening-image-wrapper" style={{ marginTop: '1rem' }}>
                      <img src={exercise.imageUrl} alt={exercise.title} className="listening-image" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Bài này chưa có bài tập nghe</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Màn hình làm bài đã chọn
  const currentQuestion = selectedExercise.questions[currentQuestionIndex];
  const isCorrect = selectedAnswers[currentQuestion.id] === currentQuestion.correctAnswer;

  return (
    <div className="section-container listening-section">
      <div className="section-header listening-header">
        <button 
          className="btn btn-outline"
          onClick={() => {
            setSelectedExercise(null);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setShowAnswers(false);
            setShowTranscript(false);
          }}
          style={{ marginRight: '1rem' }}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
        <div className="section-icon listening-icon">
          <svg style={{ width: '40px', height: '40px', color: '#f59e0b' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </div>
        <div>
          <h2>{selectedExercise.title}</h2>
          <p>Câu {currentQuestionIndex + 1} / {selectedExercise.questions.length}</p>
        </div>
      </div>
      <div className="section-content">
        <div className="listening-card">
          {selectedExercise.imageUrl && (
            <div className="listening-image-wrapper">
              <img src={selectedExercise.imageUrl} alt={selectedExercise.title} className="listening-image" />
            </div>
          )}
          
          {selectedExercise.audioUrl && (
            <AudioPlayer src={selectedExercise.audioUrl} title="🎧 Nghe bài tập" />
          )}
          
          <div className="transcript-box">
            <div className="transcript-header">
              <div className="transcript-label">📝 Transcript:</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {showTranscript ? (
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                  {showTranscript ? 'Ẩn transcript' : 'Hiện transcript'}
                </button>
                <button
                  className={`btn-speak ${isSpeaking && speakingId === selectedExercise.id ? 'speaking' : ''}`}
                  onClick={() => handleSpeak(selectedExercise.transcript, selectedExercise.id)}
                  disabled={!isSpeechSynthesisSupported()}
                  title="Phát âm transcript"
                >
                  {isSpeaking && speakingId === selectedExercise.id ? (
                    <>
                      <svg className="speak-icon" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Dừng
                    </>
                  ) : (
                    <>
                      <svg className="speak-icon" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Phát âm
                    </>
                  )}
                </button>
              </div>
            </div>
            {showTranscript && (
              <div className="transcript-text">{selectedExercise.transcript}</div>
            )}
          </div>

          <div className="questions-section">
            <div className="questions-header">
              <div className="questions-title">❓ Câu hỏi:</div>
              <button
                className="btn btn-outline"
                onClick={() => setShowAnswers(!showAnswers)}
              >
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {showAnswers ? (
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
                {showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án'}
              </button>
            </div>

            <div className="question-card">
              <div className="question-text">{currentQuestion.question}</div>
              <div className="options-list">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === idx;
                  const isCorrectOption = idx === currentQuestion.correctAnswer;

                  return (
                    <label
                      key={idx}
                      className={`option-item ${
                        showAnswers && isCorrectOption ? 'correct-answer' : ''
                      } ${showAnswers && isSelected && !isCorrect ? 'wrong-answer' : ''}`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={idx}
                        checked={isSelected}
                        onChange={() =>
                          setSelectedAnswers({ ...selectedAnswers, [currentQuestion.id]: idx })
                        }
                      />
                      <span className="option-text">
                        <span className="option-letter">{getOptionLabel(idx)}.</span>{' '}
                        <span>{option}</span>
                        {showAnswers && isCorrectOption && ' ✓'}
                      </span>
                    </label>
                  );
                })}
              </div>
              {showAnswers && (
                <div className="answer-explanation">
                  <strong>Đáp án đúng:</strong> {currentQuestion.options[currentQuestion.correctAnswer]}
                </div>
              )}
              <div className="question-navigation" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                    setShowAnswers(false);
                  }}
                  disabled={currentQuestionIndex === 0}
                >
                  <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                  Câu trước
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setCurrentQuestionIndex(Math.min(selectedExercise.questions.length - 1, currentQuestionIndex + 1));
                    setShowAnswers(false);
                  }}
                  disabled={currentQuestionIndex === selectedExercise.questions.length - 1}
                >
                  Câu tiếp theo
                  <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningSection;

