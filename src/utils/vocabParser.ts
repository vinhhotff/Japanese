// Parser for vocabulary batch import
// Format: kanji=hiragana=tiếng việt
// Or: hiragana=tiếng việt (if no kanji)

export interface ParsedVocabulary {
  kanji?: string;
  hiragana: string;
  meaning: string;
  word: string; // Will be kanji or hiragana
}

export const parseVocabularyBatch = (text: string): {
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

    // Parse format: kanji=hiragana=meaning or hiragana=meaning
    const parts = line.split('=').map(part => part.trim());
    
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
  });

  return { vocabularies, errors };
};

