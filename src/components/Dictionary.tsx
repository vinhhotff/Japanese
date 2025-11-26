import { useState, useEffect, useMemo, useCallback } from 'react';
import { searchWord, searchKanji } from '../services/jishoService';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';
import { useDebounce } from '../hooks/useDebounce';
import { searchCache, getCacheKey } from '../utils/searchCache';
import { saveWord, isWordSaved, removeSavedWord, getSavedWords, SavedWord } from '../utils/savedWords';
import DictionaryResult from './DictionaryResult';
import '../App.css';

const Dictionary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'word' | 'kanji'>('word');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Debounce search term để tránh search quá nhiều lần
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 500);

  // Auto search khi debounced term thay đổi
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setResults([]);
      setError(null);
      return;
    }

    performSearch(debouncedSearchTerm, searchType);
  }, [debouncedSearchTerm, searchType]);

  const performSearch = useCallback(async (term: string, type: 'word' | 'kanji') => {
    // Check cache first
    const cacheKey = getCacheKey(term, type);
    const cachedResults = searchCache.get(cacheKey);
    
    if (cachedResults) {
      console.log('Using cached results for:', term);
      setResults(cachedResults);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      console.log('Searching for:', term, 'Type:', type);
      
      let data;
      const startTime = performance.now();
      
      if (type === 'word') {
        data = await searchWord(term);
      } else {
        data = await searchKanji(term);
      }
      
      const endTime = performance.now();
      console.log(`Search completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log('Search results:', data);
      
      if (data && data.length > 0) {
        // Cache the results
        searchCache.set(cacheKey, data);
        setResults(data);
      } else {
        setError('Không tìm thấy kết quả. Vui lòng thử từ khóa khác.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi tra từ';
      setError(errorMessage);
      
      // Show more details in console for debugging
      if (err.message?.includes('CORS') || err.message?.includes('Failed to fetch')) {
        console.warn('CORS error detected. Jisho API may block direct browser requests.');
        console.warn('Consider using a CORS proxy or backend API.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      setError('Vui lòng nhập từ cần tra');
      return;
    }
    performSearch(searchTerm.trim(), searchType);
  }, [searchTerm, searchType, performSearch]);

  const handleSpeak = useCallback(async (text: string, id: string) => {
    if (!isSpeechSynthesisSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm');
      return;
    }

    setSpeakingId(id);
    try {
      await speakText(text);
    } catch (error) {
      console.error('Error speaking:', error);
    } finally {
      setSpeakingId(null);
    }
  }, []);

  const handleSaveWord = useCallback((item: any) => {
    try {
      const japanese = item.japanese?.[0];
      const sense = item.senses?.[0];
      
      if (!japanese || !sense) {
        alert('Không thể lưu từ này');
        return;
      }

      const savedWord: SavedWord = {
        id: item.slug || `${japanese.word || japanese.reading}-${Date.now()}`,
        word: japanese.word || japanese.reading || '',
        kanji: japanese.word || undefined,
        hiragana: japanese.reading || undefined,
        reading: japanese.reading || undefined,
        meanings: sense.english_definitions || [],
        savedAt: new Date().toISOString(),
        type: japanese.word ? 'kanji' : 'word'
      };

      if (isWordSaved(savedWord.id)) {
        removeSavedWord(savedWord.id);
        alert('Đã xóa khỏi danh sách học sau');
      } else {
        saveWord(savedWord);
        alert('Đã thêm vào danh sách học sau');
      }
    } catch (error) {
      console.error('Error saving word:', error);
      alert('Có lỗi xảy ra khi lưu từ');
    }
  }, []);

  const handleAddToLesson = useCallback((item: any) => {
    handleSaveWord(item);
  }, [handleSaveWord]);

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Từ điển Tiếng Nhật
        </h1>
        <p>Tra từ vựng và kanji từ Jisho.org</p>
      </div>

      <div className="dictionary-search">
        <div className="search-type-selector">
          <button
            className={`type-btn ${searchType === 'word' ? 'active' : ''}`}
            onClick={() => setSearchType('word')}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Từ vựng
          </button>
          <button
            className={`type-btn ${searchType === 'kanji' ? 'active' : ''}`}
            onClick={() => setSearchType('kanji')}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Kanji
          </button>
        </div>

        <div className="search-input-group">
          <div className="search-input-wrapper">
            <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="dictionary-input"
              placeholder={searchType === 'word' ? 'Nhập từ vựng cần tra...' : 'Nhập kanji cần tra...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSearch} 
            disabled={loading || !searchTerm.trim()}
          >
            {loading ? (
              <>
                <svg className="spinner-icon" style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang tìm...
              </>
            ) : (
              <>
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="dictionary-results">
          <div className="results-header">
            <h2>Kết quả tìm kiếm ({results.length})</h2>
          </div>

          {results.map((item, index) => (
            <DictionaryResult
              key={`${item.slug || index}-${index}`}
              item={item}
              index={index}
              speakingId={speakingId}
              onSpeak={handleSpeak}
              onAddToLesson={handleAddToLesson}
            />
          ))}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner">⏳</div>
          <p>Đang tìm kiếm...</p>
        </div>
      )}

      {!loading && results.length === 0 && searchTerm && !error && (
        <div className="no-results">
          <p>Không tìm thấy kết quả cho "{searchTerm}"</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả
          </p>
        </div>
      )}

      {!loading && !searchTerm && results.length === 0 && !error && (
        <div className="empty-search-state">
          <svg style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Nhập từ vựng hoặc kanji để bắt đầu tra cứu</p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Ví dụ: こんにちは, 学生, 私
          </p>
        </div>
      )}
    </div>
  );
};

export default Dictionary;

