import { useState } from 'react';
import { Link } from 'react-router-dom';
import Dictionary from './Dictionary';
import type { Language } from '../services/supabaseService.v2';
import '../App.css';
import '../styles/spaced-repetition.css';

const AllDictionary = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('japanese');

  return (
    <div className="container" data-language={selectedLanguage} style={{ position: 'relative', zIndex: 1 }}>
      {/* Language Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'inline-flex',
          gap: '0.5rem',
          padding: '0.5rem',
          background: 'var(--card-bg)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)',
          border: '2px solid var(--border-color)'
        }}>
          <button
            onClick={() => setSelectedLanguage('japanese')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: selectedLanguage === 'japanese' 
                ? 'linear-gradient(135deg, #c41e3a 0%, #ff69b4 100%)' 
                : 'transparent',
              color: selectedLanguage === 'japanese' ? 'white' : 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: selectedLanguage === 'japanese' 
                ? '0 4px 12px rgba(196, 30, 58, 0.3)' 
                : 'none'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🇯🇵</span>
            <span>Từ điển tiếng Nhật</span>
          </button>

          <button
            onClick={() => setSelectedLanguage('chinese')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: selectedLanguage === 'chinese' 
                ? 'linear-gradient(135deg, #dc143c 0%, #ffd700 100%)' 
                : 'transparent',
              color: selectedLanguage === 'chinese' ? 'white' : 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: selectedLanguage === 'chinese' 
                ? '0 4px 12px rgba(220, 20, 60, 0.3)' 
                : 'none'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🇨🇳</span>
            <span>Từ điển tiếng Trung</span>
          </button>
        </div>
      </div>

      {/* Dictionary Component */}
      <Dictionary language={selectedLanguage} />
    </div>
  );
};

export default AllDictionary;
