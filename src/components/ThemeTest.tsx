import { useTheme } from '../contexts/ThemeContext';

const ThemeTest = () => {
  const { theme } = useTheme();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '1rem',
      background: 'var(--card-bg)',
      border: '2px solid var(--border-color)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999,
      fontSize: '0.875rem',
      color: 'var(--text-primary)'
    }}>
      <div><strong>Theme Test</strong></div>
      <div>Current: {theme}</div>
      <div>BG: <span style={{ background: 'var(--bg-color)', padding: '2px 8px', border: '1px solid var(--border-color)' }}>var(--bg-color)</span></div>
      <div>Card: <span style={{ background: 'var(--card-bg)', padding: '2px 8px', border: '1px solid var(--border-color)' }}>var(--card-bg)</span></div>
      <div>Text: <span style={{ color: 'var(--text-primary)' }}>var(--text-primary)</span></div>
    </div>
  );
};

export default ThemeTest;
