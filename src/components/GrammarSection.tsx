import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToNotebook, removeFromNotebook, getNotebookItems } from '../services/notebookService';
import { Grammar } from '../types';
import Pagination from './common/Pagination';
import '../styles/learning-sections-premium.css';

interface GrammarSectionProps {
  grammar: Grammar[];
}

const GrammarSection = ({ grammar }: GrammarSectionProps) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [notebookItems, setNotebookItems] = useState<Set<string>>(new Set());
  const itemsPerPage = 5;

  // Reset page and load notebook status
  useEffect(() => {
    setCurrentPage(1);
    if (user) {
      loadNotebookStatus();
    }
  }, [grammar, user]);

  const loadNotebookStatus = async () => {
    const items = await getNotebookItems(user!.id);
    const itemIds = new Set(items.map(i => i.item_id));
    setNotebookItems(itemIds);
  };

  const handleToggleNotebook = async (g: Grammar) => {
    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng Sổ tay');
      return;
    }

    try {
      if (notebookItems.has(g.id)) {
        await removeFromNotebook(user.id, g.id);
        const newItems = new Set(notebookItems);
        newItems.delete(g.id);
        setNotebookItems(newItems);
      } else {
        await addToNotebook(user.id, 'grammar', g.id);
        const newItems = new Set(notebookItems);
        newItems.add(g.id);
        setNotebookItems(newItems);
      }
    } catch (error) {
      console.error('Error toggling notebook:', error);
    }
  };

  const currentItems = grammar.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="section-container grammar-section">
      <div className="section-header grammar-header">
        <div className="section-icon grammar-icon">
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2>Ngữ pháp</h2>
          <p>Học các mẫu câu và cấu trúc ngữ pháp</p>
        </div>
      </div>
      <div className="section-content">
        {grammar.length > 0 ? (
          <>
            {currentItems.map((g) => (
              <div key={g.id} className="grammar-card">
                <div className="grammar-pattern" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                  <span className="pattern-label" style={{ fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Mẫu câu:</span>
                  <span className="pattern-text">{g.pattern}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 className="grammar-meaning" style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-primary)' }}>{g.meaning}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleNotebook(g); }}
                    title={notebookItems.has(g.id) ? "Xóa khỏi sổ tay" : "Lưu vào sổ tay"}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      padding: '0.5rem',
                      borderRadius: '12px',
                      color: notebookItems.has(g.id) ? '#f59e0b' : 'var(--text-tertiary)',
                      transition: 'all 0.2s',
                      boxShadow: 'var(--shadow)'
                    }}
                  >
                    {notebookItems.has(g.id) ? '⭐' : '☆'}
                  </button>
                </div>
                <p className="grammar-explanation" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>{g.explanation}</p>
                <div className="grammar-examples">
                  <div className="examples-title" style={{ fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', marginBottom: '1rem' }}>Ví dụ:</div>
                  {g.examples.map((example, idx) => (
                    <div key={idx} className="example-card">
                      <div className="example-japanese" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{example.japanese}</div>
                      <div className="example-romaji" style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>{example.romaji}</div>
                      <div className="example-translation" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{example.translation}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(grammar.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={grammar.length}
            />
          </>
        ) : (
          <div className="empty-state">
            <p>Bài này chưa có ngữ pháp</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarSection;
