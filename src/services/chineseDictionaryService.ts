// Chinese Dictionary Service using CC-CEDICT API
// API: https://cc-cedict.herokuapp.com/

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

// CC-CEDICT API response interface
interface CCCEDICTWord {
  simplified: string;
  traditional: string;
  pinyin: string;
  definitions: string[];
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

// Search Chinese word using CC-CEDICT API
export const searchChineseWord = async (keyword: string): Promise<ChineseWord[]> => {
  const normalizedKeyword = keyword.trim();
  
  if (!normalizedKeyword) {
    return [];
  }

  try {
    // Try CC-CEDICT API first
    const apiUrl = `https://cc-cedict.herokuapp.com/words?keyword=${encodeURIComponent(normalizedKeyword)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: CCCEDICTWord[] = await response.json();
    
    if (data && data.length > 0) {
      return data.map((word, index) => ({
        id: `${word.simplified}-${index}`,
        hanzi: word.simplified,
        pinyin: word.pinyin,
        simplified: word.simplified,
        traditional: word.traditional,
        meanings: word.definitions || [],
      }));
    }

    // Fallback to local dictionary if API fails or no results
    return searchLocalDictionary(normalizedKeyword);
  } catch (error) {
    console.error('CC-CEDICT API error:', error);
    // Fallback to local dictionary
    return searchLocalDictionary(normalizedKeyword);
  }
};

// Fallback local dictionary search
const searchLocalDictionary = (keyword: string): ChineseWord[] => {
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

// Search Chinese character (Hanzi) - uses same API
export const searchChineseCharacter = async (character: string): Promise<ChineseWord[]> => {
  // For character search, use the same word search API
  return searchChineseWord(character);
};

// Format Chinese word - NO japanese field to avoid confusion
export const formatChineseWordToJishoFormat = (word: ChineseWord): any => {
  return {
    slug: word.id,
    is_common: true,
    tags: [],
    jlpt: [],
    // NO japanese field for Chinese words!
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
    // Chinese-specific data
    chinese: {
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      simplified: word.simplified || word.hanzi,
      traditional: word.traditional || word.hanzi,
      meanings: word.meanings,
      examples: word.examples
    }
  };
};



