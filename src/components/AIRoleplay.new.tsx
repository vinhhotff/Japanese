import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAIResponse } from '../services/aiService';
import '../App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ScenarioOption {
  id: string;
  title: string;
  description: string;
  context: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const scenarios: ScenarioOption[] = [
  {
    id: 'restaurant',
    title: '🍜 Nhà hàng',
    description: 'Đặt món ăn tại nhà hàng Nhật',
    context: 'Bạn là nhân viên nhà hàng Nhật. Trả lời ngắn gọn, lịch sự bằng tiếng Nhật N5-N4. Format: [Tiếng Nhật]\n(Dịch tiếng Việt)',
    difficulty: 'easy'
  },
  {
    id: 'shopping',
    title: '🛍️ Mua sắm',
    description: 'Mua quần áo tại cửa hàng',
    context: 'Bạn là nhân viên cửa hàng Nhật. Trả lời ngắn gọn, lịch sự bằng tiếng Nhật N5-N4. Format: [Tiếng Nhật]\n(Dịch tiếng Việt)',
    difficulty: 'easy'
  },
  {
    id: 'station',
    title: '🚉 Ga tàu',
    description: 'Hỏi đường và mua vé tàu',
    context: 'Bạn là nhân viên ga tàu Nhật. Trả lời ngắn gọn, lịch sự bằng tiếng Nhật N4-N3. Format: [Tiếng Nhật]\n(Dịch tiếng Việt)',
    difficulty: 'medium'
  },
  {
    id: 'hotel',
    title: '🏨 Khách sạn',
    description: 'Check-in tại khách sạn',
    context: 'Bạn là lễ tân khách sạn Nhật. Trả lời ngắn gọn, lịch sự bằng tiếng Nhật N4-N3. Format: [Tiếng Nhật]\n(Dịch tiếng Việt)',
    difficulty: 'medium'
  }
];

const AIRoleplay = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOption | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [savedConversation, setSavedConversation] = useState<{
    scenario: ScenarioOption;
    messages: Message[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved conversation
  useEffect(() => {
    const saved = localStorage.getItem('ai-roleplay-conversation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.messages) {
          parsed.messages = parsed.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
        setSavedConversation(parsed);
        setShowContinueDialog(true);
      } catch (error) {
        console.error('Error loading saved conversation:', error);
        localStorage.removeItem('ai-roleplay-conversation');
      }
    }
  }, []);

  // Save conversation
  useEffect(() => {
    if (selectedScenario && messages.length > 0) {
      const conversationData = {
        scenario: selectedScenario,
        messages: messages,
        timestamp: Date.now()
      };
      localStorage.setItem('ai-roleplay-conversation', JSON.stringify(conversationData));
    }
  }, [selectedScenario, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const continueConversation = () => {
    if (savedConversation) {
      setSelectedScenario(savedConversation.scenario);
      const messagesWithDates = savedConversation.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
      }));
      setMessages(messagesWithDates);
      setShowContinueDialog(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const startNewConversation = () => {
    localStorage.removeItem('ai-roleplay-conversation');
    setSavedConversation(null);
    setShowContinueDialog(false);
    setMessages([]);
    setSelectedScenario(null);
  };

  const resetConversation = () => {
    localStorage.removeItem('ai-roleplay-conversation');
    setMessages([]);
    setSelectedScenario(null);
    setSavedConversation(null);
  };

  const startConversation = (scenario: ScenarioOption) => {
    setSelectedScenario(scenario);
    const greetings: Record<string, string> = {
      restaurant: 'いらっしゃいませ！何名様ですか？\n(Xin chào! Quý khách mấy người ạ?)',
      shopping: 'いらっしゃいませ！何かお探しですか？\n(Xin chào! Quý khách đang tìm gì ạ?)',
      station: 'どちらまでですか？\n(Bạn đi đâu ạ?)',
      hotel: 'チェックインでしょうか？\n(Quý khách check-in phải không ạ?)'
    };
    
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: greetings[scenario.id] || 'こんにちは！\n(Xin chào!)',
      timestamp: new Date()
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedScenario) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      const conversationMessages = [
        { role: 'system' as const, content: selectedScenario.context },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content.split('\n')[0]
        })),
        { role: 'user' as const, content: userInput }
      ];

      const response = await getAIResponse(conversationMessages);
      
      let aiContent: string;
      if (response.error) {
        aiContent = 'すみません、もう一度お願いします。\n(Xin lỗi, xin hãy nói lại.)';
      } else {
        aiContent = response.content;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'すみません、もう一度お願いします。\n(Xin lỗi, xin hãy nói lại.)',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setLoading(false);
    }
  };

  // Continue dialog
  if (showContinueDialog && savedConversation) {
    return (
      <div className="container">
        <div className="card" style={{ 
          maxWidth: '500px', 
          margin: '2rem auto', 
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
            🎭 Tiếp tục cuộc trò chuyện?
          </h2>
          <p style={{ 
            marginBottom: '2rem', 
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Bạn có một cuộc trò chuyện đang dở với tình huống "{savedConversation.scenario.title}". 
            Bạn có muốn tiếp tục không?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={continueConversation}
              className="btn btn-primary"
              style={{ minWidth: '120px' }}
            >
              Tiếp tục
            </button>
            <button
              onClick={startNewConversation}
              className="btn btn-outline"
              style={{ minWidth: '120px' }}
            >
              Bắt đầu mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedScenario) {
    return (
      <div className="container">
        <Link to="/" className="back-button">
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Về trang chủ
        </Link>

        <div className="header" style={{ marginBottom: '2rem' }}>
          <h1>🎭 Luyện hội thoại với AI</h1>
          <p>Chọn tình huống và thực hành hội thoại. AI sẽ trả lời như một người thật.</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1.5rem',
          paddingBottom: '3rem'
        }}>
          {scenarios.map((scenario) => {
            const difficultyColors = {
              easy: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
              medium: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
              hard: { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' }
            };
            const colors = difficultyColors[scenario.difficulty];
            
            return (
              <button
                key={scenario.id}
                onClick={() => startConversation(scenario)}
                className="card"
                style={{
                  padding: '2rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: '1px solid var(--border-color)',
                  borderTop: `3px solid ${colors.border}`,
                  background: `linear-gradient(to bottom, ${colors.bg}, var(--card-bg))`
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                  {scenario.title.split(' ')[0]}
                </div>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: colors.text,
                  marginBottom: '0.5rem'
                }}>
                  {scenario.title.split(' ').slice(1).join(' ')}
                </h3>
                <p style={{ 
                  fontSize: '0.9375rem', 
                  color: 'var(--text-secondary)',
                  marginBottom: '0.75rem',
                  lineHeight: 1.65
                }}>
                  {scenario.description}
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: colors.text
                }}>
                  {scenario.difficulty === 'easy' ? 'Dễ' : scenario.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={resetConversation}>
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            {selectedScenario.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {selectedScenario.description}
          </p>
        </div>
        <button 
          className="btn btn-outline"
          onClick={() => setShowTranslation(!showTranslation)}
        >
          {showTranslation ? '🙈 Ẩn dịch' : '👁️ Hiện dịch'}
        </button>
      </div>

      <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', marginBottom: '1rem' }}>
          {messages.map(message => {
            const japaneseText = message.content.split('\n')[0];
            const vietnameseText = message.content.includes('\n(') 
              ? message.content.split('\n')[1]?.replace(/^\(|\)$/g, '') 
              : '';

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '1rem',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: message.role === 'user' 
                      ? 'var(--primary-gradient)'
                      : 'var(--card-bg-hover)',
                    color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                    border: message.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                    cursor: message.role === 'assistant' && vietnameseText ? 'help' : 'default',
                    position: 'relative'
                  }}
                  onMouseEnter={() => message.role === 'assistant' && vietnameseText && setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                  title={message.role === 'assistant' && vietnameseText ? vietnameseText : undefined}
                >
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {showTranslation ? message.content : japaneseText}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    marginTop: '0.5rem',
                    opacity: 0.7
                  }}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Hover Tooltip */}
                  {hoveredMessageId === message.id && message.role === 'assistant' && vietnameseText && !showTranslation && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '0.5rem',
                        padding: '0.75rem 1rem',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-lg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        maxWidth: '300px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ 
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)'
                      }}>
                        {vietnameseText}
                      </div>
                      {/* Arrow */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid var(--card-bg)'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ 
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'var(--card-bg-hover)',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="typing-dot"></div>
                  <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập tin nhắn bằng tiếng Nhật..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '2px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)'
              }}
              disabled={loading}
            />
            <button 
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRoleplay;
