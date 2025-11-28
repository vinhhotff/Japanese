import { useState, useEffect, useRef } from 'react';
import { RoleplayScenario } from '../types';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';
import '../App.css';

interface RoleplayProps {
  scenarios: RoleplayScenario[];
}

const Roleplay = ({ scenarios }: RoleplayProps) => {
  const [currentScenario, setCurrentScenario] = useState<RoleplayScenario | null>(
    scenarios.length > 0 ? scenarios[0] : null
  );
  const [currentCharacter, setCurrentCharacter] = useState<'A' | 'B'>('A');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'classic'>('3d');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'happy' | 'thinking' | 'speaking'>('neutral');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Array<{character: string, text: string, timestamp: number}>>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{type: 'correct' | 'incorrect' | 'partial' | null, message: string}>({type: null, message: ''});
  const [showFeedback, setShowFeedback] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (viewMode === '3d' && canvasRef.current) {
      initializeAvatar();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [viewMode, avatarEmotion]);

  const initializeAvatar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 500;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw avatar based on emotion
      drawAvatar(ctx, avatarEmotion);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const drawAvatar = (ctx: CanvasRenderingContext2D, emotion: string) => {
    const centerX = 200;
    const centerY = 250;
    const time = Date.now() / 1000;
    const breathe = Math.sin(time * 2) * 3;

    // Character-specific colors and styles
    const isCharacterA = currentCharacter === 'A';
    const skinColor = isCharacterA ? '#FFE4C4' : '#F5D5B8';
    const hairColor = isCharacterA ? '#2C1810' : '#8B4513';
    const bodyColor = isCharacterA ? '#4A90E2' : '#EC4899';
    const eyeColor = isCharacterA ? '#000' : '#4A2511';

    // Head (with breathing animation)
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 50 + breathe, 80, 0, Math.PI * 2);
    ctx.fill();

    // Hair - Different styles for each character
    ctx.fillStyle = hairColor;
    if (isCharacterA) {
      // Character A: Short hair
      ctx.beginPath();
      ctx.arc(centerX, centerY - 80 + breathe, 85, Math.PI, Math.PI * 2);
      ctx.fill();
      
      // Side hair
      ctx.beginPath();
      ctx.ellipse(centerX - 70, centerY - 50 + breathe, 25, 40, 0.3, 0, Math.PI * 2);
      ctx.ellipse(centerX + 70, centerY - 50 + breathe, 25, 40, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Character B: Long hair with ponytail
      ctx.beginPath();
      ctx.arc(centerX, centerY - 80 + breathe, 85, Math.PI, Math.PI * 2);
      ctx.fill();
      
      // Long side hair
      ctx.beginPath();
      ctx.ellipse(centerX - 75, centerY - 40 + breathe, 30, 60, 0.2, 0, Math.PI * 2);
      ctx.ellipse(centerX + 75, centerY - 40 + breathe, 30, 60, -0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Ponytail
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 120 + breathe, 20, 35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes - Different styles
    const eyeY = centerY - 60 + breathe;
    if (emotion === 'speaking') {
      // Blinking animation
      const blink = Math.sin(time * 10) > 0.9 ? 2 : 15;
      ctx.fillStyle = eyeColor;
      ctx.fillRect(centerX - 30, eyeY, 15, blink);
      ctx.fillRect(centerX + 15, eyeY, 15, blink);
    } else {
      ctx.fillStyle = eyeColor;
      if (isCharacterA) {
        // Character A: Round eyes
        ctx.beginPath();
        ctx.arc(centerX - 25, eyeY, 8, 0, Math.PI * 2);
        ctx.arc(centerX + 25, eyeY, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Character B: Almond eyes
        ctx.beginPath();
        ctx.ellipse(centerX - 25, eyeY, 10, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 25, eyeY, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eye shine
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(centerX - 23, eyeY - 2, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 27, eyeY - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eyelashes for Character B
      if (!isCharacterA) {
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX - 30 + i * 5, eyeY - 8);
          ctx.lineTo(centerX - 32 + i * 5, eyeY - 12);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(centerX + 20 + i * 5, eyeY - 8);
          ctx.lineTo(centerX + 22 + i * 5, eyeY - 12);
          ctx.stroke();
        }
      }
    }

    // Eyebrows
    ctx.strokeStyle = hairColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (emotion === 'thinking') {
      ctx.moveTo(centerX - 35, eyeY - 15);
      ctx.lineTo(centerX - 15, eyeY - 18);
      ctx.moveTo(centerX + 15, eyeY - 18);
      ctx.lineTo(centerX + 35, eyeY - 15);
    } else {
      ctx.moveTo(centerX - 35, eyeY - 18);
      ctx.lineTo(centerX - 15, eyeY - 15);
      ctx.moveTo(centerX + 15, eyeY - 15);
      ctx.lineTo(centerX + 35, eyeY - 18);
    }
    ctx.stroke();

    // Mouth based on emotion
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const mouthY = centerY - 30 + breathe;
    
    if (emotion === 'happy') {
      ctx.arc(centerX, mouthY, 25, 0.2, Math.PI - 0.2);
      // Blush
      ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
      ctx.beginPath();
      ctx.ellipse(centerX - 50, centerY - 40 + breathe, 15, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(centerX + 50, centerY - 40 + breathe, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (emotion === 'thinking') {
      ctx.moveTo(centerX - 15, mouthY);
      ctx.lineTo(centerX + 15, mouthY);
    } else if (emotion === 'speaking') {
      const mouthOpen = Math.abs(Math.sin(time * 8)) * 15;
      ctx.ellipse(centerX, mouthY, 15, mouthOpen, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(centerX, mouthY + 5, 20, 0, Math.PI);
    }
    ctx.stroke();

    // Body with different colors
    ctx.fillStyle = bodyColor;
    ctx.fillRect(centerX - 60, centerY + 40 + breathe, 120, 150);
    
    // Add pattern/details to clothes
    if (isCharacterA) {
      // Character A: Collar
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.moveTo(centerX - 30, centerY + 40 + breathe);
      ctx.lineTo(centerX, centerY + 60 + breathe);
      ctx.lineTo(centerX + 30, centerY + 40 + breathe);
      ctx.closePath();
      ctx.fill();
    } else {
      // Character B: Buttons
      ctx.fillStyle = '#FFF';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY + 60 + breathe + i * 30, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Arms (with gesture animation)
    const armWave = emotion === 'happy' ? Math.sin(time * 3) * 10 : 0;
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY + 60 + breathe);
    ctx.lineTo(centerX - 100, centerY + 100 + breathe + armWave);
    ctx.moveTo(centerX + 60, centerY + 60 + breathe);
    ctx.lineTo(centerX + 100, centerY + 100 + breathe - armWave);
    ctx.stroke();

    // Hands
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(centerX - 100, centerY + 100 + breathe + armWave, 12, 0, Math.PI * 2);
    ctx.arc(centerX + 100, centerY + 100 + breathe - armWave, 12, 0, Math.PI * 2);
    ctx.fill();

    // Emotion indicator
    if (emotion === 'thinking') {
      // Thought bubble
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(centerX + 90, centerY - 100, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Small bubbles
      ctx.beginPath();
      ctx.arc(centerX + 70, centerY - 70, 10, 0, Math.PI * 2);
      ctx.arc(centerX + 60, centerY - 50, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#666';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('?', centerX + 90, centerY - 90);
    }

    // Character indicator badge
    ctx.fillStyle = isCharacterA ? '#3b82f6' : '#ec4899';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 200 + breathe, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(currentCharacter, centerX, centerY + 208 + breathe);
  };

  if (!currentScenario) {
    return (
      <div className="empty-state">
        <p>Chưa có kịch bản roleplay nào</p>
      </div>
    );
  }

  const currentScript = currentCharacter === 'A' 
    ? currentScenario.characterAScript 
    : currentScenario.characterBScript;
  
  const currentLine = currentScript[currentLineIndex];
  const isLastLine = currentLineIndex >= currentScript.length - 1;
  const isFirstLine = currentLineIndex === 0;

  const checkAnswer = (userAnswer: string): {isCorrect: boolean, type: 'correct' | 'incorrect' | 'partial', message: string} => {
    if (!currentScenario.enableScoring) {
      return {isCorrect: true, type: 'correct', message: 'Tốt lắm! Tiếp tục nào!'};
    }

    const correctAnswers = currentCharacter === 'A' 
      ? currentScenario.characterACorrectAnswers?.[currentLineIndex]
      : currentScenario.characterBCorrectAnswers?.[currentLineIndex];

    if (!correctAnswers || correctAnswers.length === 0) {
      return {isCorrect: true, type: 'correct', message: 'Tốt lắm! Tiếp tục nào!'};
    }

    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    
    // Check exact match
    for (const correctAnswer of correctAnswers) {
      if (normalizedUserAnswer === correctAnswer.trim().toLowerCase()) {
        return {
          isCorrect: true, 
          type: 'correct', 
          message: '🎉 Chính xác! Bạn đã trả lời đúng!'
        };
      }
    }

    // Check partial match (contains key phrases)
    const keyPhrases = correctAnswers.map(ans => ans.trim().toLowerCase());
    let matchCount = 0;
    for (const phrase of keyPhrases) {
      if (normalizedUserAnswer.includes(phrase) || phrase.includes(normalizedUserAnswer)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      return {
        isCorrect: true,
        type: 'partial',
        message: '👍 Gần đúng rồi! Câu trả lời của bạn có ý nghĩa tương tự.'
      };
    }

    return {
      isCorrect: false,
      type: 'incorrect',
      message: `❌ Chưa chính xác. Câu trả lời mẫu: "${correctAnswers[0]}"`
    };
  };

  const handleCheckAnswer = () => {
    const response = userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`];
    
    if (!response || response.trim() === '') {
      setFeedback({type: 'incorrect', message: '⚠️ Vui lòng nhập câu trả lời trước khi kiểm tra!'});
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
      return;
    }

    const result = checkAnswer(response);
    setFeedback({type: result.type, message: result.message});
    setShowFeedback(true);

    if (result.isCorrect) {
      if (result.type === 'correct') {
        setScore(score + 20);
        setStreak(streak + 1);
        setAvatarEmotion('happy');
      } else {
        setScore(score + 10);
        setAvatarEmotion('happy');
      }
    } else {
      setStreak(0);
      setAvatarEmotion('thinking');
    }

    setTimeout(() => {
      setShowFeedback(false);
      setAvatarEmotion('neutral');
    }, 3000);
  };

  const handleNext = () => {
    // Add to conversation history
    const response = userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`];
    if (response) {
      setConversationHistory([...conversationHistory, {
        character: currentCharacter === 'A' ? currentScenario.characterA : currentScenario.characterB,
        text: response,
        timestamp: Date.now()
      }]);
      
      // Auto-check if scoring is enabled and not already checked
      if (currentScenario.enableScoring && !showFeedback) {
        const result = checkAnswer(response);
        if (result.isCorrect) {
          if (result.type === 'correct') {
            setScore(score + 20);
            setStreak(streak + 1);
          } else {
            setScore(score + 10);
          }
        } else {
          setStreak(0);
        }
      }
    }

    setShowFeedback(false);
    setFeedback({type: null, message: ''});

    if (isLastLine) {
      if (currentCharacter === 'A') {
        setCurrentCharacter('B');
        setCurrentLineIndex(0);
        setAvatarEmotion('happy');
        setTimeout(() => setAvatarEmotion('neutral'), 1000);
      } else {
        // Scenario complete
        const finalScore = score + (streak * 5);
        alert(`🎉 Hoàn thành kịch bản!\n\n📊 Điểm số: ${finalScore}\n🔥 Streak: ${streak}\n\nBạn đã làm tuyệt vời!`);
        
        if (scenarios.length > 1) {
          const currentIndex = scenarios.findIndex(s => s.id === currentScenario.id);
          const nextIndex = (currentIndex + 1) % scenarios.length;
          setCurrentScenario(scenarios[nextIndex]);
          setCurrentCharacter('A');
          setCurrentLineIndex(0);
          setUserResponses({});
          setConversationHistory([]);
          setScore(0);
          setStreak(0);
        }
      }
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
      setAvatarEmotion('thinking');
      setTimeout(() => setAvatarEmotion('neutral'), 800);
    }
  };

  const handlePrevious = () => {
    if (isFirstLine && currentCharacter === 'B') {
      setCurrentCharacter('A');
      setCurrentLineIndex(currentScenario.characterAScript.length - 1);
    } else if (!isFirstLine) {
      setCurrentLineIndex(currentLineIndex - 1);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    setIsSpeaking(true);
    setAvatarEmotion('speaking');
    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
    } finally {
      setIsSpeaking(false);
      setAvatarEmotion('neutral');
    }
  };

  const handleUserResponse = (lineId: string, response: string) => {
    setUserResponses({ ...userResponses, [lineId]: response });
  };

  const startRecording = () => {
    setIsRecording(true);
    // TODO: Implement speech recognition
    setTimeout(() => {
      setIsRecording(false);
      alert('Tính năng nhận diện giọng nói đang được phát triển!');
    }, 2000);
  };

  return (
    <div className="section-container roleplay-section-enhanced">
      <div className="roleplay-header-enhanced">
        <div className="header-left">
          <div className="section-icon-3d">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2>🎭 Hội thoại Nhập vai 3D</h2>
            <p>Trải nghiệm giao tiếp với avatar 3D tương tác</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-icon">🔥</span>
            <span className="stat-value">{streak}</span>
          </div>
        </div>
      </div>

      <div className="view-mode-selector">
        <button
          className={`mode-btn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => setViewMode('3d')}
        >
          🎨 Chế độ 3D
        </button>
        <button
          className={`mode-btn ${viewMode === 'classic' ? 'active' : ''}`}
          onClick={() => setViewMode('classic')}
        >
          📝 Chế độ cổ điển
        </button>
      </div>

      <div className="roleplay-main-container">
        {viewMode === '3d' ? (
          <div className="roleplay-3d-view">
            <div className="avatar-stage">
              <canvas ref={canvasRef} className="avatar-canvas" />
              <div className="avatar-name-tag">
                {currentCharacter === 'A' ? currentScenario.characterA : currentScenario.characterB}
              </div>
              {showSubtitles && (
                <div className="subtitle-box">
                  <div className="subtitle-text">{currentLine}</div>
                </div>
              )}
            </div>

            <div className="interaction-panel">
              <div className="scenario-info-compact">
                <h3>{currentScenario.title}</h3>
                <p className="scenario-desc">{currentScenario.scenario}</p>
              </div>

              {/* Character Selection */}
              <div className="character-selection-3d">
                <div className="selection-label">🎭 Chọn vai diễn của bạn:</div>
                <div className="character-buttons">
                  <button
                    className={`character-select-btn ${currentCharacter === 'A' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentCharacter('A');
                      setCurrentLineIndex(0);
                      setUserResponses({});
                      setShowFeedback(false);
                      setAvatarEmotion('happy');
                      setTimeout(() => setAvatarEmotion('neutral'), 800);
                    }}
                  >
                    <div className="character-avatar-mini">
                      {currentScenario.characterA.charAt(0)}
                    </div>
                    <div className="character-info-mini">
                      <div className="character-name-mini">{currentScenario.characterA}</div>
                      <div className="character-role">Nhân vật A</div>
                    </div>
                    {currentCharacter === 'A' && <div className="active-indicator">✓</div>}
                  </button>
                  <button
                    className={`character-select-btn ${currentCharacter === 'B' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentCharacter('B');
                      setCurrentLineIndex(0);
                      setUserResponses({});
                      setShowFeedback(false);
                      setAvatarEmotion('happy');
                      setTimeout(() => setAvatarEmotion('neutral'), 800);
                    }}
                  >
                    <div className="character-avatar-mini">
                      {currentScenario.characterB.charAt(0)}
                    </div>
                    <div className="character-info-mini">
                      <div className="character-name-mini">{currentScenario.characterB}</div>
                      <div className="character-role">Nhân vật B</div>
                    </div>
                    {currentCharacter === 'B' && <div className="active-indicator">✓</div>}
                  </button>
                </div>
              </div>

              <div className="dialogue-controls-enhanced">
                <button
                  className="control-btn speak-btn"
                  onClick={() => handleSpeak(currentLine)}
                  disabled={isSpeaking}
                  title="Nghe phát âm"
                >
                  {isSpeaking ? '⏸️' : '🔊'}
                </button>
                <button
                  className="control-btn subtitle-btn"
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  title="Bật/tắt phụ đề"
                >
                  {showSubtitles ? '💬' : '🔇'}
                </button>
                <button
                  className="control-btn hint-btn"
                  onClick={() => setShowHints(!showHints)}
                  title="Hiện gợi ý"
                >
                  💡
                </button>
                <button
                  className="control-btn emotion-btn"
                  onClick={() => {
                    const emotions: Array<'neutral' | 'happy' | 'thinking' | 'speaking'> = ['neutral', 'happy', 'thinking'];
                    const currentIndex = emotions.indexOf(avatarEmotion);
                    setAvatarEmotion(emotions[(currentIndex + 1) % emotions.length]);
                  }}
                  title="Đổi cảm xúc"
                >
                  😊
                </button>
              </div>

              {showHints && (
                <div className="hints-panel-enhanced">
                  {currentScenario.vocabularyHints && currentScenario.vocabularyHints.length > 0 && (
                    <div className="hint-group">
                      <div className="hint-title">💡 Từ vựng gợi ý:</div>
                      <div className="hint-chips">
                        {currentScenario.vocabularyHints.map((hint, idx) => (
                          <span key={idx} className="hint-chip vocab-chip">{hint}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentScenario.grammarPoints && currentScenario.grammarPoints.length > 0 && (
                    <div className="hint-group">
                      <div className="hint-title">📖 Ngữ pháp:</div>
                      <div className="hint-chips">
                        {currentScenario.grammarPoints.map((point, idx) => (
                          <span key={idx} className="hint-chip grammar-chip">{point}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="response-area-enhanced">
                <div className="response-header">
                  <span className="response-label">💬 Câu trả lời của bạn:</span>
                  <button
                    className={`record-btn ${isRecording ? 'recording' : ''}`}
                    onClick={startRecording}
                    title="Ghi âm giọng nói"
                  >
                    {isRecording ? '⏺️ Đang ghi...' : '🎤 Ghi âm'}
                  </button>
                </div>
                <textarea
                  className="response-textarea-enhanced"
                  placeholder="Nhập câu trả lời bằng tiếng Nhật hoặc sử dụng ghi âm..."
                  value={userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`] || ''}
                  onChange={(e) => handleUserResponse(`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`, e.target.value)}
                  rows={3}
                />
                
                {showFeedback && (
                  <div className={`feedback-box feedback-${feedback.type}`}>
                    <div className="feedback-message">{feedback.message}</div>
                  </div>
                )}

                <div className="response-actions">
                  {userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`] && (
                    <>
                      <button
                        className="btn btn-outline btn-sm play-response-btn"
                        onClick={() => handleSpeak(userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`])}
                        disabled={isSpeaking}
                      >
                        🔊 Nghe câu của bạn
                      </button>
                      {currentScenario.enableScoring && (
                        <button
                          className="btn btn-primary btn-sm check-answer-btn"
                          onClick={handleCheckAnswer}
                        >
                          ✓ Kiểm tra đáp án
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="navigation-controls-enhanced">
                <button
                  className="nav-btn prev-btn"
                  onClick={handlePrevious}
                  disabled={isFirstLine && currentCharacter === 'A'}
                >
                  ← Trước
                </button>
                <div className="progress-display">
                  <div className="progress-text">
                    {currentCharacter === 'A' ? '👤 A' : '👤 B'} • Câu {currentLineIndex + 1}/{currentScript.length}
                  </div>
                  <div className="progress-bar-mini">
                    <div 
                      className="progress-fill-mini" 
                      style={{ width: `${((currentLineIndex + 1) / currentScript.length) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  className="nav-btn next-btn"
                  onClick={handleNext}
                >
                  {isLastLine && currentCharacter === 'B' ? '✅ Hoàn thành' : 'Tiếp →'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Classic view (original design)
          <div className="roleplay-classic-view">
            <div className="roleplay-card">
              {currentScenario.imageUrl && (
                <div className="roleplay-image-wrapper">
                  <img src={currentScenario.imageUrl} alt={currentScenario.title} className="roleplay-image" />
                </div>
              )}

              <div className="roleplay-info">
                <h3 className="roleplay-title">{currentScenario.title}</h3>
                <div className="roleplay-meta">
                  <span className={`badge badge-${currentScenario.difficulty || 'medium'}`}>
                    {currentScenario.difficulty === 'easy'
                      ? 'Dễ'
                      : currentScenario.difficulty === 'hard'
                      ? 'Khó'
                      : 'Trung bình'}
                  </span>
                </div>
                {currentScenario.description && (
                  <p className="roleplay-description">{currentScenario.description}</p>
                )}
                <div className="roleplay-scenario-box">
                  <div className="scenario-label">📖 Tình huống:</div>
                  <div className="scenario-text">{currentScenario.scenario}</div>
                </div>
              </div>

              <div className="roleplay-characters">
                <div className={`character-card ${currentCharacter === 'A' ? 'active' : ''}`}>
                  <div className="character-avatar">
                    <span>{currentScenario.characterA.charAt(0)}</span>
                  </div>
                  <div className="character-name">{currentScenario.characterA}</div>
                  <div className="character-label">Nhân vật A</div>
                  <button
                    className="btn btn-outline btn-sm character-switch-btn"
                    onClick={() => {
                      setCurrentCharacter('A');
                      setCurrentLineIndex(0);
                    }}
                  >
                    Đóng vai A
                  </button>
                </div>
                <div className="vs-divider">VS</div>
                <div className={`character-card ${currentCharacter === 'B' ? 'active' : ''}`}>
                  <div className="character-avatar">
                    <span>{currentScenario.characterB.charAt(0)}</span>
                  </div>
                  <div className="character-name">{currentScenario.characterB}</div>
                  <div className="character-label">Nhân vật B</div>
                  <button
                    className="btn btn-outline btn-sm character-switch-btn"
                    onClick={() => {
                      setCurrentCharacter('B');
                      setCurrentLineIndex(0);
                    }}
                  >
                    Đóng vai B
                  </button>
                </div>
              </div>

              <div className="roleplay-dialogue">
                <div className="dialogue-header">
                  <div className="current-character-badge">
                    Đang đóng vai: <strong>{currentCharacter === 'A' ? currentScenario.characterA : currentScenario.characterB}</strong>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowHints(!showHints)}
                  >
                    {showHints ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
                  </button>
                </div>

                {showHints && (
                  <div className="hints-box">
                    {currentScenario.vocabularyHints && currentScenario.vocabularyHints.length > 0 && (
                      <div className="hint-section">
                        <strong>💡 Từ vựng:</strong>
                        <div className="hint-tags">
                          {currentScenario.vocabularyHints.map((hint, idx) => (
                            <span key={idx} className="hint-tag">{hint}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentScenario.grammarPoints && currentScenario.grammarPoints.length > 0 && (
                      <div className="hint-section">
                        <strong>📖 Ngữ pháp:</strong>
                        <div className="hint-tags">
                          {currentScenario.grammarPoints.map((point, idx) => (
                            <span key={idx} className="hint-tag">{point}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="current-line-box">
                  <div className="line-label">Câu của bạn:</div>
                  <div className="current-line-text">{currentLine}</div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleSpeak(currentLine)}
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? '⏸️ Đang phát...' : '🔊 Nghe phát âm'}
                  </button>
                </div>

                <div className="user-response-box">
                  <div className="response-label">Bạn nói:</div>
                  <textarea
                    className="response-input"
                    placeholder="Nhập câu trả lời của bạn bằng tiếng Nhật..."
                    value={userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`] || ''}
                    onChange={(e) => handleUserResponse(`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`, e.target.value)}
                    rows={3}
                  />
                  {userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`] && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleSpeak(userResponses[`${currentScenario.id}-${currentCharacter}-${currentLineIndex}`])}
                      disabled={isSpeaking}
                    >
                      🔊 Nghe câu của bạn
                    </button>
                  )}
                </div>
              </div>

              <div className="roleplay-controls">
                <button
                  className="btn btn-outline"
                  onClick={handlePrevious}
                  disabled={isFirstLine && currentCharacter === 'A'}
                >
                  ← Trước
                </button>
                <div className="progress-indicator">
                  {currentCharacter === 'A' ? 'Nhân vật A' : 'Nhân vật B'} - Câu {currentLineIndex + 1}/{currentScript.length}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  {isLastLine && currentCharacter === 'B' ? 'Hoàn thành' : 'Tiếp theo →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversation History Sidebar */}
        {conversationHistory.length > 0 && (
          <div className="conversation-history">
            <div className="history-header">
              <h4>📜 Lịch sử hội thoại</h4>
            </div>
            <div className="history-list">
              {conversationHistory.map((entry, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-character">{entry.character}</div>
                  <div className="history-text">{entry.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {scenarios.length > 1 && (
        <div className="scenario-selector-enhanced">
          <div className="selector-header">
            <span className="selector-icon">🎬</span>
            <span className="selector-title">Chọn kịch bản khác:</span>
          </div>
          <div className="scenario-grid">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={`scenario-card-btn ${scenario.id === currentScenario.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentScenario(scenario);
                  setCurrentCharacter('A');
                  setCurrentLineIndex(0);
                  setUserResponses({});
                  setConversationHistory([]);
                  setScore(0);
                  setStreak(0);
                }}
              >
                <div className="scenario-card-title">{scenario.title}</div>
                <div className="scenario-card-desc">{scenario.description}</div>
                <span className={`scenario-card-badge badge-${scenario.difficulty || 'medium'}`}>
                  {scenario.difficulty === 'easy' ? 'Dễ' : scenario.difficulty === 'hard' ? 'Khó' : 'TB'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Roleplay;
