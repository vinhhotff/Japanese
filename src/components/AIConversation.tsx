import { useState, useRef, useEffect } from 'react';
import { getAIResponse, createSystemPrompt, getMockResponse } from '../services/aiService';
import '../App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  translation?: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scenarios: ConversationScenario[] = [
    {
      id: 'restaurant',
      title: 'Nhà hàng',
      description: 'Luyện giao tiếp khi đi ăn nhà hàng',
      level: 'N5-N4',
      icon: '🍜',
      systemPrompt: 'Bạn là nhân viên phục vụ tại một nhà hàng Nhật Bản. Hãy trả lời bằng tiếng Nhật đơn giản (N5-N4), thân thiện và lịch sự. Sau mỗi câu tiếng Nhật, thêm bản dịch tiếng Việt trong ngoặc đơn.'
    },
    {
      id: 'shopping',
      title: 'Mua sắm',
      description: 'Hỏi giá, thử đồ, thanh toán',
      level: 'N5-N4',
      icon: '🛍️',
      systemPrompt: 'Bạn là nhân viên bán hàng tại cửa hàng Nhật Bản. Hãy trả lời bằng tiếng Nhật đơn giản (N5-N4), nhiệt tình và lịch sự. Sau mỗi câu tiếng Nhật, thêm bản dịch tiếng Việt trong ngoặc đơn.'
    },
    {
      id: 'hotel',
      title: 'Khách sạn',
      description: 'Check-in, yêu cầu dịch vụ',
      level: 'N4-N3',
      icon: '🏨',
      systemPrompt: 'Bạn là nhân viên lễ tân khách sạn Nhật Bản. Hãy trả lời bằng tiếng Nhật lịch sự (N4-N3), chuyên nghiệp. Sau mỗi câu tiếng Nhật, thêm bản dịch tiếng Việt trong ngoặc đơn.'
    },
    {
      id: 'friend',
      title: 'Bạn bè',
      description: 'Trò chuyện thân mật với bạn',
      level: 'N5-N3',
      icon: '👥',
      systemPrompt: 'Bạn là một người bạn Nhật Bản thân thiết. Hãy trò chuyện bằng tiếng Nhật thân mật, tự nhiên (N5-N3). Sau mỗi câu tiếng Nhật, thêm bản dịch tiếng Việt trong ngoặc đơn.'
    },
    {
      id: 'interview',
      title: 'Phỏng vấn',
      description: 'Phỏng vấn xin việc',
      level: 'N3-N2',
      icon: '💼',
      systemPrompt: 'Bạn là nhà tuyển dụng tại công ty Nhật Bản. Hãy phỏng vấn bằng tiếng Nhật lịch sự, chuyên nghiệp (N3-N2). Sau mỗi câu tiếng Nhật, thêm bản dịch tiếng Việt trong ngoặc đơn.'
    },
    {
      id: 'doctor',
      title: 'Bác sĩ',
      description: 'Khám bệnh, mô tả triệu chứng',
      level: 'N4-N3',
      icon: '⚕️',
      systemPrompt: 'Bạn là bác sĩ tại phòng khám Nhật Bản. Hãy hỏi về triệu chứng và tư vấn bằng tiếng Nhật (N4-N3), quan tâm và chuyên nghiệp. Sau mỗi câu tiếng Nhật, thêm bản dịch tiếng Việt trong ngoặc đơn.'
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startConversation = (scenario: ConversationScenario) => {
    setSelectedScenario(scenario);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: getGreeting(scenario.id),
        timestamp: new Date(),
      }
    ]);
  };

  const getGreeting = (scenarioId: string): string => {
    const greetings: Record<string, string> = {
      restaurant: 'いらっしゃいませ！何名様ですか？\n(Xin chào! Quý khách mấy người ạ?)',
      shopping: 'いらっしゃいませ！何かお探しですか？\n(Xin chào! Quý khách đang tìm gì ạ?)',
      hotel: 'いらっしゃいませ。チェックインでしょうか？\n(Xin chào. Quý khách check-in phải không ạ?)',
      friend: 'やあ！元気？最近どう？\n(Chào bạn! Khỏe không? Dạo này thế nào?)',
      interview: 'こんにちは。本日はお越しいただきありがとうございます。\n(Xin chào. Cảm ơn bạn đã đến hôm nay.)',
      doctor: 'こんにちは。今日はどうされましたか？\n(Xin chào. Hôm nay bạn thấy không khỏe chỗ nào?)'
    };
    return greetings[scenarioId] || 'こんにちは！\n(Xin chào!)';
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedScenario) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      // Check if AI is configured
      const hasOpenAI = import.meta.env.VITE_OPENAI_API_KEY;
      const hasGemini = import.meta.env.VITE_GEMINI_API_KEY;
      
      let aiContent: string;

      if (hasOpenAI || hasGemini) {
        // Use real AI
        const conversationMessages = [
          createSystemPrompt(selectedScenario.systemPrompt),
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content.split('\n')[0], // Remove translation for AI
          })),
          {
            role: 'user' as const,
            content: userInput,
          },
        ];

        const response = await getAIResponse(conversationMessages);
        
        if (response.error) {
          console.error('AI Error:', response.error);
          aiContent = getMockResponse(userInput, selectedScenario.id);
        } else {
          aiContent = response.content;
        }
      } else {
        // Use mock response
        aiContent = getMockResponse(userInput, selectedScenario.id);
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to mock response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getMockResponse(userInput, selectedScenario.id),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setLoading(false);
    }
  };



  const resetConversation = () => {
    setSelectedScenario(null);
    setMessages([]);
    setInput('');
  };

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

        <div className="card" style={{ marginTop: '2rem', background: 'var(--warning-light)', border: '2px solid var(--warning-color)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <svg style={{ width: '32px', height: '32px', color: 'var(--warning-color)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 style={{ fontWeight: '700', color: 'var(--warning-color)', marginBottom: '0.5rem' }}>
                {import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY 
                  ? 'Hướng dẫn sử dụng' 
                  : '⚠️ Chưa cấu hình AI'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                {import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY 
                  ? 'Chọn tình huống và bắt đầu trò chuyện bằng tiếng Nhật. AI sẽ phản hồi phù hợp với ngữ cảnh.' 
                  : 'Hiện đang dùng câu trả lời mẫu. Để sử dụng AI thực, hãy thêm API key vào file .env (xem hướng dẫn trong README).'}
              </p>
            </div>
          </div>
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
            {selectedScenario.icon} {selectedScenario.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {selectedScenario.description}
          </p>
        </div>
        <button 
          className="btn btn-outline"
          onClick={() => setShowTranslation(!showTranslation)}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {showTranslation ? 'Ẩn' : 'Hiện'} dịch
        </button>
      </div>

      <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', marginBottom: '1rem' }}>
          {messages.map(message => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
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
                }}
              >
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {showTranslation ? message.content : message.content.split('\n')[0]}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '0.5rem',
                  opacity: 0.7
                }}>
                  {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
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
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập tin nhắn bằng tiếng Nhật..."
              className="input"
              style={{ flex: 1 }}
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

export default AIConversation;
