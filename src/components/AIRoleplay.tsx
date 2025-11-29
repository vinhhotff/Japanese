import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAIResponse } from '../services/aiService';
import { translateToVietnamese } from '../services/translateService';
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
    context:
      'Bạn đang đóng vai **nhân viên phục vụ tại một nhà hàng Nhật**. Khách (người học) vừa bước vào quán. Nhiệm vụ của bạn:\n' +
      '- Chào khách lịch sự.\n' +
      '- Hỏi số người trong nhóm.\n' +
      '- Dẫn khách vào bàn (nếu phù hợp với đoạn hội thoại).\n' +
      '- Gợi ý một vài món ăn phổ biến.\n' +
      '- Trả lời ngắn gọn, rõ ràng.\n' +
      '\nYêu cầu ngôn ngữ:\n' +
      '- Chỉ dùng **tiếng Nhật N5–N4**.\n' +
      '- Dùng **Kanji + Hiragana**, không bao giờ dùng **Romaji**.\n' +
      '- Câu ngắn, dễ hiểu cho người học.',
    difficulty: 'easy'
  },
  {
    id: 'shopping',
    title: '🛍️ Mua sắm',
    description: 'Mua quần áo tại cửa hàng',
    context:
      'Bạn đang đóng vai **nhân viên cửa hàng quần áo Nhật**. Khách đang xem sản phẩm. Nhiệm vụ của bạn:\n' +
      '- Chào khách.\n' +
      '- Hỏi họ đang tìm loại quần áo nào.\n' +
      '- Giới thiệu một vài lựa chọn phù hợp.\n' +
      '- Hỏi size, màu sắc, nhu cầu thử đồ.\n' +
      '\nYêu cầu ngôn ngữ:\n' +
      '- Chỉ dùng **tiếng Nhật N5–N4**.\n' +
      '- Dùng **Kanji + Hiragana**, KHÔNG dùng **Romaji**.\n' +
      '- Câu ngắn, thân thiện, tự nhiên.',
    difficulty: 'easy'
  },
  {
    id: 'station',
    title: '🚉 Ga tàu',
    description: 'Hỏi đường và mua vé tàu',
    context:
      'Bạn đang đóng vai **nhân viên ga tàu tại Nhật**. Khách đang hỏi thông tin về tàu hoặc muốn mua vé. Nhiệm vụ của bạn:\n' +
      '- Chào khách.\n' +
      '- Hỏi điểm đến của khách.\n' +
      '- Giải thích giá vé, tuyến tàu phù hợp.\n' +
      '- Đưa ra thời gian tàu khởi hành gần nhất.\n' +
      '- Trả lời rõ ràng, lịch sự.\n' +
      '\nYêu cầu ngôn ngữ:\n' +
      '- Dùng **tiếng Nhật N4–N3**.\n' +
      '- Viết bằng **Kanji + Hiragana**, KHÔNG dùng Romaji.\n' +
      '- Câu ngắn, không dùng cấu trúc quá khó.',
    difficulty: 'medium'
  },
  {
    id: 'hotel',
    title: '🏨 Khách sạn',
    description: 'Check-in tại khách sạn',
    context:
      'Bạn đang đóng vai **nhân viên lễ tân khách sạn Nhật**. Khách đến quầy để check-in. Nhiệm vụ của bạn:\n' +
      '- Chào khách lịch sự.\n' +
      '- Hỏi tên khách và kiểm tra thông tin đặt phòng.\n' +
      '- Giải thích ngắn gọn về tiện nghi khách sạn.\n' +
      '- Hướng dẫn thời gian nhận/trả phòng.\n' +
      '\nYêu cầu ngôn ngữ:\n' +
      '- Dùng **tiếng Nhật N4–N3**.\n' +
      '- Sử dụng **Kanji + Hiragana**, KHÔNG dùng Romaji.\n' +
      '- Văn phong lịch sự (です／ます).',
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
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number | null>(null);
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([]);
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
      const systemPrompt = `${selectedScenario.context}

RULES:
- Respond ONLY in Japanese (Kanji/Hiragana)
- Add Vietnamese translation in parentheses ()
- Provide 3 OPTIONS in Japanese with translations
- Keep response SHORT (1-2 sentences)

FORMAT:
[Japanese]
(Vietnamese)

OPTIONS:
1. [Japanese] (Vietnamese)
2. [Japanese] (Vietnamese)
3. [Japanese] (Vietnamese)

EXAMPLE:
いらっしゃいませ！
(Xin chào!)

OPTIONS:
1. はい、お願いします (Vâng, làm ơn)
2. メニューをください (Cho tôi menu)
3. 水をください (Cho tôi nước)

Respond now:`;
      
      const conversationMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content.split('\n')[0]
        })),
        { role: 'user' as const, content: userInput }
      ];

      const response = await getAIResponse(conversationMessages);
      
      // 🔍 DEBUG: Console log AI response
      console.log('========== AI RAW RESPONSE ==========');
      console.log(response.content);
      console.log('=====================================');
      
      let aiContent: string;
      if (response.error) {
        aiContent = 'すみません、もう一度お願いします。\n(Xin lỗi, xin hãy nói lại.)';
      } else {
        // MAXIMUM AGGRESSIVE CLEANING: Remove ALL non-Japanese content
        aiContent = response.content;
        
        // Step 1: Remove ALL <think> tags (multiple aggressive passes)
        for (let i = 0; i < 5; i++) {
          aiContent = aiContent
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<think[\s\S]*?<\/think>/gi, '')
            .replace(/<think[\s\S]*?>/gi, '')
            .replace(/<\/think>/gi, '');
        }
        
        // Step 2: Remove EVERYTHING before first Japanese character or marker
        aiContent = aiContent.replace(/^[\s\S]*?(?=([ぁ-んァ-ヶー一-龯]|Gợi ý:|OPTIONS:))/i, '');
        
        // Step 3: Keep only Japanese content and OPTIONS
        aiContent = aiContent
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            // Keep Japanese lines
            if (/[ぁ-んァ-ヶー一-龯]/.test(trimmed)) return true;
            // Keep OPTIONS marker and numbered items
            if (/^(Gợi ý:|OPTIONS:)$/i.test(trimmed)) return true;
            if (/^\d+\.\s*.+/.test(trimmed)) return true;
            // Keep translation lines
            if (/^\(.*\)$/.test(trimmed)) return true;
            // Remove English thinking
            if (/^(Okay|Alright|Let me|Let's|So|Well|Now|First|Hmm|The user|I need|I should|This|That|Next|Check)/i.test(trimmed)) return false;
            return false; // Remove other lines
          })
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        // If AI didn't provide translation, add placeholder
        if (aiContent && !aiContent.match(/[\(（][^)）]+[\)）]/)) {
          aiContent = `${aiContent}\n(Vui lòng hover để xem nghĩa)`;
        }
        
        // If content is empty after cleaning, use fallback
        if (!aiContent) {
          aiContent = 'すみません、もう一度お願いします。\n(Xin lỗi, xin hãy nói lại.)';
        }
      }

      // Parse suggestions if present
      let mainContent = aiContent;
      let options: string[] = [];
      
      console.log('🔍 Checking for OPTIONS in:', aiContent);
      
      if (aiContent.includes('Gợi ý:') || aiContent.includes('OPTIONS:')) {
        const parts = aiContent.split(/Gợi ý:|OPTIONS:/i);
        mainContent = parts[0].trim();
        
        console.log('✅ Found OPTIONS! Main content:', mainContent);
        console.log('📝 Options part:', parts[1]);
        
        if (parts[1]) {
          const rawOptions = parts[1]
            .split('\n')
            .filter(line => line.match(/^\d\./))
            .map(line => line.replace(/^\d\.\s*/, '').trim())
            .slice(0, 3);
          
          console.log('🎯 Parsed options:', rawOptions);
          
          // Tự động dịch các options không có dịch
          const translationPromises = rawOptions.map(async (option) => {
            // Nếu đã có dịch trong ngoặc đơn, giữ nguyên
            if (option.match(/[\(（][^)）]+[\)）]/)) {
              return option;
            }
            
            // Nếu chưa có dịch, tự động dịch
            const translation = await translateToVietnamese(option);
            return `${option} (${translation})`;
          });
          
          options = await Promise.all(translationPromises);
        }
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mainContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // If no options provided, add default ones based on scenario
      if (options.length === 0) {
        const defaultOptions: Record<string, string[]> = {
          restaurant: [
            'はい、お願いします (Vâng, làm ơn)',
            'これをください (Cho tôi cái này)',
            'おすすめは何ですか？ (Món nào ngon nhất?)'
          ],
          shopping: [
            'これを試してもいいですか？ (Tôi có thể thử cái này không?)',
            'いくらですか？ (Bao nhiêu tiền?)',
            'もっと安いのはありますか？ (Có cái nào rẻ hơn không?)'
          ],
          station: [
            '東京まで一枚お願いします (Cho tôi một vé đến Tokyo)',
            '何時に出発しますか？ (Mấy giờ khởi hành?)',
            'どのホームですか？ (Ở sân ga nào?)'
          ],
          hotel: [
            'チェックインお願いします (Cho tôi check-in)',
            '朝食は何時からですか？ (Bữa sáng từ mấy giờ?)',
            'WiFiのパスワードは？ (Mật khẩu WiFi là gì?)'
          ]
        };
        options = defaultOptions[selectedScenario.id] || [
          'はい (Vâng)',
          'わかりました (Tôi hiểu rồi)',
          'ありがとうございます (Cảm ơn)'
        ];
      }
      
      setSuggestedOptions(options);
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '2rem',
          paddingBottom: '3rem'
        }}>
          {scenarios.map((scenario) => {
            const roleColors = {
              restaurant: { 
                color: '#10b981', 
                gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                shadow: 'rgba(16, 185, 129, 0.3)'
              },
              shopping: { 
                color: '#3b82f6', 
                gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                shadow: 'rgba(59, 130, 246, 0.3)'
              },
              station: { 
                color: '#8b5cf6', 
                gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                shadow: 'rgba(139, 92, 246, 0.3)'
              },
              hotel: { 
                color: '#ec4899', 
                gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                shadow: 'rgba(236, 72, 153, 0.3)'
              }
            };
            const colors = roleColors[scenario.id as keyof typeof roleColors];
            
            return (
              <button
                key={scenario.id}
                onClick={() => startConversation(scenario)}
                className="card"
                style={{
                  padding: '2rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: `3px solid ${colors.color}`,
                  borderRadius: '20px',
                  background: colors.gradient,
                  boxShadow: `0 8px 24px ${colors.shadow}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 16px 40px ${colors.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${colors.shadow}`;
                }}
              >
                {/* Decorative background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.1,
                  background: `radial-gradient(circle at 30% 30%, ${colors.color} 0%, transparent 60%)`,
                  pointerEvents: 'none'
                }} />

                {/* Emoji icon */}
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {scenario.title.split(' ')[0]}
                </div>

                {/* Title */}
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  color: colors.color,
                  marginBottom: '0.75rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {scenario.title.split(' ').slice(1).join(' ')}
                </h3>

                {/* Description */}
                <p style={{ 
                  fontSize: '0.9375rem', 
                  color: 'var(--text-secondary)',
                  marginBottom: '1.25rem',
                  lineHeight: 1.7,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {scenario.description}
                </p>

                {/* Difficulty badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: `2px solid ${colors.color}`,
                  borderRadius: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: colors.color,
                  boxShadow: `0 2px 8px ${colors.shadow}`,
                  position: 'relative',
                  zIndex: 1
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: colors.color,
                    boxShadow: `0 0 8px ${colors.color}`
                  }} />
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
            {selectedScenario.title}
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
            // Format: "Japanese (Vietnamese)" or "Japanese（Vietnamese）" or "Japanese\n(Vietnamese)"
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
          {/* Suggested Options */}
          {suggestedOptions.length > 0 && !loading && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                Chọn câu trả lời:
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {suggestedOptions.map((option, index) => {
                  // Check for both regular () and full-width （） parentheses
                  const hasTranslation = option.includes('(') || option.includes('（');
                  const match = option.match(/^(.*?)[\(（]([^)）]+)[\)）]?$/);
                  const japaneseText = match ? match[1].trim() : option.trim();
                  const translation = match ? match[2].trim() : '';
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setInput(japaneseText);
                        setSuggestedOptions([]);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--card-bg-hover)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-light)';
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                        if (hasTranslation && !showTranslation) {
                          setHoveredOptionIndex(index);
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--card-bg-hover)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        setHoveredOptionIndex(null);
                      }}
                    >
                      <span style={{ 
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--primary-color)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ flex: 1, fontWeight: 500 }}>
                        {showTranslation ? option : japaneseText}
                      </span>
                      
                      {/* Hover Tooltip for Options */}
                      {hasTranslation && !showTranslation && hoveredOptionIndex === index && translation && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            maxWidth: '300px',
                            textAlign: 'center',
                            pointerEvents: 'none',
                            animation: 'fadeIn 0.2s ease-out'
                          }}
                        >
                          <div style={{ 
                            fontStyle: 'italic',
                            color: 'var(--text-secondary)'
                          }}>
                            {translation}
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
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
              style={{
                transition: 'all 0.2s ease'
              }}
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
