/**
 * ============================================
 * CẤU HÌNH GIỌNG NÓI - CHỈNH Ở ĐÂY
 * ============================================
 * 
 * File này chứa tất cả cấu hình về giọng nói.
 * Để chỉnh giọng nói, hãy sửa các giá trị trong DEFAULT_SPEECH_CONFIG bên dưới.
 * 
 * CÁCH CHỈNH:
 * 1. Mở file: src/utils/speech.ts
 * 2. Tìm dòng: const DEFAULT_SPEECH_CONFIG
 * 3. Thay đổi các giá trị:
 *    - rate: Tốc độ nói (0.5 = rất chậm, 1.0 = bình thường, 2.0 = rất nhanh)
 *    - pitch: Cao độ giọng (0.5 = trầm, 1.0 = bình thường, 2.0 = cao)
 *    - volume: Âm lượng (0.0 = im lặng, 1.0 = to nhất)
 *    - voiceName: Tên giọng cụ thể (xem danh sách bằng cách chạy getAvailableVoices())
 * 
 * VÍ DỤ:
 * - Giọng chậm và rõ: rate: 0.7, pitch: 1.0, volume: 1.0
 * - Giọng nữ cao: rate: 0.8, pitch: 1.3, volume: 1.0
 * - Giọng nam trầm: rate: 0.8, pitch: 0.8, volume: 1.0
 * 
 * ============================================
 */

// Text-to-Speech utilities

// Cấu hình giọng nói - BẠN CÓ THỂ CHỈNH Ở ĐÂY
export interface SpeechConfig {
  lang: string;        // Ngôn ngữ: 'ja-JP' (tiếng Nhật)
  rate: number;         // Tốc độ: 0.1 - 10 (0.7 = chậm, 1.0 = bình thường, 1.3 = nhanh)
  pitch: number;       // Cao độ: 0 - 2 (0.5 = thấp, 1.0 = bình thường, 1.5 = cao)
  volume: number;      // Âm lượng: 0 - 1 (0.5 = nhỏ, 1.0 = to nhất)
  voiceName?: string;  // Tên giọng cụ thể (để trống = tự động chọn)
}

// ============================================
// ⚙️ CẤU HÌNH GIỌNG NÓI - CHỈNH Ở ĐÂY ⚙️
// ============================================
// 
// Cấu hình riêng cho từng ngôn ngữ:
//
const JAPANESE_SPEECH_CONFIG: SpeechConfig = {
  lang: 'ja-JP',
  rate: 0.8,               // Tốc độ vừa phải, tự nhiên hơn
  pitch: 1.0,              // Giọng tự nhiên
  volume: 1.0,
  voiceName: undefined
};

const CHINESE_SPEECH_CONFIG: SpeechConfig = {
  lang: 'zh-CN',           // Tiếng Trung Phổ thông (Mandarin)
  rate: 0.75,              // Chậm vừa để nghe rõ thanh điệu
  pitch: 1.0,              // Giọng tự nhiên
  volume: 1.0,
  voiceName: undefined
};

// Default config (Japanese)
const DEFAULT_SPEECH_CONFIG: SpeechConfig = JAPANESE_SPEECH_CONFIG;

// Lấy danh sách giọng có sẵn
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if ('speechSynthesis' in window) {
    return window.speechSynthesis.getVoices();
  }
  return [];
};

// Lấy giọng tiếng Nhật tốt nhất
const getBestJapaneseVoice = (): SpeechSynthesisVoice | null => {
  const voices = getAvailableVoices();
  
  // Ưu tiên 1: Kyoko (giọng nữ macOS - rất tự nhiên)
  const kyoko = voices.find(v => 
    v.name.toLowerCase().includes('kyoko')
  );
  if (kyoko) return kyoko;
  
  // Ưu tiên 2: Google Japanese (rõ ràng)
  const googleJapanese = voices.find(v => 
    v.lang.startsWith('ja') && v.name.toLowerCase().includes('google')
  );
  if (googleJapanese) return googleJapanese;
  
  // Ưu tiên 3: Giọng nữ tiếng Nhật
  const femaleJapanese = voices.find(v => 
    v.lang.startsWith('ja') && (
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('woman')
    )
  );
  if (femaleJapanese) return femaleJapanese;
  
  // Ưu tiên 4: Giọng tiếng Nhật bất kỳ
  const japaneseVoice = voices.find(v => v.lang.startsWith('ja'));
  if (japaneseVoice) return japaneseVoice;
  
  return null;
};

// Lấy giọng tiếng Trung tốt nhất
const getBestChineseVoice = (): SpeechSynthesisVoice | null => {
  const voices = getAvailableVoices();
  
  // Ưu tiên 1: Ting-Ting (giọng nữ macOS - rất tự nhiên)
  const tingting = voices.find(v => 
    v.name.toLowerCase().includes('ting-ting')
  );
  if (tingting) return tingting;
  
  // Ưu tiên 2: Google Chinese voices
  const googleChinese = voices.find(v => 
    v.lang.startsWith('zh') && v.name.toLowerCase().includes('google')
  );
  if (googleChinese) return googleChinese;
  
  // Ưu tiên 3: Giọng nữ tiếng Trung
  const femaleChinese = voices.find(v => 
    v.lang.startsWith('zh') && (
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('woman')
    )
  );
  if (femaleChinese) return femaleChinese;
  
  // Ưu tiên 4: Giọng tiếng Trung Mandarin (zh-CN)
  const mandarinVoice = voices.find(v => v.lang === 'zh-CN');
  if (mandarinVoice) return mandarinVoice;
  
  // Ưu tiên 5: Giọng tiếng Trung bất kỳ
  const chineseVoice = voices.find(v => v.lang.startsWith('zh'));
  if (chineseVoice) return chineseVoice;
  
  return null;
};

export const speakText = (
  text: string, 
  config: Partial<SpeechConfig> = {}
) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Auto-detect language from text if not specified
    let baseConfig = DEFAULT_SPEECH_CONFIG;
    
    // If language is specified in config, use appropriate config
    if (config.lang) {
      if (config.lang.startsWith('zh')) {
        baseConfig = CHINESE_SPEECH_CONFIG;
      } else if (config.lang.startsWith('ja')) {
        baseConfig = JAPANESE_SPEECH_CONFIG;
      }
    } else {
      // Auto-detect from text content
      const hasChineseChars = /[\u4e00-\u9fff]/.test(text);
      const hasJapaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
      
      if (hasChineseChars && !hasJapaneseChars) {
        baseConfig = CHINESE_SPEECH_CONFIG;
      } else if (hasJapaneseChars) {
        baseConfig = JAPANESE_SPEECH_CONFIG;
      }
    }

    // Kết hợp cấu hình base với cấu hình tùy chỉnh
    const finalConfig: SpeechConfig = {
      ...baseConfig,
      ...config
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = finalConfig.lang;
    utterance.rate = finalConfig.rate;
    utterance.pitch = finalConfig.pitch;
    utterance.volume = finalConfig.volume;

    // Chọn giọng nếu có
    if (finalConfig.voiceName) {
      const voices = getAvailableVoices();
      const selectedVoice = voices.find(v => v.name === finalConfig.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Tự động chọn giọng tốt nhất dựa trên ngôn ngữ
      let bestVoice: SpeechSynthesisVoice | null = null;
      
      if (finalConfig.lang.startsWith('zh')) {
        // Tiếng Trung
        bestVoice = getBestChineseVoice();
      } else if (finalConfig.lang.startsWith('ja')) {
        // Tiếng Nhật
        bestVoice = getBestJapaneseVoice();
      }
      
      if (bestVoice) {
        utterance.voice = bestVoice;
      } else {
        console.warn('No suitable voice found for language:', finalConfig.lang);
        
        // Fallback: Thử sử dụng giọng mặc định của hệ thống
        const allVoices = getAvailableVoices();
        if (allVoices.length > 0) {
          utterance.voice = allVoices[0];
        }
      }
    }

    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        // Không reject để tránh crash app, chỉ log lỗi
        resolve(); // Resolve thay vì reject
      };
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Failed to speak:', error);
        resolve(); // Resolve thay vì reject
      }
    });
  } else {
    return Promise.reject(new Error('Speech synthesis not supported'));
  }
};

// Hàm tiện ích để chỉnh giọng dễ dàng hơn
export const speakTextWithSettings = (
  text: string,
  options: {
    slow?: boolean;      // true = chậm hơn (0.7), false = bình thường (0.8)
    highPitch?: boolean; // true = giọng cao (1.2), false = bình thường (1.0)
    loud?: boolean;      // true = to hơn (1.0), false = bình thường (0.9)
  } = {}
) => {
  const config: Partial<SpeechConfig> = {
    rate: options.slow ? 0.7 : 0.8,
    pitch: options.highPitch ? 1.2 : 1.0,
    volume: options.loud ? 1.0 : 0.9,
  };
  return speakText(text, config);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// Debug function để kiểm tra voices có sẵn
export const logAvailableVoices = () => {
  if ('speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    console.log('=== Available Voices ===');
    voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
    });
    
    const japaneseVoices = voices.filter(v => v.lang.startsWith('ja'));
    console.log('=== Japanese Voices ===');
    if (japaneseVoices.length > 0) {
      japaneseVoices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.lang})`);
      });
    } else {
      console.log('No Japanese voices found');
    }
  } else {
    console.log('Speech synthesis not supported');
  }
};

// Function để thử phát âm với fallback
export const speakTextSafely = async (text: string, config: Partial<SpeechConfig> = {}) => {
  try {
    await speakText(text, config);
  } catch (error) {
    console.warn('Speech failed, continuing silently:', error);
    // Không throw error để tránh crash app
  }
};

// Speech Recognition utilities
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

export const startSpeechRecognition = (
  lang: string = 'ja-JP',
  onResult: (result: SpeechRecognitionResult) => void,
  onError?: (error: string) => void,
  onEnd?: () => void
): (() => void) => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const result = event.results[0];
    onResult({
      transcript: result[0].transcript,
      confidence: result[0].confidence
    });
  };

  recognition.onerror = (event: any) => {
    let errorMessage = 'Có lỗi xảy ra khi nhận diện giọng nói';
    if (event.error === 'no-speech') {
      errorMessage = 'Không phát hiện giọng nói';
    } else if (event.error === 'audio-capture') {
      errorMessage = 'Không thể truy cập microphone';
    } else if (event.error === 'not-allowed') {
      errorMessage = 'Quyền truy cập microphone bị từ chối';
    }
    onError?.(errorMessage);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.start();

  return () => {
    recognition.stop();
  };
};

export const isSpeechRecognitionSupported = () => {
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
};

// Compare two Japanese texts (simple comparison)
export const compareJapaneseText = (text1: string, text2: string): {
  match: boolean;
  similarity: number;
  differences: string[];
} => {
  // Remove punctuation, spaces and normalize
  const normalize = (text: string) => text.replace(/[。、？！\s]/g, '').trim();
  
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);
  
  // Exact match
  if (normalized1 === normalized2) {
    return { match: true, similarity: 100, differences: [] };
  }
  
  // Check if texts are similar (case-insensitive for romaji)
  const lower1 = normalized1.toLowerCase();
  const lower2 = normalized2.toLowerCase();
  
  if (lower1 === lower2) {
    return { match: true, similarity: 95, differences: [] };
  }
  
  // Calculate similarity using Levenshtein-like algorithm
  // For Japanese, we compare character by character
  const len1 = normalized1.length;
  const len2 = normalized2.length;
  
  if (len1 === 0 && len2 === 0) {
    return { match: true, similarity: 100, differences: [] };
  }
  
  if (len1 === 0 || len2 === 0) {
    return { 
      match: false, 
      similarity: 0, 
      differences: [`Kỳ vọng: ${text1}`, `Bạn nói: ${text2}`] 
    };
  }
  
  // Calculate character matches
  let matches = 0;
  const minLength = Math.min(len1, len2);
  const maxLength = Math.max(len1, len2);
  
  // Check for exact character matches
  for (let i = 0; i < minLength; i++) {
    if (normalized1[i] === normalized2[i]) {
      matches++;
    }
  }
  
  // If one text contains the other, give partial credit
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const containedLength = Math.min(len1, len2);
    const similarity = (containedLength / maxLength) * 100;
    return {
      match: similarity >= 80,
      similarity: Math.round(similarity),
      differences: similarity < 80 ? [`Kỳ vọng: ${text1}`, `Bạn nói: ${text2}`] : []
    };
  }
  
  // Calculate similarity based on character matches
  const similarity = maxLength > 0 ? (matches / maxLength) * 100 : 0;
  
  const differences: string[] = [];
  if (similarity < 80) {
    differences.push(`Kỳ vọng: ${text1}`);
    differences.push(`Bạn nói: ${text2}`);
  }
  
  return { 
    match: similarity >= 80, 
    similarity: Math.round(similarity), 
    differences 
  };
};

