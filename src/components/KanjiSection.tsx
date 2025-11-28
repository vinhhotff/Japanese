import { Kanji } from '../types';
import '../App.css';

interface KanjiSectionProps {
  kanji: Kanji[];
}

const KanjiSection = ({ kanji }: KanjiSectionProps) => {
  return (
    <div className="section-container kanji-section">
      <div className="section-header kanji-header">
        <div className="section-icon kanji-icon">
          <svg style={{ width: '40px', height: '40px', color: 'var(--secondary-color)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2>Kanji</h2>
          <p>Học cách viết và đọc các chữ Kanji</p>
        </div>
      </div>
      <div className="section-content">
        {kanji.length > 0 ? (
          <div className="kanji-grid">
            {kanji.map((k) => (
              <div key={k.id} className="kanji-card">
                <div className="kanji-character-wrapper">
                  <div className="kanji-character">{k.character}</div>
                  <div className="kanji-stroke-count">{k.strokeCount} nét</div>
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {k.meaning}
                </h3>
                <div className="kanji-readings">
                  <div className="reading-group">
                    <div className="reading-label">Âm On (音読み)</div>
                    <div className="reading-value">
                      {k.readings.onyomi.map((reading, idx) => (
                        <span key={idx} className="reading-tag">{reading}</span>
                      ))}
                    </div>
                  </div>
                  <div className="reading-group">
                    <div className="reading-label">Âm Kun (訓読み)</div>
                    <div className="reading-value">
                      {k.readings.kunyomi.map((reading, idx) => (
                        <span key={idx} className="reading-tag">{reading}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="kanji-examples">
                  <div className="examples-label">Ví dụ:</div>
                  {k.examples.map((example, idx) => (
                    <div key={idx} className="example-item">
                      <span className="example-word">{example.word}</span>
                      <span className="example-reading">({example.reading})</span>
                      <span className="example-meaning">- {example.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Bài này chưa có kanji</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanjiSection;

