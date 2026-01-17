import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAIResponse, createSystemPrompt, getMockResponse } from '../services/aiService';
import AnimatedCharacter from './AnimatedCharacter';
import '../styles/ai-roleplay-css.css';
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
  animatedCharacter: 'waiter' | 'shopkeeper' | 'friend' | 'teacher' | 'student';
}

const AIConversation = () => {
  const [searchParams] = useSearchParams();
  const [selectedLanguage, setSelectedLanguage] = useState<'japanese' | 'chinese' | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);

  // Handle language from URL parameter
  useEffect(() => {
    const lang = searchParams.get('lang');
    if (lang === 'japanese' || lang === 'chinese') {
      setSelectedLanguage(lang);
    }
  }, [searchParams]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false); // Global toggle
  const [suggestionStates, setSuggestionStates] = useState<Record<string, boolean>>({}); // Individual toggle
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [savedConversation, setSavedConversation] = useState<{
    scenario: ConversationScenario;
    messages: Message[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const japaneseScenarios: ConversationScenario[] = [
    {
      id: 'restaurant',
      title: 'Nhà hàng',
      description: 'Luyện giao tiếp khi đi ăn nhà hàng',
      level: 'N5-N4',
      icon: '🍜',
      systemPrompt: 'Bạn là nhân viên nhà hàng Nhật. QUAN TRỌNG:\n- Trả lời bằng tiếng Nhật N5-N4\n- Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý tiếng Nhật 1] (Dịch)\n2. [Gợi ý tiếng Nhật 2] (Dịch)\n3. [Gợi ý tiếng Nhật 3] (Dịch)\n\nVí dụ:\n[JP] いらっしゃいませ！何名様ですか？\n[VI] Xin chào! Quý khách đi mấy người ạ?\n[OP]\n1. ひとりです (Tôi đi một mình)\n2. 二人です (Tôi đi 2 người)\n3. 予約しています (Tôi đã đặt bàn)',
      animatedCharacter: 'waiter'
    },
    {
      id: 'shopping',
      title: 'Mua sắm',
      description: 'Hỏi giá, thử đồ, thanh toán',
      level: 'N5-N4',
      icon: '🛍️',
      systemPrompt: 'Bạn là nhân viên cửa hàng. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)',
      animatedCharacter: 'shopkeeper'
    },
    {
      id: 'hotel',
      title: 'Khách sạn',
      description: 'Check-in, yêu cầu dịch vụ',
      level: 'N4-N3',
      icon: '🏨',
      systemPrompt: 'Bạn là lễ tân khách sạn. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)',
      animatedCharacter: 'waiter'
    },
    {
      id: 'friend',
      title: 'Bạn bè',
      description: 'Trò chuyện thân mật với bạn',
      level: 'N5-N3',
      icon: '👥',
      systemPrompt: 'Bạn là bạn thân người Nhật. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)',
      animatedCharacter: 'friend'
    },
    {
      id: 'interview',
      title: 'Phỏng vấn',
      description: 'Phỏng vấn xin việc',
      level: 'N3-N2',
      icon: '💼',
      systemPrompt: 'Bạn là nhà tuyển dụng. Format BẮT BUỘC:\n[JP] [Câu tiếng Nhật]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)',
      animatedCharacter: 'shopkeeper'
    }
  ];

  const chineseScenarios: ConversationScenario[] = [
    {
      id: 'restaurant_cn',
      title: 'Nhà hàng (餐厅)',
      description: 'Gọi món và giao tiếp tại nhà hàng Trung Quốc',
      level: 'HSK1-2',
      icon: '🥟',
      systemPrompt: 'Bạn là phục vụ bàn tại Trung Quốc. QUAN TRỌNG:\n- Trả lời bằng tiếng Trung HSK 1-2\n- Format BẮT BUỘC:\n[ZH] [Câu tiếng Trung]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý tiếng Trung 1] (Dịch)\n2. [Gợi ý tiếng Trung 2] (Dịch)\n3. [Gợi ý tiếng Trung 3] (Dịch)',
      animatedCharacter: 'waiter'
    },
    {
      id: 'shopping_cn',
      title: 'Mua sắm (购物)',
      description: 'Hỏi giá và mặc cả tại chợ/cửa hàng',
      level: 'HSK2-3',
      icon: '💰',
      systemPrompt: 'Bạn là người bán hàng Trung Quốc. Trả lời ngắn gọn. Format BẮT BUỘC:\n[ZH] [Câu tiếng Trung]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)',
      animatedCharacter: 'shopkeeper'
    },
    {
      id: 'travel_cn',
      title: 'Du lịch (旅游)',
      description: 'Hỏi đường, đi taxi, tham quan',
      level: 'HSK2-3',
      icon: '🏮',
      systemPrompt: 'Bạn là người dân địa phương nhiệt tình. Format BẮT BUỘC:\n[ZH] [Câu tiếng Trung]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)',
      animatedCharacter: 'friend'
    },
    {
      id: 'friend_cn',
      title: 'Bạn bè (朋友)',
      description: 'Luyện nói chuyện phiếm với bạn bè',
      level: 'HSK1-3',
      icon: '🧋',
      systemPrompt: 'Bạn là bạn người Trung Quốc. Dùng ngôn ngữ tự nhiên. Format BẮT BUỘC:\n[ZH] [Câu tiếng Trung]\n[VI] [Dịch tiếng Việt]\n[OP]\n1. [Gợi ý 1] (Dịch)\n2. [Gợi ý 2] (Dịch)\n3. [Gợi ý 3] (Dịch)',
      animatedCharacter: 'friend'
    }
  ];

  const currentScenarios = selectedLanguage === 'japanese' ? japaneseScenarios : chineseScenarios;

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
      // Attempt to restore language
      if (savedConversation.scenario.id.endsWith('_cn')) {
        setSelectedLanguage('chinese');
      } else {
        setSelectedLanguage('japanese');
      }
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
    setSelectedLanguage(null);
    setSuggestionStates({});
  };

  const resetConversation = () => {
    localStorage.removeItem('ai-conversation-chat');
    setMessages([]);
    setSelectedScenario(null);
    setSelectedLanguage(null);
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
      // Chinese
      restaurant_cn: '[ZH] 您好！请问几位？\n[VI] Xin chào! Quý khách đi mấy người ạ?\n[OP]\n1. 一个人 (Một người)\n2. 两位 (Hai người)\n3. 我有订位 (Tôi đã đặt bàn)',
      shopping_cn: '[ZH] 您好！想买什么？\n[VI] Xin chào! Bạn muốn mua gì?\n[OP]\n1. 我先看看 (Tôi xem trước đã)\n2. 这个多少钱？ (Cái này bao nhiêu tiền?)\n3. 有大一点的吗？ (Có cái nào to hơn không?)',
      travel_cn: '[ZH] 你好！要去哪里？\n[VI] Chào bạn! Bạn muốn đi đâu?\n[OP]\n1. 我要去故宫 (Tôi muốn đi Cố Cung)\n2. 这里怎么走？ (Chỗ này đi thế nào?)\n3. 多少钱？ (Bao nhiêu tiền?)',
      friend_cn: '[ZH] 嗨！最近怎么样？\n[VI] Hi! Dạo này thế nào?\n[OP]\n1. 挺好的 (Rất tốt)\n2. 还可以 (Cũng bình thường)\n3. 挺忙的 (Khá là bận)'
    };

    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: greetings[scenario.id] || (selectedLanguage === 'japanese' ? '[JP] こんにちは！\n[VI] Xin chào!' : '[ZH] 你好！\n[VI] Xin chào!'),
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

        // Fallback or Mock
        const tag = selectedLanguage === 'japanese' ? '[JP]' : '[ZH]';
        if (!aiContent.includes(tag)) {
          aiContent = `${tag} ${aiContent}\n[VI] (Bản dịch đang cập nhật)\n[OP]`;
        }

      } else {
        // Fallback or Mock
        aiContent = selectedLanguage === 'japanese'
          ? '[JP] すみません、エラーが発生しました。\n[VI] Xin lỗi, đã có lỗi xảy ra.\n[OP]'
          : '[ZH] 对不起，发生了错误。\n[VI] Xin lỗi, đã có lỗi xảy ra.\n[OP]';
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
    const jpMatch = content.match(/\[(JP|ZH)\]([\s\S]*?)(?=\[VI\]|$)/);
    const viMatch = content.match(/\[VI\]([\s\S]*?)(?=\[OP\]|$)/);
    const opMatch = content.match(/\[OP\]([\s\S]*)/);

    return {
      jp: jpMatch ? jpMatch[2].trim() : content,
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

  if (!selectedLanguage) {
    return (
      <div className="container" data-language="both">
        <div className="header">
          <h1>
            <span className="title-highlight">Nhập vai cùng AI</span>
          </h1>
          <p>Chọn ngôn ngữ bạn muốn luyện tập giao tiếp</p>
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          maxWidth: '1000px',
          margin: '3rem auto',
          flexWrap: 'wrap'
        }}>
          {/* Japanese Card */}
          <div
            className="lang-card-premium jp-style"
            onClick={() => setSelectedLanguage('japanese')}
          >
            <div className="lang-box">JP</div>
            <div className="lang-info">
              <span className="lang-name">Tiếng Nhật</span>
              <span className="lang-native">日本語</span>
              <span className="lang-desc">Luyện tập giao tiếp JLPT N5-N2</span>
            </div>
            <div className="lang-indicator"></div>
          </div>

          {/* Chinese Card */}
          <div
            className="lang-card-premium cn-style"
            onClick={() => setSelectedLanguage('chinese')}
          >
            <div className="lang-box">CN</div>
            <div className="lang-info">
              <span className="lang-name">Tiếng Trung</span>
              <span className="lang-native">中文</span>
              <span className="lang-desc">Luyện tập giao tiếp HSK 1-6</span>
            </div>
            <div className="lang-indicator"></div>
          </div>
        </div>

      </div>
    );
  }

  if (!selectedScenario) {
    return (
      <div className="container" data-language={selectedLanguage}>
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setSelectedLanguage(null)} style={{ padding: '0.5rem 1rem' }}>
              Thay đổi ngôn ngữ
            </button>
            <span style={{ fontSize: '2rem' }}>{selectedLanguage === 'japanese' ? '🇯🇵' : '🇨🇳'}</span>
          </div>
          <h1>
            <span className="title-highlight">Nhập vai cùng AI</span>
          </h1>
          <p>Luyện giao tiếp {selectedLanguage === 'japanese' ? 'tiếng Nhật' : 'tiếng Trung'} trong các tình huống thực tế</p>
        </div>
        <div className="card-grid">
          {currentScenarios.map(scenario => (
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

      <div className="conversation-grid">
        {/* Left Panel: Animated Character */}
        <div className="character-frame-css" style={{
          borderColor: (() => {
            switch (selectedScenario.id) {
              case 'restaurant': return '#f97316';
              case 'shopping': return '#ec4899';
              case 'hotel': return '#eab308';
              case 'friend': return '#22c55e';
              case 'interview': return '#3b82f6';
              case 'doctor': return '#06b6d4';
              default: return 'var(--primary-color)';
            }
          })()
        }}>
          <div className="frame-header-css">
            <span className="status-dot-css"></span>
            {selectedScenario.title}
          </div>
          <div className="character-stage-css">
            <AnimatedCharacter
              isSpeaking={loading}
              character={selectedScenario.animatedCharacter}
            />
            {loading && <div className="thought-bubble-css">💭</div>}
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className="chat-frame-css">
          <div className="messages-list-css">
            {messages.map(message => {
              const isAI = message.role === 'assistant';
              const { jp, vi, op } = isAI ? parseMessageContent(message.content) : { jp: message.content, vi: '', op: [] };
              const isExpanded = suggestionStates[message.id];

              return (
                <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAI ? 'flex-start' : 'flex-end', marginBottom: '1rem' }}>
                  <div className={`message-css ${isAI ? 'ai' : 'user'}`}>
                    <div style={{ whiteSpace: 'pre-line' }}>{jp}</div>
                  </div>

                  {isAI && (
                    <div style={{ marginTop: '0.25rem', width: '100%', maxWidth: '90%' }}>
                      {!isExpanded ? (
                        <button
                          onClick={() => toggleSuggestion(message.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-color)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: '600',
                            padding: '0.25rem'
                          }}
                        >
                          💡 Gợi ý & Dịch
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
                          {vi && (
                            <div style={{
                              marginBottom: '0.75rem',
                              paddingBottom: '0.5rem',
                              borderBottom: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                              fontStyle: 'italic',
                              fontSize: '0.9rem'
                            }}>
                              🇻🇳 {vi}
                            </div>
                          )}

                          {op.length > 0 && (
                            <div className="options-list-css" style={{ border: 'none', padding: 0 }}>
                              <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Gợi ý trả lời:</p>
                              {op.slice(0, 3).map((opt, idx) => {
                                const cleanOpt = opt.replace(/^\d+\.\s*/, '').split('(')[0].trim();
                                return (
                                  <button
                                    key={idx}
                                    className="option-css"
                                    onClick={() => setInput(cleanOpt)}
                                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', marginBottom: '0.25rem' }}
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
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              marginTop: '0.5rem',
                              width: '100%',
                              textAlign: 'center'
                            }}
                          >
                            Thu gọn 🔼
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="option-css"
              style={{ flex: 1, cursor: 'text', margin: 0 }}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ borderRadius: '12px', padding: '0 1.5rem' }}
            >
              {loading ? '...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConversation;
