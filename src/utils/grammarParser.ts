// Parser for grammar batch import
// Format: pattern=meaning=explanation
// Or: pattern=meaning (simplified)

export interface ParsedGrammar {
  pattern: string;
  meaning: string;
  explanation?: string;
}

export const parseGrammarBatch = (text: string): {
  grammars: ParsedGrammar[];
  errors: string[];
} => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const grammars: ParsedGrammar[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    if (!line) return;

    const parts = line.split('=').map(part => part.trim());
    
    if (parts.length >= 2) {
      const [pattern, meaning] = parts;
      
      if (!pattern || !meaning) {
        errors.push(`Dòng ${lineNumber}: Thiếu mẫu câu hoặc nghĩa`);
        return;
      }

      const grammar: ParsedGrammar = {
        pattern,
        meaning,
      };

      // Parse explanation if provided
      if (parts.length >= 3 && parts[2]) {
        grammar.explanation = parts[2];
      }

      grammars.push(grammar);
    } else {
      errors.push(`Dòng ${lineNumber}: Format không đúng. Sử dụng: pattern=nghĩa hoặc pattern=nghĩa=giải_thích`);
    }
  });

  return { grammars, errors };
};

