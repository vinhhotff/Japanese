import { useState, useEffect } from 'react';
import { getAvailableVoices, logAvailableVoices, speakTextSafely } from '../utils/speech';

const VoiceDebugger = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [testText, setTestText] = useState('こんにちは、元気ですか？');

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = getAvailableVoices();
      setVoices(availableVoices);
      logAvailableVoices();
    };

    // Load voices immediately
    loadVoices();

    // Also load when voices change (some browsers load voices asynchronously)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTestVoice = async () => {
    if (selectedVoice) {
      await speakTextSafely(testText, { voiceName: selectedVoice });
    } else {
      await speakTextSafely(testText);
    }
  };

  const japaneseVoices = voices.filter(v => v.lang.startsWith('ja'));
  const otherVoices = voices.filter(v => !v.lang.startsWith('ja'));

  return (
    <div style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', margin: '1rem' }}>
      <h3>🎤 Voice Debugger</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Total voices available: {voices.length}</strong>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Japanese voices: {japaneseVoices.length}</strong>
        {japaneseVoices.length === 0 && (
          <div style={{ color: 'var(--danger-color)', marginTop: '0.5rem' }}>
            ⚠️ No Japanese voices found. This is why you're getting the "No suitable voice" error.
          </div>
        )}
        {japaneseVoices.map((voice, index) => (
          <div key={index} style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
            • {voice.name} ({voice.lang}) - {voice.localService ? 'Local' : 'Remote'}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Test Text:</label>
        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '0.5rem', 
            margin: '0.5rem 0',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Select Voice:</label>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '0.5rem', 
            margin: '0.5rem 0',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}
        >
          <option value="">Default (Auto-select)</option>
          {voices.map((voice, index) => (
            <option key={index} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleTestVoice}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        🔊 Test Voice
      </button>

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        <strong>Solutions if no Japanese voices:</strong>
        <ul>
          <li>Install Japanese language pack in Windows/macOS</li>
          <li>Use Chrome/Edge (better voice support)</li>
          <li>The app will fallback to default voice safely</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceDebugger;