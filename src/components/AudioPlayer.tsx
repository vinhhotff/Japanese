import { useState, useRef, useEffect } from 'react';
import '../App.css';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

const AudioPlayer = ({ src, title }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setError(null);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setError('Không thể tải file audio. Vui lòng kiểm tra URL.');
      setIsPlaying(false);
    });

    // Try to load the audio
    audio.src = src;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setError(null);
        })
        .catch((err) => {
          console.error('Play error:', err);
          setError('Không thể phát audio. Vui lòng thử lại.');
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="custom-audio-player">
      {title && <div className="audio-title">{title}</div>}
      
      {error && (
        <div className="audio-error">
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      <div className="audio-controls">
        <button 
          className="audio-play-button" 
          onClick={togglePlay}
          disabled={!!error}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>

        <div className="audio-progress-container">
          <input
            type="range"
            className="audio-progress"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={!!error}
          />
          <div className="audio-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {!src.startsWith('http') && !error && (
        <div className="audio-warning">
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          File audio cần URL hợp lệ (http/https)
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
