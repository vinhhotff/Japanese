import { useState, useRef, useEffect } from 'react';
import { Vocabulary } from '../types';
import { speakText } from '../utils/speech';
import '../App.css';

interface PronunciationPracticeProps {
  vocabulary: Vocabulary[];
}

const PronunciationPractice = ({ vocabulary }: PronunciationPracticeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  const current = vocabulary[currentIndex];

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ja-JP';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        checkPronunciation(result);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setFeedback('Lỗi nhận diện giọng nói. Vui lòng thử lại.');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const checkPronunciation = (spokenText: string) => {
    const target = current.kanji || current.word;
    const targetHiragana = current.hiragana;

    // Simple similarity check
    const similarity = calculateSimilarity(spokenText, target);
    const hiraganaMatch = spokenText.includes(targetHiragana);

    let calculatedScore = 0;
    let feedbackText = '';

    if (similarity > 0.8 || hiraganaMatch) {
      calculatedScore = 100;
      feedbackText = 'Xuất sắc! Phát âm của bạn rất chính xác! 🎉';
    } else if (similarity > 0.6) {
      calculatedScore = 75;
      feedbackText = 'Tốt lắm! Còn một chút nữa là hoàn hảo! 👍';
    } else if (similarity > 0.4) {
      calculatedScore = 50;
      feedbackText = 'Khá tốt! Hãy thử lại để cải thiện thêm. 💪';
    } else {
      calculatedScore = 25;
      feedbackText = 'Cần luyện tập thêm. Hãy nghe và thử lại! 📖';
    }

    setScore(calculatedScore);
    setFeedback(feedbackText);
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng cho phép quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const playRecording = () => {
    if (recordedAudio) {
      const audio = new Audio(URL.createObjectURL(recordedAudio));
      audio.play();
    }
  };

  const playExample = async () => {
    await speakText(current.kanji || current.word);
  };

  const nextWord = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetState();
    }
  };

  const previousWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetState();
    }
  };

  const resetState = () => {
    setRecordedAudio(null);
    setTranscript('');
    setScore(null);
    setFeedback('');
  };

  if (!current) {
    return (
      <div className="pronunciation-container">
        <div className="empty-state">
          <p>Không có từ vựng để luyện tập</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pronunciation-container">
      <div className="pronunciation-header">
        <h3>Luyện phát âm</h3>
        <div className="progress-indicator">
          {currentIndex + 1} / {vocabulary.length}
        </div>
      </div>

      <div className="pronunciation-card">
        <div className="word-display">
          <div className="word-kanji">{current.kanji || current.word}</div>
          <div className="word-hiragana">{current.hiragana}</div>
          <div className="word-meaning">{current.meaning}</div>
        </div>

        <button className="btn btn-secondary" onClick={playExample}>
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Nghe mẫu
        </button>

        <div className="recording-section">
          {!isRecording ? (
            <button className="btn btn-record" onClick={startRecording}>
              <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Bắt đầu ghi âm
            </button>
          ) : (
            <button className="btn btn-recording" onClick={stopRecording}>
              <svg className="recording-pulse" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8" />
              </svg>
              Dừng ghi âm
            </button>
          )}

          {recordedAudio && (
            <button className="btn btn-outline" onClick={playRecording}>
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nghe lại
            </button>
          )}
        </div>

        {transcript && (
          <div className="transcript-result">
            <div className="transcript-label">Bạn đã nói:</div>
            <div className="transcript-text">{transcript}</div>
          </div>
        )}

        {score !== null && (
          <div className={`score-display ${score >= 75 ? 'excellent' : score >= 50 ? 'good' : 'needs-improvement'}`}>
            <div className="score-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8"
                  strokeDasharray={`${score * 2.827} 282.7`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="score-number">{score}</div>
            </div>
            <div className="score-feedback">{feedback}</div>
          </div>
        )}
      </div>

      <div className="pronunciation-navigation">
        <button 
          className="btn btn-outline" 
          onClick={previousWord}
          disabled={currentIndex === 0}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Trước
        </button>
        <button 
          className="btn btn-outline" 
          onClick={nextWord}
          disabled={currentIndex === vocabulary.length - 1}
        >
          Sau
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PronunciationPractice;
