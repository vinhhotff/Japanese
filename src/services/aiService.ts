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

    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      return {
        content: '',
        error: 'DeepSeek trả về nội dung trống',
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
    // Dùng Qwen - model tốt cho tiếng Nhật
    const model = 'Qwen/Qwen2.5-Coder-32B-Instruct';

    // Build conversation prompt
    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');

    let prompt = '';
    if (systemMsg) {
      prompt = `${systemMsg.content}\n\n`;
    }

    conversationMsgs.forEach(msg => {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else {
        prompt += `Assistant: ${msg.content}\n`;
      }
    });
    prompt += 'Assistant:';

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API Error:', errorText);

      return {
        content: '',
        error: `Hugging Face API lỗi: ${response.status}`,
      };
    }

    const data = await response.json();

    let content = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text.trim();
    } else if (data.generated_text) {
      content = data.generated_text.trim();
    }

    if (!content) {
      return {
        content: '',
        error: 'Hugging Face trả về nội dung trống',
      };
    }

    return { content };
  } catch (error: any) {
    console.error('Hugging Face Error:', error);
    return {
      content: '',
      error: error.message || 'Không thể kết nối Hugging Face',
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

    // Parse Qwen response format
    const content = data.output?.text || data.output?.choices?.[0]?.message?.content || '';

    if (!content) {
      const finishReason = data.output?.finish_reason;
      return {
        content: '',
        error:
          finishReason === 'content_filter'
            ? 'Qwen chặn nội dung (content filter). Hãy thử câu khác.'
            : 'Qwen trả về nội dung trống',
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
async function callOpenRouter(messages: Message[], imageData?: string): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      content: '',
      error: 'Chưa cấu hình OpenRouter API key. Vui lòng thêm VITE_OPENROUTER_API_KEY vào file .env.local\n\nHướng dẫn: Vào https://openrouter.ai/keys để lấy key miễn phí.'
    };
  }

  try {

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
        model: imageData
          ? 'qwen/qwen-2.5-vl-7b-instruct:free'
          : 'qwen/qwen-2.5-7b-instruct',
        messages: [
          // Luôn giữ tin nhắn System đầu tiên (chứa hướng dẫn quan trọng)
          messages.find(m => m.role === 'system') || { role: 'system', content: 'You are a helpful assistant.' },
          // Chỉ lấy tối đa 10 tin nhắn hội thoại gần nhất (trừ system)
          ...messages.filter(m => m.role !== 'system').slice(-10)
        ].map((msg, index, array) => {
          // Chỉ thêm hình ảnh vào tin nhắn cuối cùng của người dùng
          if (imageData && index === array.length - 1 && msg.role === 'user') {
            return {
              role: 'user',
              content: [
                { type: 'text', text: msg.content },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`
                  }
                }
              ]
            };
          }
          return msg;
        }),
        temperature: 0.7,
        max_tokens: 800, // Tăng lên chút để đảm bảo không bị cắt ngang khi có giải thích dài
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

    // Parse OpenRouter response (tương tự OpenAI format)
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      const finishReason = data.choices?.[0]?.finish_reason;
      return {
        content: '',
        error:
          finishReason === 'content_filter'
            ? 'OpenRouter chặn nội dung (content filter).'
            : 'OpenRouter trả về nội dung trống',
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

// Cloudflare Workers AI Integration (Miễn phí)
async function callCloudflare(messages: Message[]): Promise<AIResponse> {
  // Ưu tiên dùng Worker proxy (không bị CORS)
  const workerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;

  if (workerUrl) {
    // Gọi qua Worker proxy - Không cần API token, không bị CORS
    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Worker error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.result?.response || data.result?.content || '';

      if (!content) {
        return {
          content: '',
          error: 'Cloudflare Worker trả về nội dung trống',
        };
      }

      return { content };
    } catch (error: any) {
      console.error('Cloudflare Worker Error:', error);
      return {
        content: '',
        error: error.message || 'Không thể kết nối với Cloudflare Worker'
      };
    }
  }

  // Fallback: Gọi trực tiếp API (có thể bị CORS ở localhost)
  const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return {
      content: '',
      error: 'Chưa cấu hình Cloudflare Workers AI.\n\nCách 1 (Khuyến nghị): Deploy Worker proxy\n- Xem hướng dẫn: cloudflare-worker/README.md\n- Thêm VITE_CLOUDFLARE_WORKER_URL vào .env.local\n\nCách 2: Dùng trực tiếp API (có thể bị CORS)\n- Thêm VITE_CLOUDFLARE_ACCOUNT_ID và VITE_CLOUDFLARE_API_TOKEN'
    };
  }

  try {
    // Sử dụng model miễn phí của Cloudflare (Llama 3.1 hoặc Qwen)
    const model = '@cf/meta/llama-3.1-8b-instruct'; // Hoặc '@cf/qwen/qwen1.5-14b-chat'

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
            content: m.content
          })),
          stream: false,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare Workers AI Error Response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const errorMessage = errorData.errors?.[0]?.message || errorData.error?.message || 'Cloudflare Workers AI error';

      if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
        throw new Error('API token không hợp lệ. Vui lòng kiểm tra lại VITE_CLOUDFLARE_API_TOKEN');
      }

      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new Error('Đã vượt quá hạn mức sử dụng. Vui lòng đợi hoặc nâng cấp tài khoản.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Parse Cloudflare Workers AI response
    const content = data.result?.response || data.result?.content || '';

    if (!content) {
      return {
        content: '',
        error: 'Cloudflare AI trả về nội dung trống',
      };
    }

    return { content };
  } catch (error: any) {
    console.error('Cloudflare Workers AI Error:', error);
    return {
      content: '',
      error: error.message || 'Không thể kết nối với Cloudflare Workers AI'
    };
  }
}

// Google Gemini Integration
async function callGemini(messages: Message[], imageData?: string): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_NEW_API_KEY_HERE') {
    return {
      content: '',
      error: 'Chưa cấu hình Gemini API key. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env.local'
    };
  }

  try {
    const systemMessage = messages.find(m => m.role === 'system');
    const rest = messages.filter(m => m.role !== 'system');

    const contents: Array<{ role: string; parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> }> = [];
    for (let i = 0; i < rest.length; i++) {
      const m = rest[i];
      const geminiRole = m.role === 'assistant' ? 'model' : 'user';

      if (contents.length === 0 && geminiRole === 'model') {
        contents.push({ role: 'user', parts: [{ text: '（会話開始）' }] });
      }

      const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
      const isLastUser = i === rest.length - 1 && m.role === 'user';
      if (imageData && isLastUser) {
        const raw = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        parts.push({
          inline_data: {
            mime_type: 'image/png',
            data: raw,
          },
        });
      }
      parts.push({ text: m.content });
      contents.push({ role: geminiRole, parts });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
          },
          systemInstruction: systemMessage ? {
            parts: [{ text: systemMessage.content }]
          } : undefined
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

    if (!content) {
      const blockReason =
        data.promptFeedback?.blockReason ||
        data.candidates?.[0]?.finishReason ||
        '';

      if (blockReason === 'SAFETY' || data.promptFeedback?.blockReason) {
        return {
          content: '',
          error: 'Gemini chặn nội dung (an toàn). Hãy thử câu chữ khác.',
        };
      }

      return {
        content: '',
        error: 'Gemini trả về nội dung trống hoặc không đọc được.',
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
// Evaluate exercise performance using AI
export async function evaluateExercise(
  type: 'pronunciation' | 'writing',
  expected: string,
  actual: string,
  language: 'japanese' | 'chinese' = 'japanese',
  imageData?: string
): Promise<{ score: number; feedback: string; tips: string }> {
  const systemPrompt = `You are a professional ${language === 'chinese' ? 'Chinese' : 'Japanese'} teacher. 
Evaluate the student's performance.
Type: ${type}
Expected character/word: ${expected}
${type === 'writing' ? 'The user has drawn the character on a canvas (see image).' : `The student said: ${actual}`}

Return JSON format ONLY:
{
  "score": (0-100),
  "feedback": "Concise feedback in Vietnamese about accuracy",
  "tips": "Brief advice in Vietnamese to improve"
}`;

  const response = await getAIResponse(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Evaluate the provided input.' }],
    language,
    'gemini',
    imageData
  );

  if (response.error) {
    return { score: 0, feedback: 'Không thể kết nối với AI để đánh giá.', tips: '' };
  }

  try {
    const jsonStr = response.content.match(/\{[\s\S]*\}/)?.[0] || response.content;
    const result = JSON.parse(jsonStr);
    return {
      score: result.score || 0,
      feedback: result.feedback || 'Không có nhận xét.',
      tips: result.tips || ''
    };
  } catch (e) {
    console.error('Error parsing AI evaluation:', e);
    return { score: 70, feedback: response.content, tips: '' };
  }
}

type AIProviderId =
  | 'gemini'
  | 'openrouter'
  | 'openai'
  | 'deepseek'
  | 'cloudflare'
  | 'qwen'
  | 'huggingface';

function providerHasCredentials(p: AIProviderId): boolean {
  switch (p) {
    case 'gemini': {
      const k = import.meta.env.VITE_GEMINI_API_KEY;
      return !!k && k !== 'YOUR_NEW_API_KEY_HERE';
    }
    case 'openrouter':
      return !!import.meta.env.VITE_OPENROUTER_API_KEY;
    case 'openai':
      return !!import.meta.env.VITE_OPENAI_API_KEY;
    case 'deepseek':
      return !!import.meta.env.VITE_DEEPSEEK_API_KEY;
    case 'cloudflare':
      return !!(
        import.meta.env.VITE_CLOUDFLARE_WORKER_URL ||
        (import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID && import.meta.env.VITE_CLOUDFLARE_API_TOKEN)
      );
    case 'qwen':
      return !!import.meta.env.VITE_QWEN_API_KEY;
    case 'huggingface':
      return !!import.meta.env.VITE_HUGGINGFACE_API_KEY;
    default:
      return false;
  }
}

function normalizeProviderId(raw: string | undefined): AIProviderId {
  const allowed: AIProviderId[] = [
    'gemini',
    'openrouter',
    'openai',
    'deepseek',
    'cloudflare',
    'qwen',
    'huggingface',
  ];
  if (raw && allowed.includes(raw as AIProviderId)) return raw as AIProviderId;
  return 'cloudflare';
}

function buildProviderChain(primary: AIProviderId): AIProviderId[] {
  const preference: AIProviderId[] = [
    'gemini',
    'openrouter',
    'openai',
    'deepseek',
    'cloudflare',
    'qwen',
    'huggingface',
  ];
  const withKeys = preference.filter(providerHasCredentials);
  if (withKeys.length === 0) return [];

  if (providerHasCredentials(primary)) {
    return [primary, ...withKeys.filter((p) => p !== primary)];
  }
  return withKeys;
}

async function invokeProvider(
  p: AIProviderId,
  messages: Message[],
  imageData?: string
): Promise<AIResponse> {
  switch (p) {
    case 'gemini':
      return callGemini(messages, imageData);
    case 'openrouter':
      return callOpenRouter(messages, imageData);
    case 'openai':
      return callOpenAI(messages);
    case 'deepseek':
      return callDeepSeek(messages);
    case 'cloudflare':
      return callCloudflare(messages);
    case 'qwen':
      return callQwen(messages);
    case 'huggingface':
      return callHuggingFace(messages);
    default:
      return { content: '', error: 'Unknown provider' };
  }
}

/** Tin nhắn hiển thị khi không lấy được phản hồi AI thật (không dùng câu mẫu lặp lại). */
export function buildRoleplayConnectionErrorContent(
  language: 'japanese' | 'chinese' | undefined,
  detail?: string
): string {
  const short = (detail || '').replace(/\s+/g, ' ').trim().slice(0, 280);
  const hint = short ? short : 'Kiểm tra API key / mạng và thử lại.';
  if (language === 'chinese') {
    return `[ZH] （系统）暂时无法连接 AI，请稍后再试或检查设置。\n[VI] ${hint}\n[OP]\n1. 好的 (好的)\n2. 稍后再试 (Thử lại sau)\n3. 谢谢 (Cảm ơn)`;
  }
  return `[JP] （システム）AIに接続できません。設定とネットワークを確認して、もう一度お試しください。\n[VI] ${hint}\n[OP]\n1. はい (Vâng)\n2. また後で (Thử lại sau)\n3. ありがとうございます (Cảm ơn)`;
}

export async function getAIResponse(
  messages: Message[],
  language?: 'japanese' | 'chinese',
  provider?: 'openai' | 'gemini' | 'deepseek' | 'huggingface' | 'qwen' | 'openrouter' | 'cloudflare',
  imageData?: string
): Promise<AIResponse> {
  const envProvider = normalizeProviderId(import.meta.env.VITE_AI_PROVIDER);
  const primary = provider ? normalizeProviderId(provider) : envProvider;
  const chain = buildProviderChain(primary);

  if (chain.length === 0) {
    return {
      content: '',
      error:
        'Chưa cấu hình API key nào. Thêm VITE_GEMINI_API_KEY hoặc VITE_OPENROUTER_API_KEY (v.v.) vào .env.local',
    };
  }

  let lastError = '';
  for (const p of chain) {
    const r = await invokeProvider(p, messages, imageData);
    if (!r.error && r.content?.trim()) {
      return r;
    }
    lastError = r.error || 'Phản hồi trống';
    console.warn(`[AI] Provider ${p} failed:`, lastError);
  }

  return {
    content: '',
    error: lastError || 'Tất cả provider AI đều không phản hồi',
  };
}

// Helper function to create system prompt
export function createSystemPrompt(
  scenarioPrompt: string,
  language?: 'japanese' | 'chinese',
  conversationSummary?: string
): Message {
  const isChinese = language === 'chinese';
  const tag = isChinese ? 'ZH' : 'JP';
  const langName = isChinese ? 'Tiếng Trung' : 'Tiếng Nhật';

  const improvedPrompt = `${scenarioPrompt}

${conversationSummary ? `[CONTEXT HIỆN TẠI]\n${conversationSummary}\n` : ''}

═══════════════════════════════════════════════════════════
⚠️ QUY TẮC BẮT BUỘC - ĐỌC KỸ VÀ TUÂN THỦ 100% ⚠️
═══════════════════════════════════════════════════════════

1️⃣ **TUYỆT ĐỐI KHÔNG LẶP LẠI CÂU CỦA NGƯỜI DÙNG**
   - Chỉ trả lời theo vai diễn của bạn
   - KHÔNG bao giờ copy hoặc nhắc lại những gì người dùng vừa nói
   
2️⃣ **LUÔN TRẢ LỜI BẰNG ${langName.toUpperCase()}**
   - Ngôn ngữ chính: ${langName} (tag [${tag}])
   - KHÔNG ĐƯỢC dùng ngôn ngữ khác (${isChinese ? 'KHÔNG dùng tiếng Nhật' : 'KHÔNG dùng tiếng Trung'})
   
3️⃣ **LUÔN CÓ BẢN DỊCH TIẾNG VIỆT**
   - SAU MỖI câu ${langName} phải có dịch trong tag [VI]
   - Nếu thiếu [VI] = SAI FORMAT

4️⃣ **GỢI Ý [OP] PHẢI LÀ CÂU TRẢ LỜI CHO NGƯỜI DÙNG (KHÁCH HÀNG)**
   - [OP] là 3 gợi ý để **NGƯỜI DÙNG** có thể nói tiếp
   - Bạn đang đóng vai nhân viên → [OP] phải là câu của KHÁCH HÀNG
   - KHÔNG được gợi ý câu của nhân viên trong [OP]
   - Mỗi gợi ý: số thứ tự + câu ${langName} + (dịch tiếng Việt)

═══════════════════════════════════════════════════════════
📋 ĐỊNH DẠNG OUTPUT - BẮT BUỘC THEO ĐÚNG
═══════════════════════════════════════════════════════════

[${tag}] <Câu trả lời của bạn (VAI NHÂN VIÊN) bằng ${langName}>
[VI] <Dịch tiếng Việt của câu trên>
[OP] (GỢI Ý CHO NGƯỜI DÙNG = KHÁCH HÀNG)
1. <Câu mà KHÁCH HÀNG có thể nói> (Dịch tiếng Việt)
2. <Câu mà KHÁCH HÀNG có thể nói> (Dịch tiếng Việt)
3. <Câu mà KHÁCH HÀNG có thể nói> (Dịch tiếng Việt)

═══════════════════════════════════════════════════════════
✅ VÍ DỤ ĐÚNG (HỌC THEO NÀY)
═══════════════════════════════════════════════════════════

${isChinese ? `
📌 Ví dụ 1 - Nhà hàng:
Người dùng: "我想吃面条"
✅ BẠN TRẢ LỜI:
[ZH] 好的，您想要什么口味的面条？我们有牛肉面和鸡肉面。
[VI] Vâng, bạn muốn mì vị gì? Chúng tôi có mì bò và mì gà.
[OP]
1. 牛肉面 (Mì bò)
2. 鸡肉面 (Mì gà)
3. 有辣的吗？ (Có cay không?)

📌 Ví dụ 2 - Mua sắm:
Người dùng: "这个多少钱？"
✅ BẠN TRẢ LỜI:
[ZH] 这个是两百块。您需要试一下吗？
[VI] Cái này hai trăm tệ. Bạn cần thử không?
[OP]
1. 可以便宜一点吗？ (Có thể rẻ hơn không?)
2. 我要这个 (Tôi lấy cái này)
3. 有别的颜色吗？ (Có màu khác không?)
` : `
📌 Ví dụ 1 - Nhà hàng:
Người dùng: "ラーメンを食べたいです"
✅ BẠN TRẢ LỜI:
[JP] かしこまりました。豚骨ラーメンと醤油ラーメンがございます。
[VI] Vâng ạ. Chúng tôi có ramen tonkotsu và ramen shouyu.
[OP]
1. 豚骨ラーメンをください (Cho tôi ramen tonkotsu)
2. 醤油ラーメンをお願いします (Cho tôi ramen shouyu)
3. おすすめは何ですか？ (Món nào được đề xuất?)

📌 Ví dụ 2 - Mua sắm:
Người dùng: "これはいくらですか？"
✅ BẠN TRẢ LỜI:
[JP] こちらは三千円になります。試着されますか？
[VI] Cái này 3000 yên ạ. Bạn có muốn thử không?
[OP]
1. 試着してもいいですか？ (Tôi thử được không?)
2. これをください (Lấy cái này cho tôi)
3. 他の色はありますか？ (Có màu khác không?)
`}

═══════════════════════════════════════════════════════════
❌ LỖI THƯỜNG GẶP - TRÁNH HOÀN TOÀN
═══════════════════════════════════════════════════════════

❌ SAI 1: Lặp lại câu người dùng
❌ SAI 2: Thiếu tag [VI] hoặc [OP]
❌ SAI 3: Dùng ${isChinese ? 'tiếng Nhật' : 'tiếng Trung'} thay vì ${langName}
❌ SAI 4: Chỉ có 1-2 gợi ý thay vì 3
❌ SAI 5: Response quá dài, lan man
❌ SAI 6: [OP] chứa câu của NHÂN VIÊN thay vì câu của KHÁCH HÀNG
   → VD SAI: "您要点什么?" (Quý khách muốn gọi gì?) ← Đây là câu nhân viên!
   → VD ĐÚNG: "我要这个" (Tôi lấy cái này) ← Đây là câu khách hàng!

═══════════════════════════════════════════════════════════

Bây giờ hãy đóng vai và trả lời theo FORMAT trên. Nhớ: NGẮN GỌN, TỰ NHIÊN, ĐÚNG FORMAT!`;

  return {
    role: 'system',
    content: improvedPrompt,
  };
}

// Format and validate AI response - fix if missing parts
export function formatAIResponse(content: string, language?: 'japanese' | 'chinese'): string {
  const isChinese = language === 'chinese';
  const tag = isChinese ? 'ZH' : 'JP';

  // Remove any thinking tags
  let cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think[\s\S]*?>/gi, '')
    .replace(/<\/think>/gi, '')
    .trim();

  // Check if response has proper format
  const hasMainTag = cleaned.includes(`[${tag}]`);
  const hasOP = cleaned.includes('[OP]');

  // If completely wrong format, return fallback
  if (!hasMainTag && !hasOP) {
    return isChinese
      ? `[ZH] ${cleaned}\n[OP]\n1. 好的\n2. 谢谢\n3. 请继续`
      : `[JP] ${cleaned}\n[OP]\n1. はい\n2. ありがとうございます\n3. 続けてください`;
  }

  // Check if wrong language tag
  if (!hasMainTag) {
    const wrongTag = isChinese ? '[JP]' : '[ZH]';
    if (cleaned.includes(wrongTag)) {
      return isChinese
        ? `[ZH] 对不起，请再说一遍。\n[OP]\n1. 好的\n2. 没问题\n3. 请继续`
        : `[JP] すみません、もう一度お願いします。\n[OP]\n1. はい\n2. わかりました\n3. 続けてください`;
    }
    cleaned = `[${tag}] ${cleaned}`;
  }

  // Remove any [VI] sections the AI might still add (ignore them)
  cleaned = cleaned.replace(/\[VI\][\s\S]*?(?=\[OP\]|\[FIX\]|$)/g, '').trim();

  // Ensure [OP] section exists
  if (!hasOP) {
    const defaultOptions = isChinese
      ? '\n[OP]\n1. 好的\n2. 谢谢\n3. 请继续'
      : '\n[OP]\n1. はい\n2. ありがとうございます\n3. 続けてください';
    cleaned += defaultOptions;
  }

  return cleaned;
}

// Create conversation summary to help AI remember context
export function createConversationSummary(
  messages: Array<{ role: string; content: string }>,
  scenarioTitle: string,
  language?: 'japanese' | 'chinese'
): string {
  if (messages.length < 2) return '';

  const langName = language === 'chinese' ? 'Tiếng Trung' : 'Tiếng Nhật';
  const totalMsgs = messages.length;

  // Get last 3-4 key points from conversation
  const recentMessages = messages.slice(-6);
  const keyPoints: string[] = [];

  for (const msg of recentMessages) {
    if (msg.role === 'user' && msg.content.length > 5) {
      // Shorten long messages
      const short = msg.content.length > 50
        ? msg.content.substring(0, 50) + '...'
        : msg.content;
      keyPoints.push(`- User: "${short}"`);
    }
  }

  return `📍 Tình huống: ${scenarioTitle}
📍 Ngôn ngữ: ${langName} (CHỈ dùng ngôn ngữ này)
📍 Đã trao đổi: ${totalMsgs} tin nhắn
📍 Nội dung gần đây:
${keyPoints.slice(-3).join('\n')}`;
}

