import { useState } from 'react';
import { Link } from 'react-router-dom';
import Dictionary from './Dictionary';
import type { Language } from '../services/supabaseService.v2';
import '../App.css';

const AllDictionary = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('japanese');

  return (
    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      {/* Language Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem'
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
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
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
                ? '0 4px 12px rgba(139, 92, 246, 0.3)' 
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
                ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
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
                ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
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
