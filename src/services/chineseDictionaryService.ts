// Simple Chinese Dictionary Service
// This service provides basic Chinese dictionary functionality
// For production, consider using a dedicated Chinese dictionary API

export interface ChineseWord {
  id: string;
  hanzi: string;
  pinyin: string;
  simplified?: string;
  traditional?: string;
  meanings: string[];
  examples?: Array<{
    hanzi: string;
    pinyin: string;
    meaning: string;
  }>;
}

// Simple in-memory dictionary (can be replaced with API call)
const simpleChineseDictionary: Record<string, ChineseWord> = {
  '你好': {
    id: 'nihao',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    meanings: ['hello', 'hi'],
    examples: [
      { hanzi: '你好吗？', pinyin: 'nǐ hǎo ma?', meaning: 'How are you?' }
    ]
  },
  '谢谢': {
    id: 'xiexie',
    hanzi: '谢谢',
    pinyin: 'xiè xie',
    meanings: ['thank you', 'thanks'],
    examples: [
      { hanzi: '谢谢你', pinyin: 'xiè xie nǐ', meaning: 'Thank you' }
    ]
  },
  '再见': {
    id: 'zaijian',
    hanzi: '再见',
    pinyin: 'zài jiàn',
    meanings: ['goodbye', 'see you again'],
  },
  '学': {
    id: 'xue',
    hanzi: '学',
    pinyin: 'xué',
    meanings: ['to study', 'to learn', 'learning'],
    examples: [
      { hanzi: '学习', pinyin: 'xué xí', meaning: 'to study' },
      { hanzi: '学生', pinyin: 'xué shēng', meaning: 'student' }
    ]
  },
  '习': {
    id: 'xi',
    hanzi: '习',
    pinyin: 'xí',
    meanings: ['to practice', 'to review', 'habit'],
    examples: [
      { hanzi: '学习', pinyin: 'xué xí', meaning: 'to study' }
    ]
  }
};

// Search Chinese word
export const searchChineseWord = async (keyword: string): Promise<ChineseWord[]> => {
  // Normalize keyword (remove spaces, convert to lowercase for pinyin)
  const normalizedKeyword = keyword.trim();
  
  // Try exact match first
  if (simpleChineseDictionary[normalizedKeyword]) {
    return [simpleChineseDictionary[normalizedKeyword]];
  }
  
  // Search by hanzi (partial match)
  const results: ChineseWord[] = [];
  for (const [hanzi, word] of Object.entries(simpleChineseDictionary)) {
    if (hanzi.includes(normalizedKeyword) || normalizedKeyword.includes(hanzi)) {
      results.push(word);
    }
  }
  
  // Search by pinyin (partial match)
  if (results.length === 0) {
    const keywordLower = normalizedKeyword.toLowerCase();
    for (const word of Object.values(simpleChineseDictionary)) {
      if (word.pinyin.toLowerCase().includes(keywordLower) || 
          keywordLower.includes(word.pinyin.toLowerCase().replace(/\s+/g, ''))) {
        if (!results.find(r => r.id === word.id)) {
          results.push(word);
        }
      }
    }
  }
  
  // Search by meaning (English)
  if (results.length === 0) {
    const keywordLower = normalizedKeyword.toLowerCase();
    for (const word of Object.values(simpleChineseDictionary)) {
      if (word.meanings.some(m => m.toLowerCase().includes(keywordLower))) {
        if (!results.find(r => r.id === word.id)) {
          results.push(word);
        }
      }
    }
  }
  
  return results;
};

// Search Chinese character (Hanzi)
export const searchChineseCharacter = async (character: string): Promise<ChineseWord[]> => {
  const normalizedChar = character.trim();
  
  // Exact match
  if (simpleChineseDictionary[normalizedChar]) {
    return [simpleChineseDictionary[normalizedChar]];
  }
  
  // Partial match (character appears in hanzi)
  const results: ChineseWord[] = [];
  for (const [hanzi, word] of Object.entries(simpleChineseDictionary)) {
    if (hanzi.includes(normalizedChar)) {
      results.push(word);
    }
  }
  
  return results;
};

// Format Chinese word to match Jisho-like structure for compatibility
export const formatChineseWordToJishoFormat = (word: ChineseWord): any => {
  return {
    slug: word.id,
    is_common: true,
    tags: [],
    jlpt: [],
    japanese: [{
      word: word.hanzi,
      reading: word.pinyin
    }],
    senses: [{
      english_definitions: word.meanings,
      parts_of_speech: [],
      links: [],
      tags: [],
      restrictions: [],
      see_also: [],
      antonyms: [],
      source: [],
      info: []
    }],
    attribution: {
      jmdict: false,
      jmnedict: false,
      dbpedia: null
    },
    chinese: {
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      simplified: word.simplified,
      traditional: word.traditional,
      meanings: word.meanings,
      examples: word.examples
    }
  };
};


