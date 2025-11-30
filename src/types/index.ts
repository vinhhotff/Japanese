export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type HSKLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';
export type Language = 'japanese' | 'chinese';
export type Level = JLPTLevel | HSKLevel;

export interface Vocabulary {
  id: string;
  word: string;
  kanji?: string; // For Japanese
  character?: string; // Generic: Kanji for Japanese, Hanzi for Chinese
  hiragana?: string; // For Japanese
  pinyin?: string; // For Chinese
  simplified?: string; // For Chinese
  traditional?: string; // For Chinese
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language?: Language;
}

export interface Kanji {
  id: string;
  character: string;
  meaning: string;
  readings?: {
    onyomi: string[];
    kunyomi: string[];
  };
  pinyin?: string; // For Chinese
  simplified?: string; // For Chinese
  traditional?: string; // For Chinese
  radical?: string; // For Chinese
  strokeCount: number;
  examples: {
    word: string;
    reading: string;
    meaning: string;
  }[];
  language?: Language;
}

export interface Grammar {
  id: string;
  pattern: string;
  meaning: string;
  explanation: string;
  examples: {
    japanese: string;
    romaji: string;
    translation: string;
  }[];
}

export interface ListeningExercise {
  id: string;
  title: string;
  audioUrl?: string;
  imageUrl?: string;
  transcript: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export interface SpeakingExercise {
  id: string;
  title: string;
  prompt: string;
  exampleResponse?: string;
}

export interface Lesson {
  id: string;
  title: string;
  level: Level;
  lessonNumber: number;
  description: string;
  vocabulary: Vocabulary[];
  kanji: Kanji[];
  grammar: Grammar[];
  listening: ListeningExercise[];
  speaking: SpeakingExercise[];
  roleplay?: RoleplayScenario[];
  difficultVocabulary: string[]; // IDs of difficult vocabulary words
  language?: Language;
}

export interface Course {
  level: Level;
  title: string;
  description: string;
  lessons: Lesson[];
  language?: Language;
}

export interface SentenceGame {
  id: string;
  sentence: string;
  translation: string;
  words: string[];
  correctOrder: number[];
  hint?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'vocabulary' | 'kanji' | 'grammar';
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface UserProgress {
  lessonId: string;
  completed: boolean;
  vocabularyMastered: string[];
  kanjiMastered: string[];
  grammarMastered: string[];
  gamesPlayed: number;
  gamesWon: number;
  lastAccessed: Date;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  description?: string;
  scenario: string;
  characterA: string;
  characterB: string;
  characterAScript: string[];
  characterBScript: string[];
  characterACorrectAnswers?: string[][]; // Multiple correct answers for each line
  characterBCorrectAnswers?: string[][]; // Multiple correct answers for each line
  vocabularyHints?: string[];
  grammarPoints?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  enableScoring?: boolean; // Admin can enable/disable scoring
}

