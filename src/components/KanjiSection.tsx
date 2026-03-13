import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToNotebook, removeFromNotebook, getNotebookItems } from '../services/notebookService';
import { Kanji } from '../types';
import type { Language } from '../services/supabaseService.v2';
import Pagination from './common/Pagination';
import '../styles/learning-sections-premium.css';

interface KanjiSectionProps {
  kanji: Kanji[];
  language: Language;
}

const KanjiSection = ({ kanji, language }: KanjiSectionProps) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [notebookItems, setNotebookItems] = useState<Set<string>>(new Set());
  const itemsPerPage = 6;

  // Reset page and load notebook status
  useEffect(() => {
    setCurrentPage(1);
    if (user) {
      loadNotebookStatus();
    }
  }, [kanji, user]);

  const loadNotebookStatus = async () => {
    const items = await getNotebookItems(user!.id);
    const itemIds = new Set(items.map(i => i.item_id));
    setNotebookItems(itemIds);
  };

  const handleToggleNotebook = async (k: Kanji) => {
    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng Sổ tay');
      return;
    }

    try {
      if (notebookItems.has(k.id)) {
        await removeFromNotebook(user.id, k.id);
        const newItems = new Set(notebookItems);
        newItems.delete(k.id);
        setNotebookItems(newItems);
      } else {
        await addToNotebook(user.id, 'kanji', k.id);
        const newItems = new Set(notebookItems);
        newItems.add(k.id);
        setNotebookItems(newItems);
      }
    } catch (error) {
      console.error('Error toggling notebook:', error);
    }
  };

  const currentItems = kanji.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="section-container kanji-section">
      <div className="section-header kanji-header">
        <div className="section-icon kanji-icon">
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2>{language === 'japanese' ? 'Kanji' : 'Hán tự'}</h2>
          <p>{language === 'japanese' ? 'Học cách viết và đọc các chữ Kanji' : 'Học cách viết và đọc các chữ Hán tự'}</p>
        </div>
      </div>
      <div className="section-content">
        {kanji.length > 0 ? (
          <>
            <div className="kanji-grid">
              {currentItems.map((k) => (
                <div key={k.id} className="kanji-card">
                  <div className="kanji-character-wrapper" style={{ position: 'relative' }}>
                    <div className="kanji-character">{k.character}</div>
                    <div className="kanji-stroke-count">{k.strokeCount} nét</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleNotebook(k); }}
                      title={notebookItems.has(k.id) ? "Xóa khỏi sổ tay" : "Lưu vào sổ tay"}
                      style={{
                        position: 'absolute',
                        top: '-15px',
                        right: '-15px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: notebookItems.has(k.id) ? '#f59e0b' : 'var(--text-tertiary)',
                        boxShadow: 'var(--shadow)',
                        zIndex: 2,
                        transition: 'all 0.2s'
                      }}
                    >
                      {notebookItems.has(k.id) ? '⭐' : '☆'}
                    </button>
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                    {k.meaning}
                  </h3>
                  {language === 'japanese' ? (
                    <div className="kanji-readings">
                      {k.readings && (
                        <>
                          <div className="reading-group">
                            <div className="reading-label">Âm On (音読み)</div>
                            <div className="reading-value" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                              {k.readings.onyomi && k.readings.onyomi.length > 0 ? (
                                k.readings.onyomi.map((reading, idx) => (
                                  <span key={idx} className="reading-tag">{reading}</span>
                                ))
                              ) : (
                                <span className="reading-tag">-</span>
                              )}
                            </div>
                          </div>
                          <div className="reading-group">
                            <div className="reading-label">Âm Kun (訓読み)</div>
                            <div className="reading-value" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                              {k.readings.kunyomi && k.readings.kunyomi.length > 0 ? (
                                k.readings.kunyomi.map((reading, idx) => (
                                  <span key={idx} className="reading-tag">{reading}</span>
                                ))
                              ) : (
                                <span className="reading-tag">-</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="kanji-readings">
                      {k.pinyin && (
                        <div className="reading-group">
                          <div className="reading-label">Pinyin</div>
                          <div className="reading-value">
                            <span className="reading-tag">{k.pinyin}</span>
                          </div>
                        </div>
                      )}
                      {k.radical && (
                        <div className="reading-group">
                          <div className="reading-label">Bộ thủ</div>
                          <div className="reading-value">
                            <span className="reading-tag">{k.radical}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="kanji-examples" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                    <div className="examples-label" style={{ fontWeight: '800', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Ví dụ:</div>
                    {k.examples.map((example, idx) => (
                      <div key={idx} className="example-item" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                        <span className="example-word" style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{example.word}</span>
                        <span className="example-reading" style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>({example.reading})</span>
                        <span className="example-meaning" style={{ display: 'block', marginTop: '0.2rem', color: 'var(--text-secondary)' }}> {example.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(kanji.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={kanji.length}
            />
          </>
        ) : (
          <div className="empty-state">
            <p>Bài này chưa có {language === 'japanese' ? 'kanji' : 'hán tự'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanjiSection;
