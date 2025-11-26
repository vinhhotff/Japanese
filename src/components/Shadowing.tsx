import { useState, useRef, useEffect } from 'react';
import { ListeningExercise } from '../types';
import { speakText } from '../utils/speech';
import '../App.css';

interface ShadowingProps {
  listening: ListeningExercise[];
}

const Shadowing = ({ listening }: ShadowingProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [sentences, setSentences] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentExercise = listening[currentIndex];

  useEffect(() => {
    if (currentExercise?.transcript) {
      // Split transcript into sentences
      const splitSentences = currentExercise.transcript
        .split(/[。！？]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      setSentences(splitSentences);
      setCurrentSentence(0);
    }
  }, [currentExercise]);

  const handlePlaySentence = async (sentence: string) => {
    setIsPlaying(true);
    try {
      await speakText(sentence);
    } catch (error) {
      console.error('Error speaking:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleNextSentence = () => {
    if (currentSentence < sentences.length - 1) {
      setCurrentSentence(currentSentence + 1);
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentence > 0) {
      setCurrentSentence(currentSentence - 1);
    }
  };

  const handleNextExercise = () => {
    if (currentIndex < listening.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSentence(0);
    } else {
      setCurrentIndex(0);
      setCurrentSentence(0);
    }
  };

  const handlePreviousExercise = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentSentence(0);
    }
  };

  if (listening.length === 0) {
    return (
      <div className="section-container">
        <div className="empty-state">
          <p>Chưa có bài nghe để luyện shadowing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container shadowing-section">
      <div className="section-header">
        <div className="section-icon">
          <svg style={{ width: '40px', height: '40px', color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </div>
        <div>
          <h2>Shadowing</h2>
          <p>Luyện nói theo từng câu trong bài nghe</p>
        </div>
      </div>

      <div className="shadowing-content">
        <div className="shadowing-header">
          <h3>{currentExercise?.title}</h3>
          <div className="shadowing-progress">
            Bài {currentIndex + 1} / {listening.length}
          </div>
        </div>

        {currentExercise?.image_url && (
          <div className="shadowing-image">
            <img src={currentExercise.image_url} alt={currentExercise.title} />
          </div>
        )}

        {currentExercise?.audio_url && (
          <div className="shadowing-audio">
            <audio ref={audioRef} controls className="audio-player">
              <source src={currentExercise.audio_url} type="audio/mpeg" />
            </audio>
          </div>
        )}

        <div className="shadowing-sentences">
          <div className="sentence-navigation">
            <button
              className="btn btn-nav-small"
              onClick={handlePreviousSentence}
              disabled={currentSentence === 0}
            >
              ←
            </button>
            <span className="sentence-counter">
              Câu {currentSentence + 1} / {sentences.length}
            </span>
            <button
              className="btn btn-nav-small"
              onClick={handleNextSentence}
              disabled={currentSentence === sentences.length - 1}
            >
              →
            </button>
          </div>

          {sentences[currentSentence] && (
            <div className="sentence-card">
              <div className="sentence-text">{sentences[currentSentence]}</div>
              <button
                className="btn btn-play-sentence"
                onClick={() => handlePlaySentence(sentences[currentSentence])}
                disabled={isPlaying}
              >
                {isPlaying ? '⏸️ Đang phát...' : '🔊 Phát câu này'}
              </button>
              <div className="sentence-instruction">
                💡 Nghe và lặp lại câu này nhiều lần cho đến khi phát âm giống
              </div>
            </div>
          )}

          <div className="full-transcript">
            <h4>Toàn bộ transcript:</h4>
            <div className="transcript-text">{currentExercise?.transcript}</div>
          </div>
        </div>

        <div className="shadowing-navigation">
          <button
            className="btn btn-nav"
            onClick={handlePreviousExercise}
            disabled={currentIndex === 0}
          >
            ← Bài trước
          </button>
          <button className="btn btn-nav" onClick={handleNextExercise}>
            Bài sau →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shadowing;

