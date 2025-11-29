import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAIResponse } from '../services/aiService';
import Character3D from './Character3D';
import '../styles/ai-roleplay-simple.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface Character {
  id: string;
  name: string;
  emoji: string;
  color: string;
  scenario: string;
}

const characters: Character[] = [
  {
    id: 'waiter',
    name: 'Nhân viên nhà hàng',
    emoji: '👨‍🍳',
    color: '#10b981',
    scenario: 'Bạn là nhân viên phục vụ thân thiện tại nhà hàng Nhật Bản'
  },
  {
    id: 'shopkeeper',
    name: 'Chủ cửa hàng',
    emoji: '👔',
    color: '#3b82f6',
    scenario: 'Bạn là chủ cửa hàng quần áo nhiệt tình'
  },
  {
    id: 'friend',
    name: 'Bạn thân',
    emoji: '😊',
    color: '#ec4899',
    scenario: 'Bạn là người bạn Nhật Bản thân thiết'
  }
];

export default function AIRoleplaySimple() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const startConversation = async (character: Character) => {
    setSelectedCharacter(character);
    setMessages([]);
    await getAIGreeting(character);
  };

  const getAIGreeting = async (character: Character) => {
    setLoading(true);
    try {
      const prompt = `${character.scenario}. Bắt đầu hội thoại bằng 1-2 câu tiếng Nhật ngắn gọn, sau đó đề xuất 3 cách trả lời.

Format:
AI: [câu tiếng Nhật]
---
OPTIONS:
1. [lựa chọn 1]
2. [lựa chọn 2]
3. [lựa chọn 3]`;

      const aiResponse = await getAIResponse([{ role: 'user', content: prompt }]);
      const response = aiResponse.content;
      const parts = response.split('---');
      const aiMessage = parts[0].replace('AI:', '').trim();
      const options = parts[1]?.split('\n').filter((l: string) => l.match(/^\d\./)).map((l: string) => l.replace(/^\d\.\s*/, '').trim()) || [];

      setMessages([{ role: 'ai', content: aiMessage }]);
      setSuggestedOptions(options);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChoice = async (choice: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: choice }];
    setMessages(newMessages);
    setSuggestedOptions([]);
    setLoading(true);

    try {
      const history = newMessages.map(m => `${m.role === 'user' ? 'Học viên' : 'AI'}: ${m.content}`).join('\n');
      const prompt = `${selectedCharacter?.scenario}

${history}

Đánh giá câu trả lời và tiếp tục hội thoại. Format:
EVALUATION: [Tốt! hoặc giải thích lỗi]
---
AI: [câu tiếp theo]
---
OPTIONS:
1. [lựa chọn 1]
2. [lựa chọn 2]
3. [lựa chọn 3]`;

      const aiResponse = await getAIResponse([{ role: 'user', content: prompt }]);
      const sections = aiResponse.content.split('---');
      const aiMessage = sections[1]?.replace('AI:', '').trim() || '';
      const options = sections[2]?.split('\n').filter((l: string) => l.match(/^\d\./)).map((l: string) => l.replace(/^\d\.\s*/, '').trim()) || [];

      if (aiMessage) {
        setMessages(prev => [...prev, { role: 'ai', content: aiMessage }]);
      }
      setSuggestedOptions(options);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCharacter) {
    return (
      <div className="roleplay-simple-container">
        <Link to="/" className="back-link">← Về trang chủ</Link>
        <h1>🎭 Luyện hội thoại với AI</h1>
        <div className="characters-select">
          {characters.map(char => (
            <div key={char.id} className="char-card" onClick={() => startConversation(char)}>
              <div className="char-preview" style={{ borderColor: char.color }}>
                <Character3D color={char.color} isThinking={false} isTalking={false} />
              </div>
              <h3>{char.name}</h3>
              <button style={{ background: char.color }}>Bắt đầu</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="roleplay-simple-container">
      <button onClick={() => setSelectedCharacter(null)} className="back-btn">← Quay lại</button>
      
      <div className="conversation-layout">
        {/* Left: 3D Character */}
        <div className="character-panel" style={{ borderColor: selectedCharacter.color }}>
          <div className="panel-header">
            <span className="status-dot"></span>
            {selectedCharacter.name}
          </div>
          <div className="character-3d-container">
            <Character3D 
              color={selectedCharacter.color} 
              isThinking={loading} 
              isTalking={messages.length > 0 && !loading}
            />
          </div>
        </div>

        {/* Right: Chat */}
        <div className="chat-panel">
          <div className="messages-area">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="msg ai">Đang suy nghĩ...</div>}
          </div>

          {suggestedOptions.length > 0 && !loading && (
            <div className="options-area">
              <p>Chọn câu trả lời:</p>
              {suggestedOptions.map((opt, i) => (
                <button key={i} className="option-btn" onClick={() => handleUserChoice(opt)}>
                  <span className="opt-num">{i + 1}</span>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
