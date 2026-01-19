import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToNotebook, removeFromNotebook, getNotebookItems } from '../services/notebookService';
import { Grammar } from '../types';
import Pagination from './common/Pagination';
import '../App.css';

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
          <svg style={{ width: '40px', height: '40px', color: 'var(--success-color)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                <div className="grammar-pattern">
                  <span className="pattern-label">Mẫu câu:</span>
                  <span className="pattern-text">{g.pattern}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3 className="grammar-meaning">{g.meaning}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleNotebook(g); }}
                    title={notebookItems.has(g.id) ? "Xóa khỏi sổ tay" : "Lưu vào sổ tay"}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      padding: '0.25rem',
                      color: notebookItems.has(g.id) ? '#f59e0b' : '#cbd5e1',
                      transition: 'all 0.2s'
                    }}
                  >
                    {notebookItems.has(g.id) ? '⭐' : '☆'}
                  </button>
                </div>
                <p className="grammar-explanation">{g.explanation}</p>
                <div className="grammar-examples">
                  <div className="examples-title">Ví dụ:</div>
                  {g.examples.map((example, idx) => (
                    <div key={idx} className="example-card">
                      <div className="example-japanese">{example.japanese}</div>
                      <div className="example-romaji">{example.romaji}</div>
                      <div className="example-translation">{example.translation}</div>
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
