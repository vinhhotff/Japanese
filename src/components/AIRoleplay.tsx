import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAIResponse } from '../services/aiService';
import '../styles/custom-theme.css';

interface Message {
  role: 'user' | 'ai' | 'system';
  content: string;
  isCorrect?: boolean;
  explanation?: string;
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
    context: 'Bạn đang ở một nhà hàng Nhật Bản và muốn gọi món. Nhân viên phục vụ sẽ hỏi bạn muốn gọi gì.',
    difficulty: 'easy'
  },
  {
    id: 'shopping',
    title: '🛍️ Mua sắm',
    description: 'Mua quần áo tại cửa hàng',
    context: 'Bạn đang ở một cửa hàng quần áo và muốn thử một chiếc áo. Nhân viên sẽ giúp bạn.',
    difficulty: 'easy'
  },
  {
    id: 'station',
    title: '🚉 Ga tàu',
    description: 'Hỏi đường và mua vé tàu',
    context: 'Bạn đang ở ga tàu và cần mua vé đi Tokyo. Nhân viên bán vé sẽ hỗ trợ bạn.',
    difficulty: 'medium'
  },
  {
    id: 'hotel',
    title: '🏨 Khách sạn',
    description: 'Check-in tại khách sạn',
    context: 'Bạn đến khách sạn để check-in. Nhân viên lễ tân sẽ xác nhận đặt phòng của bạn.',
    difficulty: 'medium'
  },
  {
    id: 'hospital',
    title: '🏥 Bệnh viện',
    description: 'Khám bệnh và giải thích triệu chứng',
    context: 'Bạn không khỏe và đến bệnh viện. Bác sĩ sẽ hỏi về triệu chứng của bạn.',
    difficulty: 'hard'
  },
  {
    id: 'interview',
    title: '💼 Phỏng vấn',
    description: 'Phỏng vấn xin việc',
    context: 'Bạn đang phỏng vấn cho một công ty Nhật Bản. Người phỏng vấn sẽ hỏi về kinh nghiệm của bạn.',
    difficulty: 'hard'
  }
];

const AIRoleplay = () => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOption | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([]);

  const startScenario = async (scenario: ScenarioOption) => {
    setSelectedScenario(scenario);
    setMessages([
      {
        role: 'system',
        content: `Tình huống: ${scenario.context}`
      }
    ]);
    setShowOptions(false);
    
    // AI bắt đầu hội thoại
    await getAIResponseFromService(scenario.context, [], true);
  };

  const getAIResponseFromService = async (context: string, history: Message[], isFirst: boolean = false) => {
    setLoading(true);
    
    try {
      const prompt = isFirst 
        ? `Bạn là một người Nhật đang trong tình huống: ${context}

Hãy bắt đầu cuộc hội thoại bằng tiếng Nhật một cách tự nhiên. Chỉ nói 1-2 câu ngắn gọn.

Sau đó, đề xuất 3 cách trả lời phù hợp cho người học (bằng tiếng Nhật), từ dễ đến khó.

Format trả lời:
AI: [Lời nói của bạn bằng tiếng Nhật]
---
OPTIONS:
1. [Lựa chọn 1 - dễ]
2. [Lựa chọn 2 - trung bình]
3. [Lựa chọn 3 - nâng cao]`
        : `Tình huống: ${context}

Lịch sử hội thoại:
${history.map(m => `${m.role === 'user' ? 'Học viên' : 'Bạn'}: ${m.content}`).join('\n')}

Hãy tiếp tục cuộc hội thoại một cách tự nhiên. Nói 1-2 câu ngắn gọn bằng tiếng Nhật.

Sau đó, đề xuất 3 cách trả lời tiếp theo cho người học.

Format trả lời:
AI: [Lời nói của bạn]
---
OPTIONS:
1. [Lựa chọn 1]
2. [Lựa chọn 2]
3. [Lựa chọn 3]`;

      const aiResponse = await getAIResponse([
        { role: 'user', content: prompt }
      ]);
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }
      
      const response = aiResponse.content;
      
      // Parse response
      const parts = response.split('---');
      const aiMessage = parts[0].replace('AI:', '').trim();
      const optionsText = parts[1] || '';
      
      const options = optionsText
        .split('\n')
        .filter((line: string) => line.match(/^\d\./))
        .map((line: string) => line.replace(/^\d\.\s*/, '').trim());

      setMessages(prev => [...prev, {
        role: 'ai',
        content: aiMessage
      }]);
      
      setSuggestedOptions(options);
      setShowOptions(true);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Lỗi kết nối AI. Vui lòng thử lại.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChoice = async (choice: string) => {
    // Add user message
    const newMessages = [...messages, {
      role: 'user' as const,
      content: choice
    }];
    setMessages(newMessages);
    setShowOptions(false);
    setUserInput('');
    
    // Get AI evaluation and next response
    await evaluateAndContinue(choice, newMessages);
  };

  const handleCustomInput = async () => {
    if (!userInput.trim()) return;
    
    const newMessages = [...messages, {
      role: 'user' as const,
      content: userInput
    }];
    setMessages(newMessages);
    setShowOptions(false);
    setUserInput('');
    
    await evaluateAndContinue(userInput, newMessages);
  };

  const evaluateAndContinue = async (userResponse: string, history: Message[]) => {
    setLoading(true);
    
    try {
      const context = selectedScenario?.context || '';
      const conversationHistory = history
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Học viên' : 'AI'}: ${m.content}`)
        .join('\n');
      
      const prompt = `Tình huống: ${context}

Lịch sử hội thoại:
${conversationHistory}

Hãy đánh giá câu trả lời của học viên:
1. Có phù hợp với ngữ cảnh không?
2. Ngữ pháp có đúng không?
3. Từ vựng có phù hợp không?
4. Mức độ lịch sự có phù hợp không?

Nếu có lỗi, hãy giải thích và đưa ra cách nói đúng.

Sau đó, tiếp tục cuộc hội thoại và đề xuất 3 lựa chọn tiếp theo.

Format trả lời:
EVALUATION: [Đánh giá - "Tốt!" hoặc giải thích lỗi]
CORRECT: [Cách nói đúng nếu có lỗi, bỏ qua nếu đúng]
---
AI: [Lời nói tiếp theo của bạn]
---
OPTIONS:
1. [Lựa chọn 1]
2. [Lựa chọn 2]
3. [Lựa chọn 3]`;

      const aiResponse = await getAIResponse([
        { role: 'user', content: prompt }
      ]);
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }
      
      const response = aiResponse.content;
      
      // Parse response
      const sections = response.split('---');
      const evaluationSection = sections[0] || '';
      const aiSection = sections[1] || '';
      const optionsSection = sections[2] || '';
      
      // Extract evaluation
      const evaluationMatch = evaluationSection.match(/EVALUATION:\s*(.+?)(?=CORRECT:|$)/s);
      const evaluation = evaluationMatch ? evaluationMatch[1].trim() : '';
      
      const correctMatch = evaluationSection.match(/CORRECT:\s*(.+?)$/s);
      const correctVersion = correctMatch ? correctMatch[1].trim() : '';
      
      const isCorrect = evaluation.includes('Tốt') || evaluation.includes('tốt') || evaluation.includes('đúng');
      
      // Update last user message with evaluation
      setMessages(prev => {
        const updated = [...prev];
        const lastUserIndex = updated.length - 1;
        updated[lastUserIndex] = {
          ...updated[lastUserIndex],
          isCorrect,
          explanation: isCorrect ? 'Tốt lắm! Câu trả lời phù hợp.' : `${evaluation}${correctVersion ? `\n\nCách nói đúng: ${correctVersion}` : ''}`
        };
        return updated;
      });
      
      // Add AI response
      const aiMessage = aiSection.replace('AI:', '').trim();
      if (aiMessage) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: aiMessage
        }]);
      }
      
      // Extract options
      const options = optionsSection
        .split('\n')
        .filter((line: string) => line.match(/^\d\./))
        .map((line: string) => line.replace(/^\d\.\s*/, '').trim());
      
      if (options.length > 0) {
        setSuggestedOptions(options);
        setShowOptions(true);
      }
      
    } catch (error) {
      console.error('Error evaluating response:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setSelectedScenario(null);
    setMessages([]);
    setUserInput('');
    setShowOptions(false);
    setSuggestedOptions([]);
  };

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
            <p>Chọn tình huống và thực hành hội thoại. AI sẽ đánh giá và gợi ý cách nói đúng.</p>
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
                  onClick={() => startScenario(scenario)}
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
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '2rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={resetConversation}
            className="back-button"
            style={{ 
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Chọn tình huống khác
          </button>
          
          <div style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {selectedScenario.title}
          </div>
        </div>

        {/* Chat Container */}
        <div className="card" style={{ 
          padding: '2rem',
          marginBottom: '2rem',
          minHeight: '500px',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                gap: '1rem'
              }}
            >
              {message.role !== 'system' && (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: message.role === 'user' ? '#2196f3' : '#4caf50',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}>
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
              )}
              
              <div style={{ flex: 1, maxWidth: message.role === 'system' ? '100%' : '70%' }}>
                <div style={{
                  padding: '1rem',
                  background: message.role === 'system' 
                    ? 'var(--bg-secondary)'
                    : message.role === 'user'
                      ? message.isCorrect === false ? '#fce4ec' : '#e3f2fd'
                      : '#f7fdf8',
                  border: `1px solid ${
                    message.role === 'system' 
                      ? 'var(--border-color)'
                      : message.role === 'user'
                        ? message.isCorrect === false ? '#e91e63' : '#2196f3'
                        : '#4caf50'
                  }`,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: 'var(--text-primary)'
                }}>
                  {message.content}
                </div>
                
                {message.explanation && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: message.isCorrect ? '#e8f5e9' : '#fff3e0',
                    border: `1px solid ${message.isCorrect ? '#4caf50' : '#ff9800'}`,
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-line',
                    color: 'var(--text-primary)'
                  }}>
                    <strong>{message.isCorrect ? '✓ ' : '⚠️ '}</strong>
                    {message.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
              AI đang suy nghĩ...
            </div>
          )}
        </div>

        {/* Input Area */}
        {showOptions && !loading && (
          <div style={{ marginBottom: 'var(--space-3xl)' }}>
            <div style={{ 
              fontSize: '0.9375rem', 
              fontWeight: 600, 
              marginBottom: '0.75rem',
              color: 'var(--text-primary)'
            }}>
              Chọn câu trả lời hoặc tự nhập:
            </div>
            
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {suggestedOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleUserChoice(option)}
                  className="card"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    fontSize: '1rem'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#2196f3', marginRight: 'var(--space-sm)' }}>
                    {index + 1}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomInput()}
                placeholder="Hoặc nhập câu trả lời của bạn..."
                className="form-group"
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={handleCustomInput}
                className="btn btn-primary"
                disabled={!userInput.trim()}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem'
                }}
              >
                Gửi
              </button>
            </div>
          </div>
        )}
      </div>
  );
};

export default AIRoleplay;
