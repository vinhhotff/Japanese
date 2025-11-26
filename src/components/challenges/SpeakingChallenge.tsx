import { useState, useRef, useEffect } from 'react';
import { getVocabulary } from '../../services/supabaseService';
import { startSpeechRecognition, isSpeechRecognitionSupported, compareJapaneseText, speakText } from '../../utils/speech';
import '../../App.css';

interface SpeakingChallengeProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const SpeakingChallenge = ({ onComplete, onClose }: SpeakingChallengeProps) => {
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<{ match: boolean; similarity: number } | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadVocabularies();
  }, []);

  const loadVocabularies = async () => {
    try {
      const allVocab = await getVocabulary();
      if (!allVocab || allVocab.length === 0) {
        alert('Không có từ vựng nào. Vui lòng thêm từ vựng trong Admin Panel.');
        return;
      }
      const shuffled = allVocab.sort(() => Math.random() - 0.5).slice(0, 5);
      setVocabularies(shuffled);
    } catch (error) {
      console.error('Error loading vocabularies:', error);
      alert('Lỗi khi tải từ vựng: ' + (error as Error).message);
    }
  };

  const currentVocab = vocabularies[currentIndex];

  const handleStartRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    setIsRecording(true);
    setTranscript('');
    setResult(null);

    const stopRecording = startSpeechRecognition(
      'ja-JP',
      (recognitionResult) => {
        setTranscript(recognitionResult.transcript);
        setIsRecording(false);

        if (currentVocab) {
          const expectedTexts = [
            currentVocab.hiragana,
            currentVocab.kanji || currentVocab.word,
            currentVocab.word
          ].filter(Boolean) as string[];

          let bestMatch = { match: false, similarity: 0 };
          for (const expected of expectedTexts) {
            const comparison = compareJapaneseText(expected, recognitionResult.transcript);
            if (comparison.similarity > bestMatch.similarity) {
              bestMatch = comparison;
            }
          }

          setResult(bestMatch);
          if (bestMatch.similarity >= 70) {
            setScore(prevScore => prevScore + 1);
          }
        }
      },
      (error) => {
        alert(error);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    stopRecordingRef.current = stopRecording;
  };

  const handleStopRecording = () => {
    if (stopRecordingRef.current) {
      stopRecordingRef.current();
      stopRecordingRef.current = null;
    }
    setIsRecording(false);
  };

  const handleNext = () => {
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTranscript('');
      setResult(null);
    } else {
      setCompleted(true);
      // Calculate final score including current answer
      const finalScore = score + (result && result.similarity >= 70 ? 1 : 0);
      onComplete(finalScore * 20);
    }
  };

  const handlePlayAudio = async () => {
    if (currentVocab) {
      await speakText(currentVocab.hiragana || currentVocab.word);
    }
  };

  if (completed) {
    return (
      <div className="challenge-result">
        <div className="result-icon">🎉</div>
        <h2>Hoàn thành!</h2>
        <div className="result-score">
          <div className="score-number">{score}/{vocabularies.length}</div>
        </div>
        <div className="result-points">+{score * 20} điểm</div>
        <button className="btn btn-primary" onClick={onClose}>
          Đóng
        </button>
      </div>
    );
  }

  if (vocabularies.length === 0) {
    return (
      <div className="challenge-content">
        <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Không có từ vựng nào.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Vui lòng thêm từ vựng trong Admin Panel.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1rem' }}>
          Đóng
        </button>
      </div>
    );
  }

  if (!currentVocab) {
    return (
      <div className="challenge-content">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="challenge-content">
      <h2>Thử thách Nói</h2>
      <div className="challenge-progress">
        Từ {currentIndex + 1} / {vocabularies.length}
      </div>

      <div className="challenge-question">
        <div className="question-text">
          <span className="vocab-display">
            {currentVocab.kanji && (
              <span className="vocab-kanji-large">{currentVocab.kanji}</span>
            )}
            <span className="vocab-hiragana-large">{currentVocab.hiragana}</span>
          </span>
          <button className="btn-play-audio" onClick={handlePlayAudio}>
            🔊
          </button>
        </div>
        <p className="question-prompt">Hãy phát âm từ này</p>
        <p className="vocab-meaning">{currentVocab.meaning}</p>
      </div>

      <div className="challenge-recording">
        {!isRecording ? (
          <button className="btn btn-record" onClick={handleStartRecording}>
            🎤 Bắt đầu ghi âm
          </button>
        ) : (
          <button className="btn btn-stop" onClick={handleStopRecording}>
            🔴 Dừng ghi âm
          </button>
        )}

        {transcript && (
          <div className="recording-result">
            <p>Bạn đã nói: <strong>{transcript}</strong></p>
          </div>
        )}

        {result && (
          <div className={`challenge-feedback ${result.match ? 'correct' : 'incorrect'}`}>
            {result.match ? (
              <div>✅ Phát âm tốt! Độ tương đồng: {Math.round(result.similarity)}%</div>
            ) : (
              <div>⚠️ Cần cải thiện. Độ tương đồng: {Math.round(result.similarity)}%</div>
            )}
          </div>
        )}
      </div>

      {result && (
        <div className="challenge-actions">
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIndex < vocabularies.length - 1 ? 'Từ tiếp theo →' : 'Hoàn thành'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeakingChallenge;

