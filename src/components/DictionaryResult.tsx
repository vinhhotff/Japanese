import { memo, useState, useEffect } from 'react';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';
import { isWordSaved } from '../utils/savedWords';

interface DictionaryResultProps {
  item: any;
  index: number;
  speakingId: string | null;
  onSpeak: (text: string, id: string, lang?: string) => void;
  onAddToLesson: (item: any) => void;
  language?: 'japanese' | 'chinese';
}

const DictionaryResult = memo(({ item, index, speakingId, onSpeak, onAddToLesson, language = 'japanese' }: DictionaryResultProps) => {
  const id = `result-${index}`;
  const japanese = item.japanese?.[0];
  const wordId = item.slug || `${japanese?.word || japanese?.reading || ''}-${index}`;
  const [isSaved, setIsSaved] = useState(isWordSaved(wordId));

  useEffect(() => {
    setIsSaved(isWordSaved(wordId));
  }, [wordId, onAddToLesson]);

  // Check if this is Chinese data
  const isChinese = language === 'chinese' || !!item.chinese;
  
  // Safety check for data structure
  if (!item || !item.senses || item.senses.length === 0) {
    return null;
  }
  
  const sense = item.senses[0];
  
  // Chinese data
  const chinese = item.chinese;
  const hanzi = chinese?.hanzi || chinese?.simplified || '';
  const pinyin = chinese?.pinyin || '';
  const traditional = chinese?.traditional || '';
  
  // Japanese data (only use if NOT Chinese)
  const reading = !isChinese && japanese?.reading ? japanese.reading : '';

  const handleSaveClick = () => {
    onAddToLesson(item);
    // Update state after a short delay to ensure localStorage is updated
    setTimeout(() => {
      setIsSaved(isWordSaved(wordId));
    }, 100);
  };

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '2px solid var(--border-color)',
      transition: 'all 0.3s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
      e.currentTarget.style.borderColor = 'var(--primary-color)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      e.currentTarget.style.borderColor = 'var(--border-color)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      {/* Header with Word and Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          {/* Hanzi (Chinese) or Kanji (Japanese) */}
          {((isChinese && hanzi) || (!isChinese && japanese?.word)) && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              <span style={{ 
                fontSize: '3rem', 
                fontWeight: '800', 
                color: isChinese ? '#ef4444' : '#8b5cf6',
                lineHeight: 1
              }}>
                {isChinese ? hanzi : (japanese?.word || '')}
              </span>
              <button
                onClick={() => onSpeak(isChinese ? hanzi : japanese.word, `${id}-kanji`, language)}
                title="Phát âm"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: `2px solid ${isChinese ? '#ef4444' : 'var(--primary-color)'}`,
                  background: speakingId === `${id}-kanji` ? (isChinese ? '#ef4444' : 'var(--primary-color)') : (isChinese ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-light)'),
                  color: speakingId === `${id}-kanji` ? 'white' : (isChinese ? '#ef4444' : 'var(--primary-color)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (speakingId !== `${id}-kanji`) {
                    e.currentTarget.style.background = isChinese ? 'rgba(239, 68, 68, 0.2)' : 'var(--primary-light)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (speakingId !== `${id}-kanji`) {
                    e.currentTarget.style.background = isChinese ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-light)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Reading (Pinyin for Chinese, Hiragana for Japanese) */}
          {((isChinese && pinyin) || (!isChinese && reading)) && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem',
                  fontWeight: '600'
                }}>
                  {isChinese ? 'Pinyin (拼音)' : 'Hiragana (ひらがな)'}
                </div>
                <span style={{ 
                  fontSize: '1.5rem', 
                  color: isChinese ? '#ef4444' : 'var(--text-secondary)',
                  fontFamily: isChinese ? 'system-ui' : 'serif',
                  fontWeight: '500'
                }}>
                  {isChinese ? pinyin : reading}
                </span>
              </div>
              <button
                onClick={() => onSpeak(isChinese ? hanzi : reading, `${id}-reading`, language)}
                title="Phát âm"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: `2px solid ${isChinese ? '#f59e0b' : 'var(--secondary-color)'}`,
                  background: speakingId === `${id}-reading` ? (isChinese ? '#f59e0b' : 'var(--secondary-color)') : (isChinese ? 'rgba(245, 158, 11, 0.1)' : 'var(--secondary-light)'),
                  color: speakingId === `${id}-reading` ? 'white' : (isChinese ? '#f59e0b' : 'var(--secondary-color)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (speakingId !== `${id}-reading`) {
                  e.currentTarget.style.background = isChinese ? 'rgba(245, 158, 11, 0.2)' : 'var(--secondary-light)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (speakingId !== `${id}-reading`) {
                  e.currentTarget.style.background = isChinese ? 'rgba(245, 158, 11, 0.1)' : 'var(--secondary-light)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            </div>
          )}

          {/* Traditional Chinese (if different from simplified) */}
          {isChinese && traditional && traditional !== hanzi && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '8px',
              marginBottom: '0.5rem'
            }}>
              <span style={{ 
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginRight: '0.5rem',
                fontWeight: '600'
              }}>
                Phồn thể:
              </span>
              <span style={{ 
                fontSize: '1.25rem',
                color: '#ef4444',
                fontWeight: '600'
              }}>
                {traditional}
              </span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {item.is_common && (
            <span style={{
              padding: '0.5rem 1rem',
              background: 'var(--warning-light)',
              color: 'var(--warning-color)',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '700',
              border: '2px solid var(--warning-color)'
            }}>
              ⭐ Thông dụng
            </span>
          )}
          {item.jlpt && item.jlpt.length > 0 && (
            <span style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary-light)',
              color: 'var(--primary-color)',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '700',
              border: '2px solid var(--primary-color)'
            }}>
              {item.jlpt[0]}
            </span>
          )}
        </div>
      </div>

      {/* Meanings */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          fontSize: '1.125rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>📖</span>
          Nghĩa:
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {item.senses.map((senseItem: any, senseIndex: number) => (
            <div key={senseIndex} style={{
              padding: '1rem 1.25rem',
              background: 'var(--card-bg-hover)',
              borderRadius: '12px',
              borderLeft: '4px solid var(--primary-color)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-bg)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card-bg-hover)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                <span style={{ 
                  fontWeight: '700', 
                  color: 'var(--primary-color)',
                  fontSize: '1.125rem',
                  minWidth: '28px'
                }}>
                  {senseIndex + 1}.
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: 'var(--text-primary)', 
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    marginBottom: '0.25rem'
                  }}>
                    {senseItem.english_definitions?.join(', ') || 'N/A'}
                  </div>
                  {senseItem.parts_of_speech && senseItem.parts_of_speech.length > 0 && (
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.875rem',
                      fontStyle: 'italic'
                    }}>
                      ({senseItem.parts_of_speech.join(', ')})
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      {sense?.tags && sense.tags.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sense.tags.map((tag: string, tagIndex: number) => (
              <span key={tagIndex} style={{
                padding: '0.375rem 0.875rem',
                background: 'var(--card-bg-hover)',
                borderRadius: '20px',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ 
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-color)'
      }}>
        <button
          onClick={handleSaveClick}
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: isSaved 
              ? 'var(--success-gradient)' 
              : 'var(--primary-gradient)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isSaved 
              ? '0 8px 20px rgba(16, 185, 129, 0.4)'
              : '0 8px 20px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isSaved ? (
            <>
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
              Đã lưu vào danh sách
            </>
          ) : (
            <>
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              Lưu để học sau
            </>
          )}
        </button>
      </div>
    </div>
  );
});

DictionaryResult.displayName = 'DictionaryResult';

export default DictionaryResult;

