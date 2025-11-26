// Parser for sentence game batch import
// Format: japanese_sentence=vietnamese_translation
// Ví dụ:
// 私は学生です=Tôi là học sinh

export interface ParsedSentenceGame {
  sentence: string;
  translation: string;
  words: string[];
  correct_order: number[];
}

export const parseSentenceGameBatch = (text: string): {
  games: ParsedSentenceGame[];
  errors: string[];
} => {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const games: ParsedSentenceGame[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (!line) return;

    const parts = line.split('=').map(part => part.trim());

    if (parts.length < 2) {
      errors.push(
        `Dòng ${lineNumber}: Format không đúng. Sử dụng: câu_tiếng_Nhật=nghĩa_tiếng_Việt`
      );
      return;
    }

    const [sentence, translation] = parts;

    if (!sentence || !translation) {
      errors.push(`Dòng ${lineNumber}: Thiếu câu tiếng Nhật hoặc nghĩa tiếng Việt`);
      return;
    }

    // Tách câu thành từ bằng khoảng trắng. Nếu người nhập không có khoảng trắng,
    // khuyến nghị họ tách sẵn theo token (ví dụ: 私 は 学生 です)
    const words = sentence
      .split(' ')
      .map(w => w.trim())
      .filter(Boolean);

    if (words.length < 2) {
      errors.push(
        `Dòng ${lineNumber}: Cần ít nhất 2 token. Hãy tách câu bằng khoảng trắng, ví dụ: "私 は 学生 です"`
      );
      return;
    }

    const correct_order = words.map((_, idx) => idx);

    games.push({
      sentence,
      translation,
      words,
      correct_order,
    });
  });

  return { games, errors };
};


