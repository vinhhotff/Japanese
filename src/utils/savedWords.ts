/**
 * LocalStorage utilities for saving words from dictionary
 */

export interface SavedWord {
  id: string;
  word: string;
  kanji?: string;
  hiragana?: string;
  reading?: string;
  meanings: string[];
  savedAt: string; // ISO date string
  type: 'word' | 'kanji';
}

const SAVED_WORDS_KEY = 'japanese_saved_words';

export const getSavedWords = (): SavedWord[] => {
  try {
    const stored = localStorage.getItem(SAVED_WORDS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading saved words:', error);
  }
  return [];
};

export const saveWord = (word: SavedWord): void => {
  try {
    const savedWords = getSavedWords();
    // Check if word already exists
    const exists = savedWords.some(w => w.id === word.id);
    if (!exists) {
      savedWords.push(word);
      localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(savedWords));
    }
  } catch (error) {
    console.error('Error saving word:', error);
  }
};

export const removeSavedWord = (wordId: string): void => {
  try {
    const savedWords = getSavedWords();
    const filtered = savedWords.filter(w => w.id !== wordId);
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing word:', error);
  }
};

export const isWordSaved = (wordId: string): boolean => {
  const savedWords = getSavedWords();
  return savedWords.some(w => w.id === wordId);
};

export const clearSavedWords = (): void => {
  try {
    localStorage.removeItem(SAVED_WORDS_KEY);
  } catch (error) {
    console.error('Error clearing saved words:', error);
  }
};

