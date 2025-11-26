import { useState } from 'react';
import { Vocabulary } from '../types';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';
import '../App.css';

interface VocabularySectionProps {
  vocabulary: Vocabulary[];
}

const VocabularySection = ({ vocabulary }: VocabularySectionProps) => {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const getDifficultyClass = (difficulty: Vocabulary['difficulty']) => {
    return difficulty;
  };

  const handleSpeak = async (vocab: Vocabulary) => {
    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    setSpeakingId(vocab.id);
    try {
      await speakText(vocab.kanji || vocab.word);
    } catch (error) {
      console.error('Error speaking:', error);
      alert('Có lỗi xảy ra khi phát âm');
    } finally {
      setSpeakingId(null);
    }
  };

  return (
    <div className="section-container vocab-section">
      <div className="section-header vocab-header">
        <div className="section-icon vocab-icon">
          <svg style={{ width: '40px', height: '40px', color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h2>Từ vựng</h2>
          <p>Tổng hợp từ vựng trong bài học này</p>
        </div>
      </div>
      <div className="section-content">
        {vocabulary.length > 0 ? (
          vocabulary.map((vocab) => (
              <div key={vocab.id} className={`vocab-card ${getDifficultyClass(vocab.difficulty)}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                        {vocab.kanji || vocab.word}
                      </h3>
                      <button
                        className={`btn-speak-word ${speakingId === vocab.id ? 'speaking' : ''}`}
                        onClick={() => handleSpeak(vocab)}
                        title="Phát âm từ này"
                        disabled={!isSpeechSynthesisSupported()}
                      >
                        {speakingId === vocab.id ? '⏸️' : '🔊'}
                      </button>
                    </div>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontFamily: 'serif' }}>
                      {vocab.hiragana}
                    </p>
                    <p style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {vocab.meaning}
                    </p>
                  {vocab.example && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--border-color)' }}>
                      <p style={{ fontStyle: 'italic', marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {vocab.example}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {vocab.exampleTranslation}
                      </p>
                    </div>
                  )}
                </div>
                <span className={`badge badge-${vocab.difficulty === 'hard' ? 'n1' : vocab.difficulty === 'medium' ? 'n3' : 'n5'}`}>
                  {vocab.difficulty === 'hard' ? 'Khó' : vocab.difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Bài này chưa có từ vựng</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularySection;

