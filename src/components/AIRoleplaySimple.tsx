import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAIResponse } from '../services/aiService';
import CharacterAvatar from './CharacterAvatar';
import '../styles/ai-roleplay-simple.css';

interface Message {
  role: 'user' | 'ai' | 'system';
  content: string;
  meta?: { evaluation?: string };
}

interface Character {
  id: string; // internal id
  name: string;
  emoji: string;
  color: string;
  scenario: string;
  avatarRole: 'restaurant' | 'shopping' | 'station' | 'hotel'; // map to CharacterAvatar
}

const characters: Character[] = [
  {
    id: 'waiter',
    name: 'Nhân viên nhà hàng',
    emoji: '👨‍🍳',
    color: '#10b981',
    scenario: 'Bạn là nhân viên phục vụ thân thiện tại nhà hàng Nhật Bản',
    avatarRole: 'restaurant'
  },
  {
    id: 'shopkeeper',
    name: 'Chủ cửa hàng',
    emoji: '👔',
    color: '#3b82f6',
    scenario: 'Bạn là chủ cửa hàng quần áo nhiệt tình',
    avatarRole: 'shopping'
  },
  {
    id: 'friend',
    name: 'Bạn thân',
    emoji: '😊',
    color: '#ec4899',
    scenario: 'Bạn là người bạn Nhật Bản thân thiết',
    avatarRole: 'hotel' // pick the closest avatar role for visual fit
  }
];

export default function AIRoleplaySimple() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const startConversation = async (character: Character) => {
    setSelectedCharacter(character);
    setMessages([]);
    setSuggestedOptions([]);
    setError(null);
    await getAIGreeting(character);
  };

  const safeSplitSections = (text: string) => {
    // Split on a line that is only --- (allow surrounding whitespace)
    return text.split(/\r?\n-{3,}\r?\n/).map(s => s.trim());
  };

  const parseOptions = (section: string | undefined) => {
    if (!section) return [];
    // find lines starting with "1." or "1)" or "-" or "•"
    const lines = section.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const opts = lines
      .map(l => l.replace(/^[\d\)\.\-\•\s]+/, '').trim())
      .filter(Boolean);
    return opts.slice(0, 6); // up to 6 options
  };

  const getAIGreeting = async (character: Character) => {
    setLoading(true);
    setError(null);
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
      const raw = aiResponse.content?.trim() ?? '';

      const sections = safeSplitSections(raw);
      // sections[0] should contain AI: ...
      const aiSection = sections[0] ?? raw;
      const optionsSection = sections.find(s => /options?/i.test(s) || /^\d\./m.test(s)) ?? sections[1];

      // Remove "AI:" prefix if present
      const aiText = aiSection.replace(/^AI:\s*/i, '').trim();

      const options = parseOptions(optionsSection);

      setMessages([{ role: 'ai', content: aiText }]);
      setSuggestedOptions(options.length ? options : []);
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChoice = async (choice: string) => {
    if (!selectedCharacter) return;
    if (loading) return;

    setError(null);
    // append user's choice
    const newUserMsg: Message = { role: 'user', content: choice };
    setMessages(prev => [...prev, newUserMsg]);
    setSuggestedOptions([]);
    setLoading(true);

    try {
      // Build a compact conversation history for the AI
      const history = [...messages, newUserMsg]
        .map(m => (m.role === 'user' ? `Học viên: ${m.content}` : `AI: ${m.content}`))
        .join('\n');

      const prompt = `${selectedCharacter.scenario}

${history}

Đánh giá câu trả lời của học viên ngắn gọn (1-2 câu): nêu điểm mạnh / lỗi (nếu có).
Sau đó tiếp tục hội thoại với 1-2 câu tiếng Nhật phù hợp với vai trò.

Format:
EVALUATION: [Tốt! hoặc mô tả lỗi ngắn]
---
AI: [câu tiếp theo tiếng Nhật]
---
OPTIONS:
1. [lựa chọn 1]
2. [lựa chọn 2]
3. [lựa chọn 3]`;

      const aiResponse = await getAIResponse([{ role: 'user', content: prompt }]);
      const raw = aiResponse.content?.trim() ?? '';
      const sections = safeSplitSections(raw);

      // Find evaluation (starts with EVALUATION or EVAL)
      const evalSection = sections.find(s => /^EVALUATION:/i.test(s) || /^EVAL:/i.test(s));
      const aiSection = sections.find(s => /^AI:/i.test(s)) || sections[1] || sections[0];
      const optionsSection = sections.find(s => /OPTIONS:/i.test(s)) || sections[2] || sections[1];

      const evaluation = evalSection ? evalSection.replace(/^EVALUATION:\s*/i, '').trim() : '';
      const aiText = aiSection ? aiSection.replace(/^AI:\s*/i, '').trim() : raw;
      const options = parseOptions(optionsSection);

      // Attach evaluation as a system message for visibility
      if (evaluation) {
        setMessages(prev => [...prev, { role: 'system', content: evaluation, meta: { evaluation } }]);
      }

      if (aiText) {
        setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      }

      setSuggestedOptions(options);
    } catch (err) {
      console.error(err);
      setError('Có lỗi khi nhận phản hồi từ AI.');
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
            <div key={char.id} className="char-card" onClick={() => startConversation(char)} role="button" tabIndex={0}>
              <div className="char-preview" style={{ borderColor: char.color }}>
                <div style={{ fontSize: '4rem', textAlign: 'center' }}>{char.emoji}</div>
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
        {/* Left: Character */}
        <div className="character-panel" style={{ borderColor: selectedCharacter.color }}>
          <div className="panel-header">
            <span className="status-dot" style={{ background: loading ? '#f59e0b' : '#10b981' }} />
            {selectedCharacter.name}
          </div>
          <div className="character-3d-container">
            <CharacterAvatar
              role={selectedCharacter.avatarRole}
              size="large"
              isTalking={loading || (messages.length > 0 && !loading)}
            />
          </div>
        </div>

        {/* Right: Chat */}
        <div className="chat-panel">
          <div className="messages-area" ref={messagesRef} aria-live="polite">
            {messages.map((msg, i) => {
              if (msg.role === 'system' && msg.meta?.evaluation) {
                return (
                  <div key={i} className="msg eval">
                    <strong>Đánh giá:</strong> {msg.meta.evaluation}
                  </div>
                );
              }
              return (
                <div key={i} className={`msg ${msg.role}`}>
                  {msg.content}
                </div>
              );
            })}
            {loading && <div className="msg ai">Đang suy nghĩ...</div>}
          </div>

          {error && <div className="error">{error}</div>}

          {suggestedOptions.length > 0 && !loading && (
            <div className="options-area" aria-label="Gợi ý trả lời">
              <p>Chọn câu trả lời:</p>
              <div className="options-list">
                {suggestedOptions.map((opt, i) => (
                  <button
                    key={i}
                    className="option-btn"
                    onClick={() => handleUserChoice(opt)}
                    disabled={loading}
                    aria-disabled={loading}
                  >
                    <span className="opt-num">{i + 1}</span>
                    <span className="opt-text">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
