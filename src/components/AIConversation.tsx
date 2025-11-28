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
  const [showTranslation, setShowTranslation] = useState(false);
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
      systemPrompt: 'Bạn là nhân viên nhà hàng Nhật. QUAN TRỌNG:\n- CHỈ trả lời bằng tiếng Nhật N5-N4\n- KHÔNG suy nghĩ, KHÔNG dùng <think>\n- BẮT BUỘC phải có dịch tiếng Việt\n- Format: [Câu tiếng Nhật]\n(Dịch tiếng Việt)\n- Ví dụ: いらっしゃいませ！\n(Xin chào!)'
    },
    {
      id: 'shopping',
      title: 'Mua sắm',
      description: 'Hỏi giá, thử đồ, thanh toán',
      level: 'N5-N4',
      icon: '🛍️',
      systemPrompt: 'Bạn là nhân viên cửa hàng quần áo Nhật Bản nhiệt tình. QUAN TRỌNG:\n- TUYỆT ĐỐI KHÔNG dùng <think>, KHÔNG suy nghĩ, KHÔNG giải thích\n- CHỈ trả lời TRỰC TIẾP bằng tiếng Nhật N5-N4\n- BẮT BUỘC phải có dịch tiếng Việt trong ngoặc đơn\n- Format: [Câu tiếng Nhật]\n(Dịch tiếng Việt)\n\nSau đó đưa ra 3 gợi ý trả lời:\nOPTIONS:\n1. [Câu dễ] (Dịch)\n2. [Câu trung bình] (Dịch)\n3. [Câu khó] (Dịch)\n\nVí dụ:\nいらっしゃいませ！何かお探しですか？\n(Xin chào! Bạn đang tìm gì ạ?)\n\nOPTIONS:\n1. [はい、シャツを探しています。] (Vâng, tôi đang tìm áo sơ mi.)\n2. [このセーター、試着できますか？] (Cái áo len này, tôi có thể thử được không?)\n3. [このデザイン、オリジナルですか？] (Thiết kế này có phải là độc quyền không?)'
    },
    {
      id: 'hotel',
      title: 'Khách sạn',
      description: 'Check-in, yêu cầu dịch vụ',
      level: 'N4-N3',
      icon: '🏨',
      systemPrompt: 'Bạn là lễ tân khách sạn Nhật. QUAN TRỌNG:\n- CHỈ trả lời bằng tiếng Nhật N4-N3\n- KHÔNG suy nghĩ, KHÔNG dùng <think>\n- BẮT BUỘC phải có dịch tiếng Việt\n- Format: [Câu tiếng Nhật]\n(Dịch tiếng Việt)\n- Ví dụ: チェックインでしょうか？\n(Quý khách check-in phải không ạ?)'
    },
    {
      id: 'friend',
      title: 'Bạn bè',
      description: 'Trò chuyện thân mật với bạn',
      level: 'N5-N3',
      icon: '👥',
      systemPrompt: 'Bạn là bạn thân người Nhật. QUAN TRỌNG:\n- CHỈ trả lời bằng tiếng Nhật N5-N3\n- KHÔNG suy nghĩ, KHÔNG dùng <think>\n- BẮT BUỘC phải có dịch tiếng Việt\n- Format: [Câu tiếng Nhật]\n(Dịch tiếng Việt)\n- Ví dụ: やあ！元気？\n(Chào bạn! Khỏe không?)'
    },
    {
      id: 'interview',
      title: 'Phỏng vấn',
      description: 'Phỏng vấn xin việc',
      level: 'N3-N2',
      icon: '💼',
      systemPrompt: 'Bạn là nhà tuyển dụng công ty Nhật. QUAN TRỌNG:\n- CHỈ trả lời bằng tiếng Nhật N3-N2\n- KHÔNG suy nghĩ, KHÔNG dùng <think>\n- BẮT BUỘC phải có dịch tiếng Việt\n- Format: [Câu tiếng Nhật]\n(Dịch tiếng Việt)\n- Ví dụ: 自己紹介をお願いします。\n(Xin hãy tự giới thiệu.)'
    },
    {
      id: 'doctor',
      title: 'Bác sĩ',
      description: 'Khám bệnh, mô tả triệu chứng',
      level: 'N4-N3',
      icon: '⚕️',
      systemPrompt: 'Bạn là bác sĩ phòng khám Nhật. QUAN TRỌNG:\n- CHỈ trả lời bằng tiếng Nhật N4-N3\n- KHÔNG suy nghĩ, KHÔNG dùng <think>\n- BẮT BUỘC phải có dịch tiếng Việt\n- Format: [Câu tiếng Nhật]\n(Dịch tiếng Việt)\n- Ví dụ: どうされましたか？\n(Bạn thấy không khỏe chỗ nào?)'
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
  };

  const resetConversation = () => {
    localStorage.removeItem('ai-conversation-chat');
    setMessages([]);
    setSelectedScenario(null);
    setSavedConversation(null);
  };

  const startConversation = (scenario: ConversationScenario) => {
    setSelectedScenario(scenario);
    const greetings: Record<string, string> = {
      restaurant: 'いらっしゃいませ！何名様ですか？\n(Xin chào! Quý khách mấy người ạ?)',
      shopping: 'いらっしゃいませ！何かお探しですか？\n(Xin chào! Quý khách đang tìm gì ạ?)',
      hotel: 'チェックインでしょうか？\n(Quý khách check-in phải không ạ?)',
      friend: 'やあ！元気？最近どう？\n(Chào bạn! Khỏe không? Dạo này thế nào?)',
      interview: 'こんにちは。本日はお越しいただきありがとうございます。\n(Xin chào. Cảm ơn bạn đã đến hôm nay.)',
      doctor: 'こんにちは。今日はどうされましたか？\n(Xin chào. Hôm nay bạn thấy không khỏe chỗ nào?)'
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
      const hasOpenAI = import.meta.env.VITE_OPENAI_API_KEY;
      const hasGemini = import.meta.env.VITE_GEMINI_API_KEY;
      const hasDeepSeek = import.meta.env.VITE_DEEPSEEK_API_KEY;
      const hasHuggingFace = import.meta.env.VITE_HUGGINGFACE_API_KEY;
      const hasQwen = import.meta.env.VITE_QWEN_API_KEY;
      const hasOpenRouter = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      let aiContent: string;

      if (hasOpenAI || hasGemini || hasDeepSeek || hasHuggingFace || hasQwen || hasOpenRouter) {
        const conversationMessages = [
          createSystemPrompt(selectedScenario.systemPrompt),
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content.split('\n')[0]
          })),
          { role: 'user' as const, content: userInput }
        ];

        const response = await getAIResponse(conversationMessages);
        
        if (response.error) {
          console.error('AI Error:', response.error);
          aiContent = getMockResponse(userInput, selectedScenario.id);
        } else {
          // Aggressive cleaning: Remove ALL thinking process and tags
          aiContent = response.content
            // Remove <think> tags with any content (greedy and non-greedy)
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<think[\s\S]*?>/gi, '')
            .replace(/<\/think>/gi, '')
            // Remove common thinking patterns at the start
            .replace(/^(Okay|Alright|Let me|Let's|So|Well|Now|First|Hmm)[,\s].*?(?=\n\n|AI_JA:|AI_VI:|EXPLAIN:|OPTIONS:|[ぁ-んァ-ヶー一-龯])/is, '')
            // Remove any remaining leading/trailing whitespace
            .replace(/^\s+/gm, '')
            .trim();
          
          // If AI didn't provide translation, add placeholder
          if (aiContent && !aiContent.match(/[\(（][^)）]+[\)）]/)) {
            aiContent = `${aiContent}\n(Vui lòng hover để xem nghĩa)`;
          }
          
          if (!aiContent) {
            aiContent = getMockResponse(userInput, selectedScenario.id);
          }
        }
      } else {
        aiContent = getMockResponse(userInput, selectedScenario.id);
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
        content: getMockResponse(userInput, selectedScenario.id),
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
            💬 Tiếp tục cuộc trò chuyện?
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
        <div className="header">
          <h1>
            <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Trò chuyện với AI
          </h1>
          <p>Luyện giao tiếp tiếng Nhật với AI trong các tình huống thực tế</p>
        </div>

        <div className="card-grid">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="card" style={{ cursor: 'pointer' }} onClick={() => startConversation(scenario)}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{scenario.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {scenario.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
                {scenario.description}
              </p>
              <span className={`badge badge-${scenario.level.toLowerCase().replace('-', '')}`}>
                {scenario.level}
              </span>
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
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            {selectedScenario.icon} {selectedScenario.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {selectedScenario.description}
          </p>
        </div>
        <button 
          className="btn btn-outline"
          onClick={() => setShowTranslation(!showTranslation)}
          style={{
            transition: 'all 0.3s ease',
            transform: showTranslation ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <svg style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {showTranslation ? (
              <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            ) : (
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            )}
          </svg>
          {showTranslation ? 'Ẩn dịch' : 'Hiện dịch'}
        </button>
      </div>

      <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', marginBottom: '1rem' }}>
          {messages.map(message => {
            // Parse Japanese and Vietnamese text
            let japaneseText = message.content;
            let vietnameseText = '';
            
            // Check for both regular () and full-width （） parentheses
            const match = message.content.match(/^(.*?)\s*[\n\(（]+([^)）]+)[\)）]?$/s);
            if (match) {
              japaneseText = match[1].trim();
              vietnameseText = match[2].trim();
            }

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
                    {japaneseText}
                  </div>
                  {/* Show translation below when toggle is ON - ONLY for AI messages */}
                  {showTranslation && message.role === 'assistant' && vietnameseText && (
                    <div style={{
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border-light)',
                      fontSize: '0.875rem',
                      fontStyle: 'italic',
                      color: 'var(--text-secondary)',
                      opacity: 0.9
                    }}>
                      {vietnameseText}
                    </div>
                  )}
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
                color: 'var(--text-primary)',
                transition: 'border-color 0.2s ease'
              }}
              disabled={loading}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
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

export default AIConversation;
