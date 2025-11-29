import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAIResponse } from '../services/aiService';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';
import { useTheme } from '../contexts/ThemeContext';
import CharacterAvatar from './CharacterAvatar';
import '../styles/ai-roleplay-new.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
  isCorrect?: boolean;
  explanation?: string;
  translation?: string;        // Dịch tiếng Việt cho câu AI
  detailExplanation?: string;  // Giải thích ngữ pháp/từ vựng
  showDetails?: boolean;       // Toggle hiển thị dịch & giải thích
}

interface Character {
  id: string;
  name: string;
  emoji: string;
  color: string;
  scenario: string;
  greeting: string;
}

const characters: Character[] = [
  {
    id: 'waiter',
    name: 'Nhân viên nhà hàng',
    emoji: '👨‍🍳',
    color: '#10b981',
    scenario: 'Bạn là nhân viên phục vụ thân thiện tại nhà hàng Nhật Bản',
    greeting: 'いらっしゃいませ！何名様ですか？'
  },
  {
    id: 'shopkeeper',
    name: 'Chủ cửa hàng',
    emoji: '👔',
    color: '#3b82f6',
    scenario: 'Bạn là chủ cửa hàng quần áo nhiệt tình',
    greeting: 'いらっしゃいませ！何かお探しですか？'
  },
  {
    id: 'receptionist',
    name: 'Lễ tân khách sạn',
    emoji: '🏨',
    color: '#f59e0b',
    scenario: 'Bạn là nhân viên lễ tân khách sạn chuyên nghiệp',
    greeting: 'いらっしゃいませ。チェックインでしょうか？'
  },
  {
    id: 'friend',
    name: 'Bạn thân',
    emoji: '😊',
    color: '#ec4899',
    scenario: 'Bạn là người bạn Nhật Bản thân thiết',
    greeting: 'やあ！元気？'
  }
];

const AIRoleplayNew = () => {
  const { theme } = useTheme();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [characterActive, setCharacterActive] = useState(false);
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);

  const speakAIText = (text: string) => {
    if (isSpeechSynthesisSupported() && text) {
      // Giọng Nhật chậm vừa, tự nhiên, dễ nghe
      speakText(text, {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.9,
        lang: 'ja-JP',
      }).catch(() => {
        // Bỏ qua lỗi TTS để không làm hỏng trải nghiệm
      });
    }
  };

  const startConversation = async (character: Character) => {
    setSelectedCharacter(character);
    setCharacterActive(true);
    setMessages([]);
    
    // AI bắt đầu hội thoại
    await getAIGreeting(character);
  };

  const getAIGreeting = async (character: Character) => {
    setLoading(true);
    
    try {
      const prompt = `${character.scenario}

Hãy bắt đầu cuộc hội thoại bằng tiếng Nhật một cách tự nhiên. Chỉ nói 1-2 câu ngắn gọn.

Sau đó, đề xuất 3 cách trả lời phù hợp cho người học (bằng tiếng Nhật), từ dễ đến khó.

Format trả lời TRỰC TIẾP, KHÔNG giải thích thêm:
AI_JA: [Câu trả lời bằng tiếng Nhật]
AI_VI: [Bản dịch tiếng Việt ngắn gọn]
EXPLAIN: [Giải thích rất ngắn (1-2 câu) về mẫu câu/từ vựng chính bằng tiếng Việt]
---
OPTIONS:
1. [Lựa chọn 1 - dễ]
2. [Lựa chọn 2 - trung bình]
3. [Lựa chọn 3 - nâng cao]`;

      const aiResponse = await getAIResponse([{ role: 'user', content: prompt }]);
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }
      
      const response = aiResponse.content;
      const parts = response.split('---');
      const aiSection = parts[0] || '';
      const optionsText = parts[1] || '';

      const jaMatch = aiSection.match(/AI_JA:\s*([\s\S]*?)\nAI_VI:/);
      const viMatch = aiSection.match(/AI_VI:\s*([\s\S]*?)\nEXPLAIN:/);
      const explainMatch = aiSection.match(/EXPLAIN:\s*([\s\S]*)$/);

      const aiJa = (jaMatch?.[1] || '').trim();
      const aiVi = (viMatch?.[1] || '').trim();
      const explain = (explainMatch?.[1] || '').trim();
      
      const options = optionsText
        .split('\n')
        .filter((line: string) => line.match(/^\d\./))
        .map((line: string) => line.replace(/^\d\.\s*/, '').trim());

      setMessages([{
        role: 'ai',
        content: aiJa || response,
        translation: aiVi || undefined,
        detailExplanation: explain || undefined,
        showDetails: false,
      }]);
      speakAIText(aiJa || response);
      setSuggestedOptions(options);
      
    } catch (error) {
      console.error('Error:', error);
      setMessages([{ role: 'ai', content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChoice = async (choice: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: choice }];
    setMessages(newMessages);
    setSuggestedOptions([]);
    
    await evaluateAndContinue(choice, newMessages);
  };

  const evaluateAndContinue = async (userResponse: string, history: Message[]) => {
    setLoading(true);
    
    try {
      const conversationHistory = history
        .map(m => `${m.role === 'user' ? 'Học viên' : 'AI'}: ${m.content}`)
        .join('\n');
      
      const prompt = `${selectedCharacter?.scenario}

Lịch sử hội thoại:
${conversationHistory}

Hãy đánh giá câu trả lời của học viên:
1. Có phù hợp với ngữ cảnh không?
2. Ngữ pháp có đúng không?
3. Từ vựng có phù hợp không?

Nếu có lỗi, hãy giải thích ngắn gọn.

Sau đó, tiếp tục cuộc hội thoại và đề xuất 3 lựa chọn tiếp theo.

Format trả lời TRỰC TIẾP, KHÔNG giải thích ngoài cấu trúc:
EVALUATION: [Đánh giá - "Tốt!" hoặc giải thích lỗi ngắn gọn bằng tiếng Việt]
---
AI_JA: [Câu trả lời tiếp theo bằng tiếng Nhật]
AI_VI: [Bản dịch tiếng Việt ngắn gọn]
EXPLAIN: [Giải thích rất ngắn (1-2 câu) về mẫu câu/từ vựng chính bằng tiếng Việt]
---
OPTIONS:
1. [Lựa chọn 1]
2. [Lựa chọn 2]
3. [Lựa chọn 3]`;

      const aiResponse = await getAIResponse([{ role: 'user', content: prompt }]);
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }
      
      const response = aiResponse.content;
      const sections = response.split('---');
      const evaluationSection = sections[0] || '';
      const aiSection = sections[1] || '';
      const optionsSection = sections[2] || '';
      
      const evaluationMatch = evaluationSection.match(/EVALUATION:\s*(.+?)$/s);
      const evaluation = evaluationMatch ? evaluationMatch[1].trim() : '';
      
      const isCorrect = evaluation.includes('Tốt') || evaluation.includes('tốt') || evaluation.includes('đúng');
      
      // Update last user message with evaluation
      setMessages(prev => {
        const updated = [...prev];
        const lastUserIndex = updated.length - 1;
        updated[lastUserIndex] = {
          ...updated[lastUserIndex],
          isCorrect,
          explanation: isCorrect ? 'Tốt lắm! ✨' : evaluation
        };
        return updated;
      });
      
      // Parse AI section: JA + VI + EXPLAIN
      const jaMatch = aiSection.match(/AI_JA:\s*([\s\S]*?)\nAI_VI:/);
      const viMatch = aiSection.match(/AI_VI:\s*([\s\S]*?)\nEXPLAIN:/);
      const explainMatch = aiSection.match(/EXPLAIN:\s*([\s\S]*)$/);

      const aiJa = (jaMatch?.[1] || '').trim();
      const aiVi = (viMatch?.[1] || '').trim();
      const explain = (explainMatch?.[1] || '').trim();

      const aiMessage = aiJa || aiSection;
      if (aiMessage) {
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: aiMessage,
            translation: aiVi || undefined,
            detailExplanation: explain || undefined,
            showDetails: false,
          },
        ]);
        speakAIText(aiMessage);
      }
      
      // Extract options
      const options = optionsSection
        .split('\n')
        .filter((line: string) => line.match(/^\d\./))
        .map((line: string) => line.replace(/^\d\.\s*/, '').trim());
      
      if (options.length > 0) {
        setSuggestedOptions(options);
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setSelectedCharacter(null);
    setMessages([]);
    setSuggestedOptions([]);
    setCharacterActive(false);
  };

  const handleToggleDetails = (index: number) => {
    setMessages(prev => {
      const updated = [...prev];
      const msg = updated[index];
      if (!msg || msg.role !== 'ai') return prev;
      updated[index] = {
        ...msg,
        showDetails: !msg.showDetails,
      };
      return updated;
    });
  };

  if (!selectedCharacter) {
    return (
      <div className="ai-roleplay-container">
        <Link to="/" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Về trang chủ
        </Link>

        <div className="roleplay-header">
          <h1 className="gradient-text">🎭 Luyện hội thoại với AI</h1>
          <p>Chọn nhân vật và bắt đầu cuộc trò chuyện</p>
        </div>

        <div className="characters-grid">
          {characters.map((character) => (
            <div
              key={character.id}
              className={`character-preview-card ${hoveredCharacter === character.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCharacter(character.id)}
              onMouseLeave={() => setHoveredCharacter(null)}
              onClick={() => startConversation(character)}
            >
              {/* 3D Character Frame */}
              <div 
                className="character-frame-3d"
                style={{ 
                  borderColor: character.color,
                  boxShadow: `0 20px 60px ${character.color}40`
                }}
              >
                <div className="character-stage">
                  <div className="character-model">
                    <div className="character-head">
                      <span className="character-face">{character.emoji}</span>
                      <div className="character-eyes">
                        <span className="eye left">👁️</span>
                        <span className="eye right">👁️</span>
                      </div>
                    </div>
                    <div className="character-body">
                      <div className="character-arm left">🤚</div>
                      <div className="character-torso"></div>
                      <div className="character-arm right">🤚</div>
                    </div>
                  </div>
                  <div className="stage-floor"></div>
                </div>
              </div>
              
              <div className="character-info">
                <h3>{character.name}</h3>
                <p>{character.scenario.replace('Bạn là ', '')}</p>
                <button className="start-button" style={{ background: character.color }}>
                  Bắt đầu trò chuyện
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-roleplay-container conversation-mode">
      <button onClick={resetConversation} className="back-button-floating">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Large 3D Character Frame */}
      <div 
        className={`character-video-frame ${loading ? 'thinking' : 'talking'}`}
        style={{ 
          borderColor: selectedCharacter.color,
          boxShadow: `0 30px 80px ${selectedCharacter.color}50`
        }}
      >
        <div className="video-frame-header">
          <div className="frame-title">
            <span className="status-indicator"></span>
            {selectedCharacter.name}
          </div>
          <div className="frame-controls">
            <span className="control-dot"></span>
            <span className="control-dot"></span>
            <span className="control-dot"></span>
          </div>
        </div>
        
        <div className="character-viewport">
          <div className={`character-3d-model ${loading ? 'thinking-state' : 'idle-state'}`}>
            {/* Character Head with expressions */}
            <div className="model-head">
              <div className="head-container">
                <span className="face-emoji">{selectedCharacter.emoji}</span>
                
                {/* Animated Eyes */}
                <div className="eyes-container">
                  <div className="eye left-eye">
                    <div className="pupil"></div>
                  </div>
                  <div className="eye right-eye">
                    <div className="pupil"></div>
                  </div>
                </div>
                
                {/* Mouth Animation */}
                <div className={`mouth ${loading ? 'thinking' : 'talking'}`}>
                  {loading ? '🤔' : '😊'}
                </div>
              </div>
            </div>
            
            {/* Character Body */}
            <div className="model-body">
              <div className="shoulders"></div>
              <div className="torso"></div>
            </div>
            
            {/* Thinking Bubble */}
            {loading && (
              <div className="thought-bubble">
                <div className="bubble-content">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>
          
          {/* Background Effects */}
          <div className="viewport-background">
            <div className="bg-gradient" style={{ background: `radial-gradient(circle, ${selectedCharacter.color}20, transparent)` }}></div>
            <div className="bg-particles">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-bubble ${message.role}`}
          >
            <div className="message-content">
              {message.content}
            </div>
            {message.role === 'ai' && (message.translation || message.detailExplanation) && (
              <div className="message-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleToggleDetails(index)}
                >
                  {message.showDetails ? 'Ẩn dịch & giải thích' : 'Dịch & giải thích'}
                </button>
              </div>
            )}
            {message.showDetails && message.translation && (
              <div className="message-translation">
                <strong>Dịch:</strong> {message.translation}
              </div>
            )}
            {message.showDetails && message.detailExplanation && (
              <div className="message-explanation">
                <strong>Giải thích:</strong> {message.detailExplanation}
              </div>
            )}
            {message.explanation && (
              <div className={`message-feedback ${message.isCorrect ? 'correct' : 'incorrect'}`}>
                {message.isCorrect ? '✅' : '⚠️'} {message.explanation}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="message-bubble ai">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Options */}
      {suggestedOptions.length > 0 && !loading && (
        <div className="options-container">
          <p className="options-label">Chọn câu trả lời:</p>
          <div className="options-grid">
            {suggestedOptions.map((option, index) => (
              <button
                key={index}
                className="option-button"
                onClick={() => handleUserChoice(option)}
              >
                <span className="option-number">{index + 1}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRoleplayNew;
