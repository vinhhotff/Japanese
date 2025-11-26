import { useState } from 'react';
import { ListeningExercise } from '../types';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../utils/speech';
import '../App.css';

interface ListeningSectionProps {
  listening: ListeningExercise[];
}

const ListeningSection = ({ listening }: ListeningSectionProps) => {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

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

  return (
    <div className="section-container listening-section">
      <div className="section-header listening-header">
        <div className="section-icon listening-icon">
          <svg style={{ width: '40px', height: '40px', color: '#f59e0b' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </div>
        <div>
          <h2>Luyện nghe</h2>
          <p>Nghe và làm bài tập để cải thiện kỹ năng nghe</p>
        </div>
      </div>
      <div className="section-content">
        {listening.length > 0 ? (
          listening.map((exercise) => (
            <div key={exercise.id} className="listening-card">
              <h3 className="exercise-title">{exercise.title}</h3>
              
              {exercise.imageUrl && (
                <div className="listening-image-wrapper">
                  <img src={exercise.imageUrl} alt={exercise.title} className="listening-image" />
                </div>
              )}
              
              {exercise.audioUrl && (
                <div className="audio-player-wrapper">
                  <audio controls className="audio-player">
                    <source src={exercise.audioUrl} type="audio/mpeg" />
                    Trình duyệt của bạn không hỗ trợ audio.
                  </audio>
                </div>
              )}
              
              <div className="transcript-box">
                <div className="transcript-header">
                  <div className="transcript-label">📝 Transcript:</div>
                  <button
                    className={`btn-speak ${isSpeaking && speakingId === exercise.id ? 'speaking' : ''}`}
                    onClick={() => handleSpeak(exercise.transcript, exercise.id)}
                    disabled={!isSpeechSynthesisSupported()}
                    title="Phát âm transcript"
                  >
                    {isSpeaking && speakingId === exercise.id ? (
                      <>
                        <span className="speak-icon">⏸️</span>
                        Dừng phát âm
                      </>
                    ) : (
                      <>
                        <span className="speak-icon">🔊</span>
                        Phát âm
                      </>
                    )}
                  </button>
                </div>
                <div className="transcript-text">{exercise.transcript}</div>
              </div>
              <div className="questions-section">
                <div className="questions-header">
                  <div className="questions-title">❓ Câu hỏi:</div>
                  <button
                    className="btn btn-outline"
                    onClick={() => setShowAnswers({ ...showAnswers, [exercise.id]: !showAnswers[exercise.id] })}
                  >
                    {showAnswers[exercise.id] ? 'Ẩn đáp án' : 'Hiện đáp án'}
                  </button>
                </div>
                {exercise.questions.map((q) => {
                  const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                  const showAnswer = showAnswers[exercise.id];
                  
                  return (
                    <div key={q.id} className="question-card">
                      <div className="question-text">{q.question}</div>
                      <div className="options-list">
                        {q.options.map((option, idx) => {
                          const isSelected = selectedAnswers[q.id] === idx;
                          const isCorrectOption = idx === q.correctAnswer;
                          
                          return (
                            <label 
                              key={idx} 
                              className={`option-item ${
                                showAnswer && isCorrectOption ? 'correct-answer' : ''
                              } ${showAnswer && isSelected && !isCorrect ? 'wrong-answer' : ''}`}
                            >
                              <input 
                                type="radio" 
                                name={q.id} 
                                value={idx}
                                checked={isSelected}
                                onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: idx })}
                              />
                              <span className="option-text">
                                {option}
                                {showAnswer && isCorrectOption && ' ✓'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {showAnswer && (
                        <div className="answer-explanation">
                          <strong>Đáp án đúng:</strong> {q.options[q.correctAnswer]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Bài này chưa có bài tập nghe</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListeningSection;

