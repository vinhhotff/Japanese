import { Grammar } from '../types';
import '../App.css';

interface GrammarSectionProps {
  grammar: Grammar[];
}

const GrammarSection = ({ grammar }: GrammarSectionProps) => {
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
          grammar.map((g) => (
            <div key={g.id} className="grammar-card">
              <div className="grammar-pattern">
                <span className="pattern-label">Mẫu câu:</span>
                <span className="pattern-text">{g.pattern}</span>
              </div>
              <h3 className="grammar-meaning">{g.meaning}</h3>
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
          ))
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

