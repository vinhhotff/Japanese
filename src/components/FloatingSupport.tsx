import { useState } from 'react';

const SUPPORT_CONTACTS = [
  {
    id: 'zalo',
    label: 'Zalo',
    href: 'https://zalo.me/0909123456',
    color: '#0068FF',
    bg: 'linear-gradient(135deg, #0068FF, #004FC4)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      </svg>
    ),
  },
  {
    id: 'messenger',
    label: 'Messenger',
    href: 'https://m.me/japaneselearning',
    color: '#0084FF',
    bg: 'linear-gradient(135deg, #0084FF, #006ACC)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.99.587 3.853 1.592 5.445L2 22l4.555-1.592A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm3.771 13.447l-2.594-.798a1.016 1.016 0 00-.761.006l-.96.438a.994.994 0 01-.771 0l-.96-.438a1.016 1.016 0 00-.761-.006l-2.594.798C6.024 15.772 5 13.997 5 12c0-3.866 3.134-7 7-7s7 3.134 7 7c0 1.997-1.024 3.772-2.229 5.447zM10 10c-.553 0-1-.447-1-1s.447-1 1-1 1 .447 1 1-.447 1-1 1zm4 0c-.553 0-1-.447-1-1s.447-1 1-1 1 .447 1 1-.447 1-1 1z" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    href: 'mailto:support@japanese-learning.com',
    color: '#DC2626',
    bg: 'linear-gradient(135deg, #DC2626, #B91C1C)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="20" height="20">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function FloatingSupport() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="floating-support">
      {/* Expand/collapse toggle */}
      <button
        className={`floating-support-toggle ${expanded ? 'active' : ''}`}
        onClick={() => setExpanded(prev => !prev)}
        aria-label="Hỗ trợ"
        title="Hỗ trợ"
      >
        <span className="floating-support-toggle-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
        <span className="floating-support-toggle-label">Hỗ trợ</span>
      </button>

      {/* Contact bubbles */}
      <div className={`floating-support-bubbles ${expanded ? 'visible' : ''}`}>
        {SUPPORT_CONTACTS.map(contact => (
          <a
            key={contact.id}
            href={contact.href}
            target={contact.id === 'email' ? '_self' : '_blank'}
            rel="noopener noreferrer"
            className={`floating-support-bubble ${contact.id}`}
            title={contact.label}
            onClick={() => setExpanded(false)}
          >
            <span className="floating-support-bubble-icon">{contact.icon}</span>
            <span className="floating-support-bubble-label">{contact.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
