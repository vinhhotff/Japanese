import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchWord, searchKanji } from '../services/jishoService';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';
import { useDebounce } from '../hooks/useDebounce';
import { searchCache, getCacheKey } from '../utils/searchCache';
import { saveWord, isWordSaved, removeSavedWord, getSavedWords, SavedWord } from '../utils/savedWords';
import { logger } from '../utils/logger';
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
      logger.log('Using cached results for:', term);
      setResults(cachedResults);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      logger.log('Searching for:', term, 'Type:', type);
      
      let data;
      const startTime = performance.now();
      
      if (type === 'word') {
        data = await searchWord(term);
      } else {
        data = await searchKanji(term);
      }
      
      const endTime = performance.now();
      logger.log(`Search completed in ${(endTime - startTime).toFixed(2)}ms`);
      logger.log('Search results:', data);
      
      if (data && data.length > 0) {
        // Cache the results
        searchCache.set(cacheKey, data);
        setResults(data);
      } else {
        setError('Không tìm thấy kết quả. Vui lòng thử từ khóa khác.');
      }
    } catch (err: any) {
      logger.error('Search error:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi tra từ';
      setError(errorMessage);
      
      // Show more details in console for debugging
      if (err.message?.includes('CORS') || err.message?.includes('Failed to fetch')) {
        logger.warn('CORS error detected. Jisho API may block direct browser requests.');
        logger.warn('Consider using a CORS proxy or backend API.');
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
      <Link to="/" className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về trang chủ
      </Link>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          🔍 Từ điển Tiếng Nhật
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          Tra từ vựng và kanji từ Jisho.org
        </p>
      </div>

      {/* Search Box */}
      <div style={{ 
        background: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '2rem',
        border: '2px solid #e5e7eb'
      }}>
        {/* Search Type Selector */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setSearchType('word')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              border: searchType === 'word' ? '3px solid var(--primary-color)' : '2px solid var(--border-color)',
              background: searchType === 'word' ? 'var(--primary-light)' : 'var(--card-bg-hover)',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
              color: searchType === 'word' ? 'var(--primary-color)' : 'var(--text-secondary)'
            }}
          >
            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Từ vựng
          </button>
          <button
            onClick={() => setSearchType('kanji')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              border: searchType === 'kanji' ? '3px solid var(--secondary-color)' : '2px solid var(--border-color)',
              background: searchType === 'kanji' ? 'var(--secondary-light)' : 'var(--card-bg-hover)',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
              color: searchType === 'kanji' ? 'var(--secondary-color)' : 'var(--text-secondary)'
            }}
          >
            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Kanji
          </button>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg style={{
              position: 'absolute',
              left: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              color: '#9ca3af',
              pointerEvents: 'none'
            }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchType === 'word' ? 'Nhập từ vựng cần tra... (VD: こんにちは, 学生)' : 'Nhập kanji cần tra... (VD: 学, 日)'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
              autoComplete="off"
              spellCheck="false"
              style={{
                width: '100%',
                padding: '1.25rem 1.25rem 1.25rem 3.5rem',
                border: '2px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '1.125rem',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-shadow)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <button 
            onClick={handleSearch} 
            disabled={loading || !searchTerm.trim()}
            style={{
              padding: '1.25rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: loading || !searchTerm.trim() 
                ? 'var(--text-secondary)' 
                : 'var(--primary-gradient)',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: loading || !searchTerm.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!loading && searchTerm.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <>
                <svg className="spinner-icon" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang tìm...
              </>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'var(--danger-light)',
          border: '2px solid var(--danger-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div>
            <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '0.25rem' }}>
              Không tìm thấy kết quả
            </div>
            <div style={{ color: '#dc2626' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Kết quả tìm kiếm
            </h2>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary-light)',
              color: 'var(--primary-color)',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '700'
            }}>
              {results.length} kết quả
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
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
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--card-bg)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>
            🔍
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Đang tìm kiếm...
          </p>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && searchTerm && !error && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--card-bg)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤔</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Không tìm thấy kết quả
          </h3>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Không tìm thấy kết quả cho "<strong>{searchTerm}</strong>"
          </p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searchTerm && results.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--card-bg)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <svg style={{ 
            width: '100px', 
            height: '100px', 
            margin: '0 auto 1.5rem', 
            color: '#3b82f6',
            strokeWidth: '1.5'
          }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Bắt đầu tra từ
          </h3>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Nhập từ vựng hoặc kanji để bắt đầu tra cứu
          </p>
          <div style={{ 
            display: 'inline-block',
            padding: '1rem 1.5rem',
            background: 'var(--card-bg-hover)',
            borderRadius: '12px',
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Ví dụ:</strong> こんにちは, 学生, 私, 食べる
          </div>
        </div>
      )}
    </div>
  );
};

export default Dictionary;

