// AI Service for conversation
// Supports OpenAI GPT, Google Gemini, and DeepSeek

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

// DeepSeek AI Integration
async function callDeepSeek(messages: Message[]): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    return { 
      content: '', 
      error: 'Chưa cấu hình DeepSeek API key. Vui lòng thêm VITE_DEEPSEEK_API_KEY vào file .env.local\n\nHướng dẫn: Vào https://platform.deepseek.com/api_keys để lấy key miễn phí.' 
    };
  }

  try {
    console.log('Calling DeepSeek API with key:', apiKey.substring(0, 10) + '...');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const errorMessage = errorData.error?.message || 'DeepSeek API error';
      
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        throw new Error('API key không hợp lệ. Vui lòng tạo key mới tại: https://platform.deepseek.com/api_keys');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('DeepSeek API Response:', data);

    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      return {
        content: 'すみません、もう一度お願いします。\n(Xin lỗi, bạn có thể nói lại được không?)',
        error: undefined,
      };
    }

    return { content };
  } catch (error: any) {
    console.error('DeepSeek Error:', error);
    return { 
      content: '', 
      error: error.message || 'Không thể kết nối với DeepSeek AI' 
    };
  }
}

// Hugging Face Integration (Miễn phí)
async function callHuggingFace(messages: Message[]): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    return { 
      content: '', 
      error: 'Chưa cấu hình Hugging Face API key. Vui lòng thêm VITE_HUGGINGFACE_API_KEY vào file .env.local\n\nHướng dẫn: Vào https://huggingface.co/settings/tokens để lấy token miễn phí.' 
    };
  }

  try {
    // Sử dụng model miễn phí của Hugging Face
    const model = 'microsoft/DialoGPT-medium';
    
    // Lấy tin nhắn cuối cùng của user
    const userMessage = messages[messages.length - 1]?.content || '';
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: userMessage,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API Error:', errorText);
      
      // Fallback response
      return {
        content: 'こんにちは！\n(Xin chào!)',
        error: undefined,
      };
    }

    const data = await response.json();
    console.log('Hugging Face Response:', data);
    
    let content = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text.replace(userMessage, '').trim();
    }
    
    if (!content) {
      content = 'はい、そうですね。\n(Vâng, đúng vậy.)';
    }

    return { content };
  } catch (error: any) {
    console.error('Hugging Face Error:', error);
    return { 
      content: 'すみません、もう一度お願いします。\n(Xin lỗi, bạn có thể nói lại không?)',
      error: undefined
    };
  }
}

// Qwen API Integration (Alibaba Cloud)
async function callQwen(messages: Message[]): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY;
  
  if (!apiKey) {
    return { 
      content: '', 
      error: 'Chưa cấu hình Qwen API key. Vui lòng thêm VITE_QWEN_API_KEY vào file .env.local\n\nHướng dẫn: Vào https://dashscope.aliyun.com/ để lấy key miễn phí.' 
    };
  }

  try {
    console.log('Calling Qwen API with key:', apiKey.substring(0, 10) + '...');

    // Qwen sử dụng format khác với OpenAI
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-SSE': 'disable',
      },
      body: JSON.stringify({
        model: 'qwen-turbo', // Model miễn phí của Qwen
        input: {
          messages: messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : msg.role,
            content: msg.content
          }))
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.8,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const errorMessage = errorData.message || errorData.error?.message || 'Qwen API error';
      
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('authentication')) {
        throw new Error('API key không hợp lệ. Vui lòng tạo key mới tại: https://dashscope.aliyun.com/');
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new Error('Đã vượt quá hạn mức sử dụng. Vui lòng đợi hoặc nâng cấp tài khoản.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Qwen API Response:', data);

    // Parse Qwen response format
    const content = data.output?.text || data.output?.choices?.[0]?.message?.content || '';
    
    if (!content) {
      const finishReason = data.output?.finish_reason;
      const fallbackMessage = finishReason === 'content_filter'
        ? 'すみません、もう少し簡単な言葉で話してください。\n(Xin lỗi, hãy nói bằng từ ngữ đơn giản hơn.)'
        : 'こんにちは！どうぞよろしくお願いします。\n(Xin chào! Rất vui được gặp bạn.)';
      
      return {
        content: fallbackMessage,
        error: undefined,
      };
    }

    return { content };
  } catch (error: any) {
    console.error('Qwen Error:', error);
    return { 
      content: '', 
      error: error.message || 'Không thể kết nối với Qwen AI' 
    };
  }
}

// OpenRouter Integration (Truy cập nhiều AI models miễn phí)
async function callOpenRouter(messages: Message[]): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return { 
      content: '', 
      error: 'Chưa cấu hình OpenRouter API key. Vui lòng thêm VITE_OPENROUTER_API_KEY vào file .env.local\n\nHướng dẫn: Vào https://openrouter.ai/keys để lấy key miễn phí.' 
    };
  }

  try {
    console.log('Calling OpenRouter API with key:', apiKey.substring(0, 15) + '...');

    // Sử dụng model miễn phí của Qwen thông qua OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin, // Required by OpenRouter
        'X-Title': 'Japanese Learning App', // Optional: App name
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-coder-32b-instruct', // Model miễn phí tốt cho tiếng Nhật
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const errorMessage = errorData.error?.message || 'OpenRouter API error';
      
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('authentication')) {
        throw new Error('API key không hợp lệ. Vui lòng tạo key mới tại: https://openrouter.ai/keys');
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('credits')) {
        throw new Error('Đã vượt quá hạn mức sử dụng. Vui lòng đợi hoặc nạp thêm credits.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('OpenRouter API Response:', data);

    // Parse OpenRouter response (tương tự OpenAI format)
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      const finishReason = data.choices?.[0]?.finish_reason;
      const fallbackMessage = finishReason === 'content_filter'
        ? 'すみません、もう少し簡単な言葉で話してください。\n(Xin lỗi, hãy nói bằng từ ngữ đơn giản hơn.)'
        : 'こんにちは！どうぞよろしくお願いします。\n(Xin chào! Rất vui được gặp bạn.)';
      
      return {
        content: fallbackMessage,
        error: undefined,
      };
    }

    return { content };
  } catch (error: any) {
    console.error('OpenRouter Error:', error);
    return { 
      content: '', 
      error: error.message || 'Không thể kết nối với OpenRouter AI' 
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
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_ONLY_HIGH'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_ONLY_HIGH'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_ONLY_HIGH'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_ONLY_HIGH'
            }
          ],
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

    // Extract content in a more robust way to handle different Gemini response shapes
    let content = '';

    try {
      const candidate = Array.isArray(data.candidates) && data.candidates.length > 0
        ? data.candidates[0]
        : null;

      if (candidate) {
        if (candidate.content?.parts && Array.isArray(candidate.content.parts)) {
          // Standard generative-language response
          content = candidate.content.parts
            .map((p: any) => p.text || '')
            .join('\n')
            .trim();
        } else if (Array.isArray(candidate.parts)) {
          // Fallback shape: parts at top level
          content = candidate.parts
            .map((p: any) => p.text || '')
            .join('\n')
            .trim();
        } else if (typeof (candidate.output_text || candidate.text) === 'string') {
          // Some experimental APIs may return plain text fields
          content = (candidate.output_text || candidate.text).trim();
        }
      }
    } catch (parseError) {
      console.warn('Could not parse Gemini response content:', parseError);
    }

    // Nếu vẫn không lấy được content, kiểm tra lý do và xử lý
    if (!content) {
      const blockReason =
        data.promptFeedback?.blockReason ||
        data.candidates?.[0]?.finishReason ||
        '';

      console.log('Block reason:', blockReason);
      console.log('Prompt feedback:', data.promptFeedback);

      // Nếu bị chặn do safety, đưa ra gợi ý cụ thể
      if (blockReason === 'SAFETY' || data.promptFeedback?.blockReason) {
        return {
          content: '申し訳ございません。もう一度、簡単な言葉で話してください。\n(Xin lỗi. Hãy thử nói lại bằng từ ngữ đơn giản hơn.)',
          error: undefined,
        };
      }

      const fallbackMessage = 'すみません、もう一度お願いします。\n(Xin lỗi, bạn có thể nói lại được không?)';

      return {
        content: fallbackMessage,
        error: undefined,
      };
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
  provider?: 'openai' | 'gemini' | 'deepseek' | 'huggingface' | 'qwen' | 'openrouter'
): Promise<AIResponse> {
  const selectedProvider = provider || import.meta.env.VITE_AI_PROVIDER || 'openrouter';
  
  // Thử provider được chọn trước
  let response: AIResponse;
  
  if (selectedProvider === 'openrouter') {
    response = await callOpenRouter(messages);
    // Nếu OpenRouter lỗi, fallback sang Gemini
    if (response.error) {
      console.log('OpenRouter gặp lỗi, chuyển sang Gemini...', response.error);
      response = await callGemini(messages);
    }
  } else if (selectedProvider === 'qwen') {
    response = await callQwen(messages);
    // Nếu Qwen lỗi, fallback sang Gemini
    if (response.error) {
      console.log('Qwen gặp lỗi, chuyển sang Gemini...', response.error);
      response = await callGemini(messages);
    }
  } else if (selectedProvider === 'deepseek') {
    response = await callDeepSeek(messages);
    // Nếu DeepSeek lỗi, fallback sang Gemini
    if (response.error && response.error.includes('Insufficient Balance')) {
      console.log('DeepSeek hết credit, chuyển sang Gemini...');
      response = await callGemini(messages);
    }
  } else if (selectedProvider === 'huggingface') {
    response = await callHuggingFace(messages);
  } else if (selectedProvider === 'gemini') {
    response = await callGemini(messages);
  } else {
    response = await callOpenAI(messages);
  }
  
  return response;
}

// Helper function to create system prompt
export function createSystemPrompt(scenarioPrompt: string): Message {
  // Cải thiện prompt để tránh bị safety filter chặn
  const improvedPrompt = `${scenarioPrompt}

Quy tắc quan trọng:
- Chỉ trả lời 1-2 câu ngắn gọn
- Sử dụng ngôn ngữ lịch sự, thân thiện
- Tập trung vào giao tiếp hàng ngày
- Tránh nội dung nhạy cảm hoặc gây tranh cãi`;

  return {
    role: 'system',
    content: improvedPrompt,
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
