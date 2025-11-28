import { useState, useEffect } from 'react';
import { getSavedWords, removeSavedWord, SavedWord, clearSavedWords } from '../utils/savedWords';
import { speakText } from '../utils/speech';
import '../App.css';

const SavedWords = () => {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedWords();
  }, []);

  const loadSavedWords = () => {
    const words = getSavedWords();
    setSavedWords(words);
  };

  const handleRemove = (wordId: string) => {
    if (confirm('Bạn có chắc muốn xóa từ này khỏi danh sách học sau?')) {
      removeSavedWord(wordId);
      loadSavedWords();
    }
  };

  const handleClearAll = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả từ đã lưu?')) {
      clearSavedWords();
      loadSavedWords();
    }
  };

  const handleSpeak = async (text: string, id: string) => {
    setSpeakingId(id);
    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
    } finally {
      setSpeakingId(null);
    }
  };

  if (savedWords.length === 0) {
    return (
      <div className="container">
        <div className="header">
          <h1>
            <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            Từ đã lưu
          </h1>
          <p>Danh sách từ vựng bạn đã lưu để học sau</p>
        </div>
        <div className="empty-state">
          <p>Chưa có từ nào được lưu</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Hãy tra từ điển và lưu những từ bạn muốn học sau
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          Từ đã lưu ({savedWords.length})
        </h1>
        <p>Danh sách từ vựng bạn đã lưu để học sau</p>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={handleClearAll}>
          Xóa tất cả
        </button>
      </div>

      <div className="saved-words-grid">
        {savedWords.map((word) => (
          <div key={word.id} className="saved-word-card">
            <div className="saved-word-header">
              <div className="saved-word-japanese">
                {word.kanji && (
                  <span className="saved-word-kanji">{word.kanji}</span>
                )}
                {word.hiragana && (
                  <span className="saved-word-hiragana">{word.hiragana}</span>
                )}
                {word.reading && !word.hiragana && (
                  <span className="saved-word-hiragana">{word.reading}</span>
                )}
              </div>
              <button
                className="btn-remove-word"
                onClick={() => handleRemove(word.id)}
                title="Xóa khỏi danh sách"
              >
                ✕
              </button>
            </div>
            <div className="saved-word-meanings">
              {word.meanings.slice(0, 3).map((meaning, idx) => (
                <div key={idx} className="saved-word-meaning">{meaning}</div>
              ))}
              {word.meanings.length > 3 && (
                <div className="saved-word-more">+{word.meanings.length - 3} nghĩa khác</div>
              )}
            </div>
            <div className="saved-word-actions">
              <button
                className="btn btn-speak-small"
                onClick={() => handleSpeak(word.hiragana || word.reading || word.word, word.id)}
                disabled={speakingId === word.id}
              >
                {speakingId === word.id ? '⏸️' : '🔊'} Phát âm
              </button>
              <div className="saved-word-date">
                Đã lưu: {new Date(word.savedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedWords;

