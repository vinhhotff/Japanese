// Parser for vocabulary batch import
// Format Japanese: kanji=hiragana=tiếng việt or hiragana=tiếng việt
// Format Chinese: hanzi=pinyin=tiếng việt or traditional=simplified=pinyin=tiếng việt

export interface ParsedVocabulary {
  // Japanese fields
  kanji?: string;
  hiragana?: string;
  // Chinese fields
  simplified?: string;
  traditional?: string;
  pinyin?: string;
  // Common fields
  meaning: string;
  word: string; // Will be kanji/hiragana for Japanese or simplified for Chinese
}

export const parseVocabularyBatch = (text: string, language: 'japanese' | 'chinese' = 'japanese'): {
  vocabularies: ParsedVocabulary[];
  errors: string[];
} => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const vocabularies: ParsedVocabulary[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Skip empty lines
    if (!line) return;

    // Parse format based on language
    const parts = line.split('=').map(part => part.trim());
    
    if (language === 'japanese') {
      // Japanese format: kanji=hiragana=meaning or hiragana=meaning
      if (parts.length === 2) {
        // Format: hiragana=meaning (no kanji)
        const [hiragana, meaning] = parts;
        if (!hiragana || !meaning) {
          errors.push(`Dòng ${lineNumber}: Thiếu hiragana hoặc nghĩa`);
          return;
        }
        vocabularies.push({
          hiragana,
          meaning,
          word: hiragana,
        });
      } else if (parts.length === 3) {
        // Format: kanji=hiragana=meaning
        const [kanji, hiragana, meaning] = parts;
        if (!hiragana || !meaning) {
          errors.push(`Dòng ${lineNumber}: Thiếu hiragana hoặc nghĩa`);
          return;
        }
        vocabularies.push({
          kanji: kanji || undefined,
          hiragana,
          meaning,
          word: kanji || hiragana,
        });
      } else {
        errors.push(`Dòng ${lineNumber}: Format không đúng. Sử dụng: kanji=hiragana=nghĩa hoặc hiragana=nghĩa`);
      }
    } else {
      // Chinese format: hanzi=pinyin=meaning or traditional=simplified=pinyin=meaning
      if (parts.length === 3) {
        // Format: hanzi=pinyin=meaning (simplified only)
        const [hanzi, pinyin, meaning] = parts;
        if (!hanzi || !pinyin || !meaning) {
          errors.push(`Dòng ${lineNumber}: Thiếu hán tự, pinyin hoặc nghĩa`);
          return;
        }
        vocabularies.push({
          simplified: hanzi,
          pinyin,
          meaning,
          word: hanzi,
        });
      } else if (parts.length === 4) {
        // Format: traditional=simplified=pinyin=meaning
        const [traditional, simplified, pinyin, meaning] = parts;
        if (!simplified || !pinyin || !meaning) {
          errors.push(`Dòng ${lineNumber}: Thiếu hán tự giản thể, pinyin hoặc nghĩa`);
          return;
        }
        vocabularies.push({
          traditional: traditional || undefined,
          simplified,
          pinyin,
          meaning,
          word: simplified,
        });
      } else {
        errors.push(`Dòng ${lineNumber}: Format không đúng. Sử dụng: hanzi=pinyin=nghĩa hoặc hanzi_phồn_thể=hanzi_giản_thể=pinyin=nghĩa`);
      }
    }
  });

  return { vocabularies, errors };
};

