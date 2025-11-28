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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {vocabulary.map((vocab) => (
              <div key={vocab.id} style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                background: 'white',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                {/* Badge */}
                <span style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: vocab.difficulty === 'hard' ? '#fee2e2' : vocab.difficulty === 'medium' ? '#fef3c7' : '#dbeafe',
                  color: vocab.difficulty === 'hard' ? '#991b1b' : vocab.difficulty === 'medium' ? '#92400e' : '#1e40af'
                }}>
                  {vocab.difficulty === 'hard' ? 'Khó' : vocab.difficulty === 'medium' ? 'TB' : 'Dễ'}
                </span>

                {/* Word */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      {vocab.kanji ? (
                        <>
                          <h3 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, lineHeight: '1.2', color: '#1f2937' }}>
                            {vocab.kanji}
                          </h3>
                          <p style={{ fontSize: '1rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                            {vocab.hiragana}
                          </p>
                        </>
                      ) : (
                        <h3 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, lineHeight: '1.2', color: '#1f2937' }}>
                          {vocab.word}
                        </h3>
                      )}
                    </div>
                    <button
                      onClick={() => handleSpeak(vocab)}
                      title="Phát âm"
                      disabled={!isSpeechSynthesisSupported()}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        padding: '0.25rem',
                        opacity: speakingId === vocab.id ? 1 : 0.6,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = speakingId === vocab.id ? '1' : '0.6'}
                    >
                      {speakingId === vocab.id ? '⏸️' : '🔊'}
                    </button>
                  </div>
                </div>

                {/* Meaning */}
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: vocab.example ? '1rem' : 0 }}>
                  {vocab.meaning}
                </p>

                {/* Example */}
                {vocab.example && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontStyle: 'italic', marginBottom: '0.5rem', fontSize: '0.9375rem', color: '#374151' }}>
                      {vocab.example}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {vocab.exampleTranslation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
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

