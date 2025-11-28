// AI Service for conversation
// Supports OpenAI GPT and Google Gemini

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  error?: string;
}

// OpenAI GPT Integration
async function callOpenAI(messages: Message[]): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return { 
      content: '', 
      error: 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.' 
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or 'gpt-4' for better quality
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  } catch (error: any) {
    console.error('OpenAI Error:', error);
    return { 
      content: '', 
      error: error.message || 'Failed to get response from OpenAI' 
    };
  }
}

// Google Gemini Integration
async function callGemini(messages: Message[]): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  console.log('🔑 GEMINI_API_KEY:', apiKey);
  console.log('🔑 Key length:', apiKey?.length);
  console.log('🔑 All env vars:', import.meta.env);
  
  if (!apiKey || apiKey === 'YOUR_NEW_API_KEY_HERE') {
    return { 
      content: '', 
      error: 'Chưa cấu hình Gemini API key. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env.local\n\nHướng dẫn: Vào https://aistudio.google.com/app/apikey để lấy key miễn phí.' 
    };
  }

  try {
    // Convert messages to Gemini format
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const prompt = systemMessage 
      ? `${systemMessage.content}\n\n${conversationHistory[conversationHistory.length - 1].parts[0].text}`
      : conversationHistory[conversationHistory.length - 1].parts[0].text;

    console.log('Calling Gemini API with key:', apiKey.substring(0, 10) + '...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const errorMessage = errorData.error?.message || 'Gemini API error';
      
      if (errorMessage.includes('API key not valid')) {
        throw new Error('API key không hợp lệ. Vui lòng tạo key mới tại: https://aistudio.google.com/app/apikey');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Gemini API Response:', data);
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!content) {
      throw new Error('Không nhận được phản hồi từ AI');
    }
    
    return { content };
  } catch (error: any) {
    console.error('Gemini Error:', error);
    return { 
      content: '', 
      error: error.message || 'Không thể kết nối với Gemini AI' 
    };
  }
}

// Main function to call AI based on provider
export async function getAIResponse(
  messages: Message[],
  provider?: 'openai' | 'gemini'
): Promise<AIResponse> {
  const selectedProvider = provider || import.meta.env.VITE_AI_PROVIDER || 'openai';
  
  if (selectedProvider === 'gemini') {
    return callGemini(messages);
  } else {
    return callOpenAI(messages);
  }
}

// Helper function to create system prompt
export function createSystemPrompt(scenarioPrompt: string): Message {
  return {
    role: 'system',
    content: scenarioPrompt,
  };
}

// Mock response for testing (when no API key is configured)
export function getMockResponse(userInput: string, scenarioId: string): string {
  const responses: Record<string, string[]> = {
    restaurant: [
      'かしこまりました。お席にご案内いたします。\n(Vâng ạ. Tôi sẽ dẫn quý khách đến chỗ ngồi.)',
      'お飲み物は何になさいますか？\n(Quý khách dùng đồ uống gì ạ?)',
      'お決まりになりましたら、お呼びください。\n(Khi nào quyết định xong, xin gọi tôi ạ.)',
    ],
    shopping: [
      'こちらはいかがでしょうか？\n(Cái này thì sao ạ?)',
      '試着室はあちらです。\n(Phòng thử đồ ở đằng kia ạ.)',
      'お会計は5000円になります。\n(Tổng cộng là 5000 yên ạ.)',
    ],
    hotel: [
      'お部屋は3階の305号室です。\n(Phòng của quý khách là số 305 tầng 3 ạ.)',
      '朝食は7時から9時までです。\n(Bữa sáng từ 7 giờ đến 9 giờ ạ.)',
      'チェックアウトは11時です。\n(Check-out lúc 11 giờ ạ.)',
    ],
    friend: [
      'そうなんだ！面白いね！\n(Thế à! Thú vị nhỉ!)',
      '今度一緒に行こうよ！\n(Lần sau cùng đi nhé!)',
      'また連絡するね！\n(Liên lạc lại sau nhé!)',
    ],
    interview: [
      'あなたの強みは何ですか？\n(Điểm mạnh của bạn là gì?)',
      'なぜ当社を選びましたか？\n(Tại sao bạn chọn công ty chúng tôi?)',
      'ご質問はありますか？\n(Bạn có câu hỏi nào không?)',
    ],
    doctor: [
      'いつからですか？\n(Từ khi nào vậy?)',
      '熱はありますか？\n(Bạn có sốt không?)',
      'お薬を出しておきますね。\n(Tôi sẽ kê đơn thuốc cho bạn nhé.)',
    ],
  };

  const scenarioResponses = responses[scenarioId] || [
    'はい、わかりました。\n(Vâng, tôi hiểu rồi.)',
  ];
  return scenarioResponses[Math.floor(Math.random() * scenarioResponses.length)];
}
