// Parser for kanji batch import
// Format: character=meaning=onyomi,kunyomi=stroke_count
// Or: character=meaning (simplified)

export interface ParsedKanji {
  character: string;
  meaning: string;
  onyomi: string[];
  kunyomi: string[];
  stroke_count?: number;
}

export const parseKanjiBatch = (text: string): {
  kanjis: ParsedKanji[];
  errors: string[];
} => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const kanjis: ParsedKanji[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    if (!line) return;

    const parts = line.split('=').map(part => part.trim());
    
    if (parts.length >= 2) {
      const [character, meaning] = parts;
      
      if (!character || !meaning) {
        errors.push(`Dòng ${lineNumber}: Thiếu kanji hoặc nghĩa`);
        return;
      }

      // Check if character is single kanji
      if (character.length > 1 && !character.match(/^[\u4e00-\u9faf]+$/)) {
        errors.push(`Dòng ${lineNumber}: "${character}" không phải là một kanji đơn`);
        return;
      }

      const kanji: ParsedKanji = {
        character,
        meaning,
        onyomi: [],
        kunyomi: [],
      };

      // Parse onyomi and kunyomi if provided
      // Format: kanji=meaning=onyomi1,onyomi2|kunyomi1,kunyomi2=stroke_count
      // Or simplified: kanji=meaning
      if (parts.length >= 3 && parts[2]) {
        const readingsStr = parts[2];
        // Check if has | separator (onyomi|kunyomi)
        if (readingsStr.includes('|')) {
          const [onyomiStr, kunyomiStr] = readingsStr.split('|');
          kanji.onyomi = onyomiStr.split(',').map(r => r.trim()).filter(Boolean);
          kanji.kunyomi = kunyomiStr.split(',').map(r => r.trim()).filter(Boolean);
        } else {
          // All readings go to onyomi for simplicity
          kanji.onyomi = readingsStr.split(',').map(r => r.trim()).filter(Boolean);
        }
      }

      // Parse stroke count if provided
      if (parts.length >= 4 && parts[3]) {
        const strokeCount = parseInt(parts[3]);
        if (!isNaN(strokeCount)) {
          kanji.stroke_count = strokeCount;
        }
      }

      kanjis.push(kanji);
    } else {
      errors.push(`Dòng ${lineNumber}: Format không đúng. Sử dụng: kanji=nghĩa hoặc kanji=nghĩa=onyomi,kunyomi=số_nét`);
    }
  });

  return { kanjis, errors };
};

