import { useState } from 'react';
import { Vocabulary, Kanji, Grammar } from '../types';
import '../App.css';

interface SearchBarProps {
  vocabulary: Vocabulary[];
  kanji: Kanji[];
  grammar: Grammar[];
  onResultClick?: (type: 'vocab' | 'kanji' | 'grammar', id: string) => void;
}

const SearchBar = ({ vocabulary, kanji, grammar, onResultClick }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{
    vocab: Vocabulary[];
    kanji: Kanji[];
    grammar: Grammar[];
  }>({ vocab: [], kanji: [], grammar: [] });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setResults({ vocab: [], kanji: [], grammar: [] });
      setIsOpen(false);
      return;
    }

    const lowerTerm = term.toLowerCase();

    const vocabResults = vocabulary.filter(v => 
      v.word.toLowerCase().includes(lowerTerm) ||
      v.hiragana.toLowerCase().includes(lowerTerm) ||
      v.kanji?.toLowerCase().includes(lowerTerm) ||
      v.meaning.toLowerCase().includes(lowerTerm)
    );

    const kanjiResults = kanji.filter(k =>
      k.character.includes(term) ||
      k.meaning.toLowerCase().includes(lowerTerm) ||
      k.readings.onyomi.some(r => r.toLowerCase().includes(lowerTerm)) ||
      k.readings.kunyomi.some(r => r.toLowerCase().includes(lowerTerm))
    );

    const grammarResults = grammar.filter(g =>
      g.pattern.toLowerCase().includes(lowerTerm) ||
      g.meaning.toLowerCase().includes(lowerTerm) ||
      g.explanation.toLowerCase().includes(lowerTerm)
    );

    setResults({ vocab: vocabResults, kanji: kanjiResults, grammar: grammarResults });
    setIsOpen(true);
  };

  const totalResults = results.vocab.length + results.kanji.length + results.grammar.length;

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Tìm từ vựng, kanji, ngữ pháp..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchTerm && setIsOpen(true)}
        />
        {searchTerm && (
          <button 
            className="search-clear"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
              setResults({ vocab: [], kanji: [], grammar: [] });
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && totalResults > 0 && (
        <div className="search-results">
          {results.vocab.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">📖 Từ vựng ({results.vocab.length})</div>
              {results.vocab.map((v) => (
                <div
                  key={v.id}
                  className="search-result-item"
                  onClick={() => onResultClick?.('vocab', v.id)}
                >
                  <div className="result-main">
                    <span className="result-word">{v.kanji || v.word}</span>
                    <span className="result-hiragana">{v.hiragana}</span>
                  </div>
                  <div className="result-meaning">{v.meaning}</div>
                </div>
              ))}
            </div>
          )}

          {results.kanji.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">🈳 Kanji ({results.kanji.length})</div>
              {results.kanji.map((k) => (
                <div
                  key={k.id}
                  className="search-result-item"
                  onClick={() => onResultClick?.('kanji', k.id)}
                >
                  <div className="result-main">
                    <span className="result-kanji">{k.character}</span>
                    <span className="result-meaning">{k.meaning}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.grammar.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">📖 Ngữ pháp ({results.grammar.length})</div>
              {results.grammar.map((g) => (
                <div
                  key={g.id}
                  className="search-result-item"
                  onClick={() => onResultClick?.('grammar', g.id)}
                >
                  <div className="result-main">
                    <span className="result-pattern">{g.pattern}</span>
                  </div>
                  <div className="result-meaning">{g.meaning}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && searchTerm && totalResults === 0 && (
        <div className="search-results">
          <div className="search-no-results">
            <span>🔍</span>
            <p>Không tìm thấy kết quả</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

