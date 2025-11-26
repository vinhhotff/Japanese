import { memo, useState, useEffect } from 'react';
import { speakText, isSpeechSynthesisSupported } from '../utils/speech';
import { isWordSaved } from '../utils/savedWords';

interface DictionaryResultProps {
  item: any;
  index: number;
  speakingId: string | null;
  onSpeak: (text: string, id: string) => void;
  onAddToLesson: (item: any) => void;
}

const DictionaryResult = memo(({ item, index, speakingId, onSpeak, onAddToLesson }: DictionaryResultProps) => {
  const id = `result-${index}`;
  const japanese = item.japanese?.[0];
  const wordId = item.slug || `${japanese?.word || japanese?.reading || ''}-${index}`;
  const [isSaved, setIsSaved] = useState(isWordSaved(wordId));

  useEffect(() => {
    setIsSaved(isWordSaved(wordId));
  }, [wordId, onAddToLesson]);

  // Safety check for data structure
  if (!item || !item.japanese || item.japanese.length === 0 || !item.senses || item.senses.length === 0) {
    return null;
  }
  
  const sense = item.senses[0];
  const reading = japanese?.reading || '';

  const handleSaveClick = () => {
    onAddToLesson(item);
    // Update state after a short delay to ensure localStorage is updated
    setTimeout(() => {
      setIsSaved(isWordSaved(wordId));
    }, 100);
  };

  return (
    <div className="dictionary-result-card">
      <div className="result-main">
        <div className="result-word-section">
          {japanese?.word && (
            <div className="result-kanji">
              {japanese.word}
              <button
                className={`btn-speak-small ${speakingId === `${id}-kanji` ? 'speaking' : ''}`}
                onClick={() => onSpeak(japanese.word, `${id}-kanji`)}
                title="Phát âm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
          )}
          <div className="result-reading">
            {reading}
            <button
              className={`btn-speak-small ${speakingId === `${id}-reading` ? 'speaking' : ''}`}
              onClick={() => onSpeak(reading, `${id}-reading`)}
              title="Phát âm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="result-info">
          {item.is_common && (
            <span className="badge badge-common">Thông dụng</span>
          )}
          {item.jlpt && item.jlpt.length > 0 && (
            <span className={`badge badge-${item.jlpt[0].toLowerCase()}`}>
              {item.jlpt[0]}
            </span>
          )}
        </div>
      </div>

      <div className="result-meanings">
        <div className="meanings-label">Nghĩa:</div>
        <ul className="meanings-list">
          {item.senses.map((senseItem: any, senseIndex: number) => (
            <li key={senseIndex} className="meaning-item">
              <span className="meaning-number">{senseIndex + 1}.</span>
              <span className="meaning-text">
                {senseItem.english_definitions?.join(', ') || 'N/A'}
              </span>
              {senseItem.parts_of_speech && senseItem.parts_of_speech.length > 0 && (
                <span className="meaning-pos">
                  ({senseItem.parts_of_speech.join(', ')})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {sense?.tags && sense.tags.length > 0 && (
        <div className="result-tags">
          {sense.tags.map((tag: string, tagIndex: number) => (
            <span key={tagIndex} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="result-actions">
        <button
          className={`btn ${isSaved ? 'btn-saved' : 'btn-secondary'}`}
          onClick={handleSaveClick}
        >
          {isSaved ? (
            <>
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" />
              </svg>
              Đã lưu
            </>
          ) : (
            <>
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

