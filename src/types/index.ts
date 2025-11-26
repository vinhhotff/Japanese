export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface Vocabulary {
  id: string;
  word: string;
  kanji?: string;
  hiragana: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Kanji {
  id: string;
  character: string;
  meaning: string;
  readings: {
    onyomi: string[];
    kunyomi: string[];
  };
  strokeCount: number;
  examples: {
    word: string;
    reading: string;
    meaning: string;
  }[];
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
  level: JLPTLevel;
  lessonNumber: number;
  description: string;
  vocabulary: Vocabulary[];
  kanji: Kanji[];
  grammar: Grammar[];
  listening: ListeningExercise[];
  speaking: SpeakingExercise[];
  roleplay?: RoleplayScenario[];
  difficultVocabulary: string[]; // IDs of difficult vocabulary words
}

export interface Course {
  level: JLPTLevel;
  title: string;
  description: string;
  lessons: Lesson[];
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
  vocabularyHints?: string[];
  grammarPoints?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

