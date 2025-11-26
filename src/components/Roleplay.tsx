import { useState } from 'react';
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

  const handleNext = () => {
    if (isLastLine) {
      // Switch character or finish
      if (currentCharacter === 'A') {
        setCurrentCharacter('B');
        setCurrentLineIndex(0);
      } else {
        // Scenario complete
        alert('Hoàn thành kịch bản! Bạn đã làm tốt!');
        // Reset or move to next scenario
        if (scenarios.length > 1) {
          const currentIndex = scenarios.findIndex(s => s.id === currentScenario.id);
          const nextIndex = (currentIndex + 1) % scenarios.length;
          setCurrentScenario(scenarios[nextIndex]);
          setCurrentCharacter('A');
          setCurrentLineIndex(0);
          setUserResponses({});
        }
      }
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
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
    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleUserResponse = (lineId: string, response: string) => {
    setUserResponses({ ...userResponses, [lineId]: response });
  };

  return (
    <div className="section-container roleplay-section">
      <div className="section-header roleplay-header">
        <div className="section-icon roleplay-icon">
          <svg style={{ width: '40px', height: '40px', color: '#8b5cf6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2>Hội thoại - Nhập vai</h2>
          <p>Luyện tập giao tiếp qua các tình huống thực tế</p>
        </div>
      </div>

      <div className="section-content">
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

        {scenarios.length > 1 && (
          <div className="scenario-selector">
            <div className="selector-label">Chọn kịch bản khác:</div>
            <div className="scenario-buttons">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  className={`btn btn-outline ${scenario.id === currentScenario.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentScenario(scenario);
                    setCurrentCharacter('A');
                    setCurrentLineIndex(0);
                    setUserResponses({});
                  }}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roleplay;

