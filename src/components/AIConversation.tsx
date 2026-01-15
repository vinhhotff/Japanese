import { useState, useRef, useEffect } from 'react';
import { getAIResponse, createSystemPrompt, getMockResponse } from '../services/aiService';
import '../App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  level: string;
  icon: string;
  systemPrompt: string;
}

const AIConversation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);
  const [showTranslation, setShowTranslation] = useState(false); // Global toggle
  const [suggestionStates, setSuggestionStates] = useState<Record<string, boolean>>({}); // Individual toggle
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [savedConversation, setSavedConversation] = useState<{
    scenario: ConversationScenario;
    messages: Message[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scenarios: ConversationScenario[] = [
    {
      id: 'restaurant',
      title: 'Nhà hàng',
      description: 'Luyện giao tiếp khi đi ăn nhà hàng',
      level: 'N5-N4',
      icon: '🍜',
      systemPrompt: 'Bạn là nhân viên nhà hàng Nhật. QUAN TRỌNG:\n- Trả lời bằng tiếng Nhật N5-N4\n- Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý tiếng Nhật 1] (Dịch)\n2. [Gợi ý tiếng Nhật 2] (Dịch)\n3. [Gợi ý tiếng Nhật 3] (Dịch)\n\nVí dụ:\n[JP] いらっしゃいませ！何名様ですか？\n[VI] Xin chào! Quý khách đi mấy người ạ?\n[OP]\n1. ひとりです (Tôi đi một mình)\n2. 二人です (Tôi đi 2 người)\n3. 予約しています (Tôi đã đặt bàn)'
    },
    {
      id: 'shopping',
      title: 'Mua sắm',
      description: 'Hỏi giá, thử đồ, thanh toán',
      level: 'N5-N4',
      icon: '🛍️',
      systemPrompt: 'Bạn là nhân viên cửa hàng. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)'
    },
    {
      id: 'hotel',
      title: 'Khách sạn',
      description: 'Check-in, yêu cầu dịch vụ',
      level: 'N4-N3',
      icon: '🏨',
      systemPrompt: 'Bạn là lễ tân khách sạn. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)'
    },
    {
      id: 'friend',
      title: 'Bạn bè',
      description: 'Trò chuyện thân mật với bạn',
      level: 'N5-N3',
      icon: '👥',
      systemPrompt: 'Bạn là bạn thân người Nhật. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)'
    },
    {
      id: 'interview',
      title: 'Phỏng vấn',
      description: 'Phỏng vấn xin việc',
      level: 'N3-N2',
      icon: '💼',
      systemPrompt: 'Bạn là nhà tuyển dụng. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)'
    },
    {
      id: 'doctor',
      title: 'Bác sĩ',
      description: 'Khám bệnh, mô tả triệu chứng',
      level: 'N4-N3',
      icon: '⚕️',
      systemPrompt: 'Bạn là bác sĩ. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)'
    }
  ];

  // Load saved conversation
  useEffect(() => {
    const saved = localStorage.getItem('ai-conversation-chat');
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
        localStorage.removeItem('ai-conversation-chat');
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
      localStorage.setItem('ai-conversation-chat', JSON.stringify(conversationData));
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
    localStorage.removeItem('ai-conversation-chat');
    setSavedConversation(null);
    setShowContinueDialog(false);
    setMessages([]);
    setSelectedScenario(null);
    setSuggestionStates({});
  };

  const resetConversation = () => {
    localStorage.removeItem('ai-conversation-chat');
    setMessages([]);
    setSelectedScenario(null);
    setSavedConversation(null);
    setSuggestionStates({});
  };

  const startConversation = (scenario: ConversationScenario) => {
    setSelectedScenario(scenario);
    const greetings: Record<string, string> = {
      restaurant: '[JP] いらっしゃいませ！何名様ですか？\n[VI] Xin chào! Quý khách đi mấy người ạ?\n[OP]\n1. ひとりです (Tôi đi một mình)\n2. 二人です (Tôi đi 2 người)\n3. 予約しています (Tôi đã đặt bàn)',
      shopping: '[JP] いらっしゃいませ！何かお探しですか？\n[VI] Xin chào! Quý khách đang tìm gì ạ?\n[OP]\n1. 見ているだけです (Tôi chỉ xem thôi)\n2. Tシャツを探しています (Tôi tìm áo phông)\n3. 試着してもいいですか (Tôi thử đồ được không)',
      hotel: '[JP] いらっしゃいませ。チェックインでしょうか？\n[VI] Xin chào. Quý khách check-in phải không ạ?\n[OP]\n1. はい、チェックインお願いします (Vâng, cho tôi check-in)\n2. 予約しています (Tôi đã đặt phòng)\n3. 荷物を預かってもらえますか (Giữ hành lý giúp tôi được không)',
      friend: '[JP] やあ！元気？\n[VI] Chào! Khỏe không?\n[OP]\n1. 元気だよ (Khỏe)\n2. まあまあかな (Bình thường)\n3. 忙しいよ (Bận lắm)',
      interview: '[JP] こんにちは。自己紹介をお願いします。\n[VI] Xin chào. Hãy tự giới thiệu bản thân.\n[OP]\n1. はじめまして、〜と申します (Xin chào, tôi tên là...)\n2. よろしくお願いします (Rất mong được giúp đỡ)\n3. 経験について話します (Tôi sẽ nói về kinh nghiệm)',
      doctor: '[JP] こんにちは。今日はどうされましたか？\n[VI] Xin chào. Hôm nay bạn thấy thế nào?\n[OP]\n1. 頭が痛いです (Tôi đau đầu)\n2. 熱があります (Tôi bị sốt)\n3. 喉が痛いです (Tôi đau họng)'
    };

    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: greetings[scenario.id] || '[JP] こんにちは！\n[VI] Xin chào!',
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
      const hasOpenAI = import.meta.env.VITE_OPENAI_API_KEY;
      const hasGemini = import.meta.env.VITE_GEMINI_API_KEY;
      const hasDeepSeek = import.meta.env.VITE_DEEPSEEK_API_KEY;
      const hasHuggingFace = import.meta.env.VITE_HUGGINGFACE_API_KEY;
      const hasQwen = import.meta.env.VITE_QWEN_API_KEY;
      const hasOpenRouter = import.meta.env.VITE_OPENROUTER_API_KEY;

      let aiContent = '';

      if (hasOpenAI || hasGemini || hasDeepSeek || hasHuggingFace || hasQwen || hasOpenRouter) {
        const conversationMessages = [
          createSystemPrompt(selectedScenario.systemPrompt),
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content
          })),
          { role: 'user' as const, content: userInput }
        ];

        const response = await getAIResponse(conversationMessages);

        if (response.error) {
          console.error('AI Error:', response.error);
          aiContent = getMockResponse(userInput, selectedScenario.id);
        } else {
          aiContent = response.content
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<think[\s\S]*?>/gi, '')
            .replace(/<\/think>/gi, '')
            .trim();
        }

        // Fallback for missing tags
        if (!aiContent.includes('[JP]')) {
          aiContent = `[JP] ${aiContent}\n[VI] (Bản dịch đang cập nhật)\n[OP]`;
        }

      } else {
        // Fallback or Mock
        aiContent = '[JP] すみません、エラーが発生しました。\n[VI] Xin lỗi, đã có lỗi xảy ra.\n[OP]';
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (msgId: string) => {
    setSuggestionStates(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const parseMessageContent = (content: string) => {
    const jpMatch = content.match(/\[JP\]([\s\S]*?)(?=\[VI\]|$)/);
    const viMatch = content.match(/\[VI\]([\s\S]*?)(?=\[OP\]|$)/);
    const opMatch = content.match(/\[OP\]([\s\S]*)/);

    return {
      jp: jpMatch ? jpMatch[1].trim() : content,
      vi: viMatch ? viMatch[1].trim() : '',
      op: opMatch ? opMatch[1].trim().split('\n').filter(l => l.trim()) : []
    };
  };

  // Continue dialog
  if (showContinueDialog && savedConversation) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>💬 Tiếp tục cuộc trò chuyện?</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Bạn có một cuộc trò chuyện đang dở với tình huống "{savedConversation.scenario.title}".
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={continueConversation} className="btn btn-primary">Tiếp tục</button>
            <button onClick={startNewConversation} className="btn btn-outline">Bắt đầu mới</button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedScenario) {
    return (
      <div className="container" data-language="both">
        <div className="header">
          <h1>
            <span className="title-highlight">Trò chuyện với AI</span>
          </h1>
          <p>Luyện giao tiếp tiếng Nhật với AI trong các tình huống thực tế</p>
        </div>
        <div className="card-grid">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="card" style={{ cursor: 'pointer' }} onClick={() => startConversation(scenario)}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{scenario.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>{scenario.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>{scenario.description}</p>
              <span className={`badge badge-${scenario.level.toLowerCase().replace('-', '')}`}>{scenario.level}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={resetConversation}>
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            marginBottom: '0.5rem',
            background: (() => {
              switch (selectedScenario.id) {
                case 'restaurant': return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
                case 'shopping': return 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)';
                case 'hotel': return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';
                case 'friend': return 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)';
                case 'interview': return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                case 'doctor': return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
                default: return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
              }
            })(),
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            {selectedScenario.icon} {selectedScenario.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>{selectedScenario.description}</p>
        </div>
      </div>

      <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', marginBottom: '1rem' }}>
          {messages.map(message => {
            const isAI = message.role === 'assistant';
            const { jp, vi, op } = isAI ? parseMessageContent(message.content) : { jp: message.content, vi: '', op: [] };
            const isExpanded = suggestionStates[message.id];

            return (
              <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAI ? 'flex-start' : 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: isAI ? 'var(--card-bg-hover)' : 'var(--primary-gradient)',
                  color: isAI ? 'var(--text-primary)' : 'white',
                  border: isAI ? '1px solid var(--border-color)' : 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{jp}</div>
                </div>

                {/* Suggestions Section (Translation + Options) */}
                {isAI && (
                  <div style={{ marginTop: '0.5rem', maxWidth: '70%', width: '100%' }}>
                    {!isExpanded ? (
                      <button
                        onClick={() => toggleSuggestion(message.id)}
                        className="btn-suggestion"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.9rem',
                          padding: '0.5rem',
                          fontWeight: '600'
                        }}
                      >
                        💡 Gợi ý câu trả lời & Dịch
                      </button>
                    ) : (
                      <div style={{
                        marginTop: '0.5rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        padding: '1rem',
                        border: '1px solid var(--border-color)',
                        animation: 'fadeIn 0.3s ease'
                      }}>
                        {/* Translation */}
                        {vi && (
                          <div style={{
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                            fontWeight: '500'
                          }}>
                            🇻🇳 {vi}
                          </div>
                        )}

                        {/* Options */}
                        {op.length > 0 && (
                          <div className="suggestion-options">
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                              💬 Gợi ý trả lời:
                            </div>
                            {op.map((opt, idx) => {
                              const cleanOpt = opt.replace(/^\d+\.\s*/, '').split('(')[0].trim();
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setInput(cleanOpt)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem',
                                    background: 'white',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    marginBottom: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <button
                          onClick={() => toggleSuggestion(message.id)}
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '0.75rem',
                            width: '100%',
                            textAlign: 'center',
                            fontWeight: '500'
                          }}
                        >
                          Thu gọn 🔼
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.6 }}>
                  {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'var(--card-bg-hover)', border: '1px solid var(--border-color)' }}>
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
              autoFocus
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConversation;
