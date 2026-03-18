import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../App.css';
import { useAuth } from '../contexts/AuthContext';
import { compareJapaneseText, isSpeechRecognitionSupported, startSpeechRecognition } from '../utils/speech';
import { uploadAudioToFolder } from '../utils/fileUpload';
import { supabase } from '../config/supabase';

interface RecordingData {
  id: string;
  text: string;
  audioUrl: string;
  timestamp: Date;
  // Technical metrics (not "pronunciation score")
  durationSec?: number;
  rms?: number;
  speechDetected?: boolean;
  // ASR + scoring
  transcript?: string;
  confidence?: number;
  similarity?: number; // 0..100
  match?: boolean;
  differences?: string[];
  cloudUrl?: string;
}

interface EvaluationResult {
  transcript: string;
  confidence: number;
  similarity: number;
  isMatch: boolean;
  differences: string[];
}

interface PracticePhrase {
  id: string;
  text: string;
  pronunciation: string;
  vietnamese: string;
  audioUrl?: string;
  level: string;
}

const VoiceRecorder = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<'japanese' | 'chinese' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [selectedPhrase, setSelectedPhrase] = useState<PracticePhrase | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [speakingSample, setSpeakingSample] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopRecognitionRef = useRef<null | (() => void)>(null);

  const HISTORY_KEY = `speaking-practice-history:${user?.id || 'anon'}:${selectedLanguage || 'unknown'}`;

  // Call Edge Function for server-side ASR + scoring (best effort)
  const evaluateWithServer = useCallback(async (cloudUrl: string, targetText: string, targetLanguage: 'japanese' | 'chinese', userId: string, durationSec?: number): Promise<EvaluationResult | null> => {
    try {
      const edgeUrl = import.meta.env.VITE_SPEAKING_EVALUATE_URL;
      const edgeKey = import.meta.env.VITE_SPEAKING_EVALUATE_KEY;

      if (!edgeUrl || !edgeKey) {
        console.warn('Edge function not configured, skipping server evaluation');
        return null;
      }

      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${edgeKey}`,
        },
        body: JSON.stringify({
          audioUrl: cloudUrl,
          targetText,
          targetLanguage,
          userId,
          durationSec,
        }),
      });

      if (!response.ok) {
        console.warn('Edge function error:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.data) {
        return {
          transcript: data.data.transcript || '',
          confidence: data.data.confidence || 0,
          similarity: data.data.similarity || 0,
          isMatch: data.data.isMatch || false,
          differences: data.data.differences || [],
        };
      }
      return null;
    } catch (e) {
      console.warn('Edge function call failed:', e);
      return null;
    }
  }, []);

  // Handle language from URL parameter
  useEffect(() => {
    const lang = searchParams.get('lang');
    if (lang === 'japanese' || lang === 'chinese') {
      setSelectedLanguage(lang);
    }
  }, [searchParams]);

  const japanesePhrases: PracticePhrase[] = [
    {
      id: 'jp1',
      text: 'おはようございます',
      pronunciation: 'おはようございます',
      vietnamese: 'Chào buổi sáng',
      level: 'N5'
    },
    {
      id: 'jp2',
      text: 'ありがとうございます',
      pronunciation: 'ありがとうございます',
      vietnamese: 'Cảm ơn',
      level: 'N5'
    },
    {
      id: 'jp3',
      text: 'すみません',
      pronunciation: 'すみません',
      vietnamese: 'Xin lỗi / Làm ơn',
      level: 'N5'
    },
    {
      id: 'jp4',
      text: 'お元気ですか',
      pronunciation: 'おげんきですか',
      vietnamese: 'Bạn khỏe không?',
      level: 'N5'
    },
    {
      id: 'jp5',
      text: 'いただきます',
      pronunciation: 'いただきます',
      vietnamese: 'Tôi xin phép dùng bữa',
      level: 'N5'
    },
    {
      id: 'jp6',
      text: 'ごちそうさま',
      pronunciation: 'ごちそうさまり',
      vietnamese: 'Cảm ơn vì bữa ăn',
      level: 'N5'
    }
  ];

  const chinesePhrases: PracticePhrase[] = [
    {
      id: 'cn1',
      text: '你好',
      pronunciation: 'Nǐ hǎo',
      vietnamese: 'Xin chào',
      level: 'HSK1'
    },
    {
      id: 'cn2',
      text: '谢谢',
      pronunciation: 'Xièxiè',
      vietnamese: 'Cảm ơn',
      level: 'HSK1'
    },
    {
      id: 'cn3',
      text: '对不起',
      pronunciation: 'Duìbuqǐ',
      vietnamese: 'Xin lỗi',
      level: 'HSK1'
    },
    {
      id: 'cn4',
      text: '你叫什么名字？',
      pronunciation: 'Nǐ jiào shénme míngzì?',
      vietnamese: 'Bạn tên là gì?',
      level: 'HSK1'
    },
    {
      id: 'cn5',
      text: '再见',
      pronunciation: 'Zàijiàn',
      vietnamese: 'Tạm biệt',
      level: 'HSK1'
    },
    {
      id: 'cn6',
      text: '我不客气',
      pronunciation: 'Wǒ bù kèqì',
      vietnamese: 'Đừng khách sáo',
      level: 'HSK1'
    }
  ];

  const currentPhrases = selectedLanguage === 'japanese' ? japanesePhrases : chinesePhrases;

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  // Update live timer while recording
  useEffect(() => {
    if (!isRecording || !recordingStartedAt) return;
    const t = window.setInterval(() => {
      setRecordingElapsedMs(Date.now() - recordingStartedAt);
    }, 100);
    return () => window.clearInterval(t);
  }, [isRecording, recordingStartedAt]);

  // Stop any TTS on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Load saved history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as any[];
      const restored: RecordingData[] = Array.isArray(parsed)
        ? parsed.map((r) => ({
          ...r,
          timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
          audioUrl: (typeof r.cloudUrl === 'string' && r.cloudUrl) ? r.cloudUrl : r.audioUrl,
        }))
        : [];
      setRecordings(restored);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [HISTORY_KEY]);

  // Persist history
  useEffect(() => {
    try {
      const serializable = recordings.map((r) => ({
        ...r,
        timestamp: r.timestamp?.toISOString?.() || new Date().toISOString(),
      }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(serializable.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [recordings, HISTORY_KEY]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      // Start speech recognition in parallel (if supported)
      if (isSpeechRecognitionSupported() && selectedPhrase) {
        try {
          setIsRecognizing(true);
          const stop = startSpeechRecognition(
            selectedLanguage === 'japanese' ? 'ja-JP' : 'zh-CN',
            (result) => {
              // We'll attach transcript to the newest recording on stop
              (stopRecognitionRef as any).current_last = result;
            },
            () => {
              setIsRecognizing(false);
            },
            () => {
              setIsRecognizing(false);
            }
          );
          stopRecognitionRef.current = stop;
        } catch {
          setIsRecognizing(false);
        }
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        const metrics = await analyzeRecordingAudio(blob);

        // Stop recognition if still running
        try {
          stopRecognitionRef.current?.();
        } catch {
          // ignore
        }
        const asrResult = (stopRecognitionRef as any).current_last as { transcript: string; confidence: number } | undefined;
        (stopRecognitionRef as any).current_last = undefined;

        const expected = selectedPhrase?.text || '';
        const actual = asrResult?.transcript || '';
        const cmp = expected && actual
          ? compareJapaneseText(expected, actual)
          : { match: false, similarity: 0, differences: [] as string[] };

        // Upload audio to Supabase Storage for persistent history (best-effort)
        let cloudUrl: string | undefined;
        try {
          const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          const folder = user?.id
            ? `voice-recorder/${user.id}/${selectedLanguage || 'unknown'}`
            : `voice-recorder/anon/${selectedLanguage || 'unknown'}`;
          const up = await uploadAudioToFolder(file, folder);
          if (up.url) cloudUrl = up.url;
        } catch {
          // ignore upload failures (offline / missing bucket / permissions)
        }

        // Try server-side ASR if cloud URL available and user logged in
        let serverResult: EvaluationResult | null = null;
        if (cloudUrl && user?.id && selectedPhrase && selectedLanguage) {
          setIsEvaluating(true);
          serverResult = await evaluateWithServer(
            cloudUrl,
            selectedPhrase.text,
            selectedLanguage,
            user.id,
            metrics.durationSec
          );
          setIsEvaluating(false);
        }

        // Use server result if available, otherwise fallback to browser ASR
        const finalTranscript = serverResult?.transcript || asrResult?.transcript || '';
        const finalConfidence = serverResult?.confidence ?? asrResult?.confidence;
        const finalSimilarity = serverResult?.similarity ?? cmp.similarity;
        const finalMatch = serverResult?.isMatch ?? cmp.match;
        const finalDifferences = serverResult?.differences ?? cmp.differences;

        const newRecording: RecordingData = {
          id: Date.now().toString(),
          text: selectedPhrase?.text || 'Recording',
          audioUrl: cloudUrl || url,
          timestamp: new Date(),
          durationSec: metrics.durationSec,
          rms: metrics.rms,
          speechDetected: metrics.speechDetected,
          transcript: finalTranscript,
          confidence: finalConfidence,
          similarity: finalSimilarity,
          match: finalMatch,
          differences: finalDifferences,
          cloudUrl,
        };

        setRecordings(prev => [newRecording, ...prev]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingStartedAt(Date.now());
      setRecordingElapsedMs(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng cho phép quyền truy cập.');
    }
  };

  const analyzeRecordingAudio = async (blob: Blob): Promise<{
    durationSec: number;
    rms: number;
    speechDetected: boolean;
  }> => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);

      // Compute RMS (root mean square) as loudness proxy
      let sumSquares = 0;
      const step = Math.max(1, Math.floor(channelData.length / 50000)); // subsample for speed
      let count = 0;
      for (let i = 0; i < channelData.length; i += step) {
        const s = channelData[i];
        sumSquares += s * s;
        count++;
      }
      const rms = Math.sqrt(sumSquares / Math.max(1, count));

      const duration = audioBuffer.duration; // seconds

      // Speech detected heuristic: non-trivial duration and not near-silence
      const speechDetected = isFinite(rms) && duration >= 0.6 && rms >= 0.01;

      try {
        await audioCtx.close?.();
      } catch {
        // ignore
      }

      return { durationSec: duration, rms, speechDetected };
    } catch (e) {
      console.warn('Audio analysis failed.', e);
      return { durationSec: 0, rms: 0, speechDetected: false };
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingStartedAt(null);
      try {
        stopRecognitionRef.current?.();
      } catch {
        // ignore
      }
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

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatSec = (sec?: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const total = Math.floor(sec);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSpeechBadge = (speechDetected?: boolean) => {
    if (speechDetected === undefined) return { label: 'Chưa phân tích', color: '#9ca3af' };
    if (!speechDetected) return { label: 'Không phát hiện giọng nói', color: '#ef4444' };
    return { label: 'Có giọng nói', color: '#10b981' };
  };

  const getSimilarityColor = (similarity?: number) => {
    if (similarity === undefined || similarity === null) return '#9ca3af';
    if (similarity >= 90) return '#10b981';
    if (similarity >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const speakSample = async () => {
    if (!selectedPhrase) return;
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt không hỗ trợ phát âm mẫu (TTS).');
      return;
    }
    // Cancel any existing speech first for predictable behavior
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(selectedPhrase.text);
    utter.lang = selectedLanguage === 'japanese' ? 'ja-JP' : 'zh-CN';
    utter.rate = 0.9;
    utter.pitch = 1.0;

    utter.onstart = () => setSpeakingSample(true);
    utter.onend = () => setSpeakingSample(false);
    utter.onerror = () => setSpeakingSample(false);

    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Luyện Phát Âm {selectedLanguage === 'japanese' ? 'Tiếng Nhật' : selectedLanguage === 'chinese' ? 'Tiếng Trung' : ''}
        </h1>
        <p>Ghi âm và cải thiện kỹ năng nói của bạn</p>
      </div>

      {!selectedLanguage ? (
        <div style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          maxWidth: '1000px',
          margin: '3rem auto',
          flexWrap: 'wrap'
        }}>
          {/* Japanese Card */}
          <div
            className="lang-card-premium jp-style"
            onClick={() => setSelectedLanguage('japanese')}
          >
            <div className="lang-box">JP</div>
            <div className="lang-info">
              <span className="lang-name">Tiếng Nhật</span>
              <span className="lang-native">日本語</span>
              <span className="lang-desc">Phát âm JLPT N5-N2</span>
            </div>
            <div className="lang-indicator"></div>
          </div>

          {/* Chinese Card */}
          <div
            className="lang-card-premium cn-style"
            onClick={() => setSelectedLanguage('chinese')}
          >
            <div className="lang-box">CN</div>
            <div className="lang-info">
              <span className="lang-name">Tiếng Trung</span>
              <span className="lang-native">中文</span>
              <span className="lang-desc">Phát âm HSK 1-6</span>
            </div>
            <div className="lang-indicator"></div>
          </div>
        </div>

      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button className="btn btn-outline" onClick={() => {
              setSelectedLanguage(null);
              setSelectedPhrase(null);
            }}>
              Thay đổi ngôn ngữ
            </button>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
              Chọn câu để luyện tập
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {currentPhrases.map(phrase => (
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
                        {phrase.text}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {phrase.pronunciation}
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
                  {selectedPhrase.text}
                </div>
                <div style={{ fontSize: '1.125rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                  {selectedPhrase.pronunciation}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                  {selectedPhrase.vietnamese}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline"
                  onClick={speakSample}
                  disabled={speakingSample || isRecording}
                  style={{ padding: '1rem 1.5rem', fontSize: '1.05rem' }}
                >
                  {speakingSample ? 'Đang phát mẫu...' : 'Nghe mẫu'}
                </button>
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
                    Dừng ghi âm ({formatMs(recordingElapsedMs)})
                  </button>
                )}
              </div>
              {isRecording && (
                <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>
                  {isEvaluating && '⏳ Đang chấm bài (server-side ASR)...'}
                  {isRecognizing && 'Đang nhận diện giọng nói... (ASR trình duyệt)'}
                  {!isEvaluating && !isRecognizing && (isSpeechRecognitionSupported()
                    ? 'ASR sẵn sàng (trình duyệt)'
                    : 'Trình duyệt không hỗ trợ ASR, chỉ lưu audio')}
                </div>
              )}
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
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Thời lượng: <strong>{formatSec(recording.durationSec)}</strong>
                          {typeof recording.rms === 'number' && isFinite(recording.rms) ? (
                            <> • Âm lượng (RMS): <strong>{recording.rms.toFixed(3)}</strong></>
                          ) : null}
                        </div>
                        {recording.transcript ? (
                          <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.5rem' }}>
                            Bạn nói (ASR): <strong>{recording.transcript}</strong>
                            {typeof recording.confidence === 'number' ? (
                              <> • Độ tin cậy: <strong>{Math.round(recording.confidence * 100)}%</strong></>
                            ) : null}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                            Chưa có transcript (ASR)
                          </div>
                        )}
                        {typeof recording.similarity === 'number' ? (
                          <div style={{ fontSize: '0.875rem', marginTop: '0.35rem', color: getSimilarityColor(recording.similarity) }}>
                            Độ giống câu mục tiêu: <strong>{recording.similarity}%</strong>
                            {recording.match ? ' • Đạt' : ' • Chưa đạt'}
                          </div>
                        ) : null}
                        {recording.differences && recording.differences.length > 0 ? (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.35rem' }}>
                            {recording.differences.map((d, i) => (
                              <div key={i}>{d}</div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div style={{ textAlign: 'center', marginRight: '1rem' }}>
                        {(() => {
                          const badge = getSpeechBadge(recording.speechDetected);
                          return (
                            <>
                              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: badge.color }}>
                                {badge.label}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: badge.color }}>
                                (chỉ số kỹ thuật)
                              </div>
                            </>
                          );
                        })()}
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
                  <li>Bấm <strong>Nghe mẫu</strong> để nghe phát âm tham khảo (TTS)</li>
                  <li>Nói rõ ràng và với tốc độ vừa phải</li>
                  <li>Ghi âm nhiều lần và so sánh bản ghi của chính bạn</li>
                  <li>Chú ý đến ngữ điệu và trọng âm</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceRecorder;
