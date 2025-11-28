import { useState, useRef, useEffect } from 'react';
import '../App.css';

interface RecordingData {
  id: string;
  text: string;
  audioUrl: string;
  timestamp: Date;
  score?: number;
}

interface PracticePhrase {
  id: string;
  japanese: string;
  hiragana: string;
  vietnamese: string;
  audioUrl?: string;
  level: string;
}

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [selectedPhrase, setSelectedPhrase] = useState<PracticePhrase | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const practicePhrases: PracticePhrase[] = [
    {
      id: '1',
      japanese: 'おはようございます',
      hiragana: 'おはようございます',
      vietnamese: 'Chào buổi sáng',
      level: 'N5'
    },
    {
      id: '2',
      japanese: 'ありがとうございます',
      hiragana: 'ありがとうございます',
      vietnamese: 'Cảm ơn',
      level: 'N5'
    },
    {
      id: '3',
      japanese: 'すみません',
      hiragana: 'すみません',
      vietnamese: 'Xin lỗi / Làm ơn',
      level: 'N5'
    },
    {
      id: '4',
      japanese: 'お元気ですか',
      hiragana: 'おげんきですか',
      vietnamese: 'Bạn khỏe không?',
      level: 'N5'
    },
    {
      id: '5',
      japanese: 'いただきます',
      hiragana: 'いただきます',
      vietnamese: 'Tôi xin phép dùng bữa',
      level: 'N5'
    },
    {
      id: '6',
      japanese: 'ごちそうさまでした',
      hiragana: 'ごちそうさまでした',
      vietnamese: 'Cảm ơn bữa ăn ngon',
      level: 'N5'
    },
    {
      id: '7',
      japanese: 'お疲れ様でした',
      hiragana: 'おつかれさまでした',
      vietnamese: 'Bạn đã vất vả rồi',
      level: 'N4'
    },
    {
      id: '8',
      japanese: 'よろしくお願いします',
      hiragana: 'よろしくおねがいします',
      vietnamese: 'Rất mong được làm việc cùng',
      level: 'N4'
    }
  ];

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        const newRecording: RecordingData = {
          id: Date.now().toString(),
          text: selectedPhrase?.japanese || 'Recording',
          audioUrl: url,
          timestamp: new Date(),
          score: Math.floor(Math.random() * 30) + 70, // Mock score 70-100
        };

        setRecordings(prev => [newRecording, ...prev]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng cho phép quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const playRecording = (recording: RecordingData) => {
    if (audioRef.current) {
      if (playingId === recording.id) {
        audioRef.current.pause();
        setPlayingId(null);
      } else {
        audioRef.current.src = recording.audioUrl;
        audioRef.current.play();
        setPlayingId(recording.id);
      }
    }
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '#9ca3af';
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score?: number) => {
    if (!score) return 'Chưa đánh giá';
    if (score >= 90) return 'Xuất sắc';
    if (score >= 75) return 'Tốt';
    return 'Cần cải thiện';
  };

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Luyện Phát Âm
        </h1>
        <p>Ghi âm và cải thiện phát âm tiếng Nhật của bạn</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
          Chọn câu để luyện tập
        </h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {practicePhrases.map(phrase => (
            <div
              key={phrase.id}
              onClick={() => setSelectedPhrase(phrase)}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: selectedPhrase?.id === phrase.id ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                background: selectedPhrase?.id === phrase.id ? 'var(--primary-light)' : 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {phrase.japanese}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {phrase.hiragana}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    {phrase.vietnamese}
                  </div>
                </div>
                <span className={`badge badge-${phrase.level.toLowerCase()}`}>
                  {phrase.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPhrase && (
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ 
            padding: '2rem',
            background: 'var(--primary-light)',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '2px solid var(--primary-color)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
              {selectedPhrase.japanese}
            </div>
            <div style={{ fontSize: '1.125rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
              {selectedPhrase.hiragana}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              {selectedPhrase.vietnamese}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {!isRecording ? (
              <button 
                className="btn btn-primary"
                onClick={startRecording}
                style={{ 
                  padding: '1rem 2rem',
                  fontSize: '1.125rem',
                  background: 'var(--danger-gradient)'
                }}
              >
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                Bắt đầu ghi âm
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={stopRecording}
                style={{ 
                  padding: '1rem 2rem',
                  fontSize: '1.125rem',
                  background: 'var(--secondary-gradient)',
                  animation: 'pulse 1.5s infinite'
                }}
              >
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                </svg>
                Dừng ghi âm
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
          Bản ghi âm của bạn ({recordings.length})
        </h2>
        {recordings.length === 0 ? (
          <div className="empty-state">
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#9ca3af' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p>Chưa có bản ghi âm nào. Hãy chọn câu và bắt đầu luyện tập!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {recordings.map(recording => (
              <div
                key={recording.id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => playRecording(recording)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: 'none',
                      background: playingId === recording.id 
                        ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {playingId === recording.id ? (
                      <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg style={{ width: '24px', height: '24px', marginLeft: '3px' }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {recording.text}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {recording.timestamp.toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginRight: '1rem' }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700',
                      color: getScoreColor(recording.score)
                    }}>
                      {recording.score}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: getScoreColor(recording.score)
                    }}>
                      {getScoreLabel(recording.score)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRecording(recording.id)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--danger-light)',
                      color: 'var(--danger-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <div className="card" style={{ marginTop: '2rem', background: 'var(--warning-light)', border: '2px solid var(--warning-color)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <svg style={{ width: '32px', height: '32px', color: 'var(--warning-color)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h3 style={{ fontWeight: '700', color: 'var(--warning-color)', marginBottom: '0.5rem' }}>Mẹo luyện tập</h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.8', paddingLeft: '1.25rem' }}>
              <li>Nghe kỹ phát âm mẫu trước khi ghi âm</li>
              <li>Nói rõ ràng và với tốc độ vừa phải</li>
              <li>Luyện tập nhiều lần để cải thiện điểm số</li>
              <li>Chú ý đến ngữ điệu và trọng âm</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
