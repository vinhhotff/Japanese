import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToNotebook, removeFromNotebook, getNotebookItems } from '../services/notebookService';
import { Vocabulary } from '../types';
import { speakTextSafely, isSpeechSynthesisSupported } from '../utils/speech';
import type { Language } from '../services/supabaseService.v2';
import Pagination from './common/Pagination';
import '../App.css';

interface VocabularySectionProps {
  vocabulary: Vocabulary[];
  language: Language;
}

const VocabularySection = ({ vocabulary, language }: VocabularySectionProps) => {
  const { user } = useAuth();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notebookItems, setNotebookItems] = useState<Set<string>>(new Set());
  const itemsPerPage = 6;

  // Reset page and load notebook status
  useEffect(() => {
    setCurrentPage(1);
    if (user) {
      loadNotebookStatus();
    }
  }, [vocabulary, user]);

  const loadNotebookStatus = async () => {
    const items = await getNotebookItems(user!.id);
    const itemIds = new Set(items.map(i => i.item_id));
    setNotebookItems(itemIds);
  };

  const handleToggleNotebook = async (vocab: Vocabulary) => {
    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng Sổ tay');
      return;
    }

    try {
      if (notebookItems.has(vocab.id)) {
        await removeFromNotebook(user.id, vocab.id);
        const newItems = new Set(notebookItems);
        newItems.delete(vocab.id);
        setNotebookItems(newItems);
      } else {
        await addToNotebook(user.id, 'vocabulary', vocab.id);
        const newItems = new Set(notebookItems);
        newItems.add(vocab.id);
        setNotebookItems(newItems);
      }
    } catch (error) {
      console.error('Error toggling notebook:', error);
    }
  };

  const handleSpeak = async (vocab: Vocabulary) => {
    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    setSpeakingId(vocab.id);
    try {
      const textToSpeak = language === 'japanese'
        ? (vocab.kanji || vocab.word || vocab.hiragana || '')
        : (vocab.character || vocab.word || vocab.pinyin || '');
      await speakTextSafely(textToSpeak);
    } catch (error) {
      console.error('Error speaking:', error);
      alert('Có lỗi xảy ra khi phát âm');
    } finally {
      setSpeakingId(null);
    }
  };

  const currentItems = vocabulary.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="section-container vocab-section">
      <div className="section-header vocab-header">
        <div className="section-icon vocab-icon">
          <svg style={{ width: '40px', height: '40px', color: 'var(--primary-color)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {currentItems.map((vocab) => (
                <div key={vocab.id} style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
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
                    background: vocab.difficulty === 'hard' ? 'var(--danger-light)' : vocab.difficulty === 'medium' ? 'var(--warning-light)' : 'var(--primary-light)',
                    color: vocab.difficulty === 'hard' ? 'var(--danger-color)' : vocab.difficulty === 'medium' ? 'var(--warning-color)' : 'var(--primary-color)'
                  }}>
                    {vocab.difficulty === 'hard' ? 'Khó' : vocab.difficulty === 'medium' ? 'TB' : 'Dễ'}
                  </span>

                  {/* Word */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        {language === 'japanese' ? (
                          vocab.kanji ? (
                            <>
                              <h3 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, lineHeight: '1.2', color: 'var(--text-primary)' }}>
                                {vocab.kanji}
                              </h3>
                              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                {vocab.hiragana}
                              </p>
                            </>
                          ) : (
                            <h3 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, lineHeight: '1.2', color: 'var(--text-primary)' }}>
                              {vocab.word}
                            </h3>
                          )
                        ) : (
                          <>
                            <h3 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, lineHeight: '1.2', color: 'var(--text-primary)' }}>
                              {vocab.character || vocab.word}
                            </h3>
                            {vocab.pinyin && (
                              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                {vocab.pinyin}
                              </p>
                            )}
                            {(vocab.simplified || vocab.traditional) && (
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {vocab.simplified && vocab.simplified !== vocab.character && (
                                  <span>简: {vocab.simplified}</span>
                                )}
                                {vocab.traditional && vocab.traditional !== vocab.character && (
                                  <span>繁: {vocab.traditional}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleNotebook(vocab); }}
                          title={notebookItems.has(vocab.id) ? "Xóa khỏi sổ tay" : "Lưu vào sổ tay"}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            padding: '0.25rem',
                            color: notebookItems.has(vocab.id) ? '#f59e0b' : 'var(--text-secondary)',
                            opacity: notebookItems.has(vocab.id) ? 1 : 0.4,
                            transition: 'all 0.2s'
                          }}
                        >
                          {notebookItems.has(vocab.id) ? '⭐' : '☆'}
                        </button>
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
                  </div>

                  {/* Meaning */}
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: vocab.example ? '1rem' : 0 }}>
                    {vocab.meaning}
                  </p>

                  {/* Example */}
                  {vocab.example && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <p style={{ fontStyle: 'italic', marginBottom: '0.5rem', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {vocab.example}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {vocab.exampleTranslation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(vocabulary.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={vocabulary.length}
            />
          </>
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
