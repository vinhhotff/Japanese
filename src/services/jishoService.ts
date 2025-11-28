// Jisho.org API Service
// API Documentation: https://jisho.org/api/v1/search/words?keyword=

export interface JishoWord {
  slug: string;
  is_common: boolean;
  tags: string[];
  jlpt: string[];
  japanese: Array<{
    word?: string;
    reading: string;
  }>;
  senses: Array<{
    english_definitions: string[];
    parts_of_speech: string[];
    links: Array<{
      text: string;
      url: string;
    }>;
    tags: string[];
    restrictions: string[];
    see_also: string[];
    antonyms: string[];
    source: Array<{
      language: string;
      word: string;
    }>;
    info: string[];
  }>;
  attribution: {
    jmdict: boolean;
    jmnedict: boolean;
    dbpedia: string | null;
  };
}

export interface JishoResponse {
  meta: {
    status: number;
  };
  data: JishoWord[];
}

export interface JishoKanji {
  slug: string;
  is_common: boolean;
  tags: string[];
  jlpt: string[];
  japanese: Array<{
    word: string;
    reading: string;
  }>;
  senses: Array<{
    english_definitions: string[];
    parts_of_speech: string[];
    links: Array<{
      text: string;
      url: string;
    }>;
    tags: string[];
    restrictions: string[];
    see_also: string[];
    antonyms: string[];
    source: Array<{
      language: string;
      word: string;
    }>;
    info: string[];
  }>;
  attribution: {
    jmdict: boolean;
    jmnedict: boolean;
    dbpedia: string | null;
  };
}

// AbortController for canceling requests
let currentController: AbortController | null = null;

// Search for vocabulary/words
export const searchWord = async (keyword: string): Promise<JishoWord[]> => {
  // Cancel previous request if still pending
  if (currentController) {
    currentController.abort();
  }
  
  currentController = new AbortController();
  const signal = currentController.signal;
  
  try {
    // Use local proxy in development, direct API in production
    const isDev = import.meta.env.DEV;
    const apiUrl = isDev 
      ? `/api/jisho/words?keyword=${encodeURIComponent(keyword)}`
      : `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
    
    // Try direct fetch first
    let response: Response | undefined;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: isDev ? 'same-origin' : 'cors',
        signal, // Add abort signal
      });
    } catch (fetchError: any) {
      // If aborted, don't try proxy
      if (signal.aborted) {
        throw new Error('Request cancelled');
      }
      
      // If CORS error, try multiple proxies
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`,
        `https://thingproxy.freeboard.io/fetch/${apiUrl}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`
      ];
      
      let lastError: Error | null = null;
      let proxySuccess = false;
      
      for (const proxyUrl of proxies) {
        try {
          const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal,
          });
          
          if (proxyResponse.ok) {
            // For allorigins, we need to extract the contents
            if (proxyUrl.includes('allorigins')) {
              const data = await proxyResponse.json();
              response = new Response(data.contents, {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            } else {
              response = proxyResponse;
            }
            proxySuccess = true;
            break; // Success, exit loop
          }
        } catch (proxyError: any) {
          lastError = proxyError;
          continue; // Try next proxy
        }
      }
      
      if (!proxySuccess) {
        throw lastError || new Error('Không thể kết nối đến Jisho API. Vui lòng thử lại sau.');
      }
    }
    
    if (signal.aborted) {
      throw new Error('Request cancelled');
    }
    
    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
    }
    
    const data: JishoResponse = await response!.json();
    
    if (data.meta.status !== 200) {
      throw new Error(`Jisho API returned status ${data.meta.status}`);
    }
    
    if (!data.data || data.data.length === 0) {
      return [];
    }
    
    return data.data;
  } catch (error: any) {
    // Don't throw error if request was aborted
    if (error.name === 'AbortError' || error.message === 'Request cancelled') {
      throw new Error('Request cancelled');
    }
    
    // Provide more helpful error messages
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Không thể kết nối đến Jisho API. Có thể do CORS hoặc vấn đề mạng. Vui lòng thử lại sau.');
    }
    
    throw new Error(error.message || 'Có lỗi xảy ra khi tra từ');
  } finally {
    currentController = null;
  }
};

// Search for kanji
export const searchKanji = async (keyword: string): Promise<any> => {
  try {
    // Use local proxy in development
    const isDev = import.meta.env.DEV;
    const apiUrl = isDev 
      ? `/api/jisho/words?keyword=${encodeURIComponent(keyword)}`
      : `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
    
    // Jisho doesn't have a dedicated kanji API endpoint
    // We'll search for words and filter for kanji results
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: JishoResponse = await response.json();
    
    if (data.meta.status !== 200) {
      throw new Error('Jisho API returned an error');
    }
    
    // Filter results that contain the exact kanji character
    const kanjiResults = data.data.filter(item => 
      item.japanese.some(j => j.word === keyword)
    );
    
    return kanjiResults;
  } catch (error) {
    console.error('Error searching kanji:', error);
    throw error;
  }
};

// Get kanji information from a character
export const getKanjiInfo = async (character: string): Promise<any> => {
  try {
    // Use local proxy in development
    const isDev = import.meta.env.DEV;
    const apiUrl = isDev 
      ? `/api/jisho/words?keyword=${encodeURIComponent(character)}`
      : `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(character)}`;
    
    // Try to get kanji details from Jisho
    // Note: Jisho API doesn't have direct kanji lookup, so we search for words containing it
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: JishoResponse = await response.json();
    
    // Find the first result that has the kanji as the main word
    const kanjiResult = data.data.find(item => 
      item.japanese.some(j => j.word === character)
    );
    
    return kanjiResult;
  } catch (error) {
    console.error('Error getting kanji info:', error);
    throw error;
  }
};

// Format Jisho word result to our Vocabulary format
export const formatJishoWordToVocabulary = (jishoWord: JishoWord): {
  word: string;
  kanji?: string;
  hiragana: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
} => {
  const japanese = jishoWord.japanese[0];
  const sense = jishoWord.senses[0];
  
  return {
    word: japanese.reading,
    kanji: japanese.word,
    hiragana: japanese.reading,
    meaning: sense.english_definitions.join(', '),
    example: japanese.word || japanese.reading,
    exampleTranslation: sense.english_definitions[0] || ''
  };
};

// Format Jisho result to our Kanji format
export const formatJishoToKanji = (jishoWord: JishoWord): {
  character: string;
  meaning: string;
  readings: {
    onyomi: string[];
    kunyomi: string[];
  };
  examples: Array<{
    word: string;
    reading: string;
    meaning: string;
  }>;
} => {
  const japanese = jishoWord.japanese[0];
  const sense = jishoWord.senses[0];
  
  // Extract readings (this is simplified - Jisho doesn't provide direct onyomi/kunyomi)
  const readings = {
    onyomi: [] as string[],
    kunyomi: [] as string[]
  };
  
  // Get examples from other senses
  const examples = jishoWord.senses.slice(0, 3).map(s => ({
    word: japanese.word || japanese.reading,
    reading: japanese.reading,
    meaning: s.english_definitions[0] || ''
  }));
  
  return {
    character: japanese.word || japanese.reading,
    meaning: sense.english_definitions.join(', '),
    readings,
    examples
  };
};

