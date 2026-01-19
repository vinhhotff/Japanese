import React, { useEffect, useRef } from 'react';
import '../styles/floating-elements.css';

interface FloatingElementsProps {
    language: 'japanese' | 'chinese';
}

const JAPANESE_CHARS = ['あ', 'か', 'さ', 'た', '学', '日', '本', '語'];
const CHINESE_CHARS = ['你', '好', '学', '习', '中', '文', '语', '言'];

const FloatingElements: React.FC<FloatingElementsProps> = ({ language }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const container = containerRef.current;
        const chars = language === 'japanese' ? JAPANESE_CHARS : CHINESE_CHARS;

        // Floating characters - 8 characters, bolder
        for (let i = 0; i < 8; i++) {
            const charElement = document.createElement('div');
            charElement.className = 'floating-char-element';
            charElement.textContent = chars[i % chars.length];

            const left = 5 + (i * 12) + Math.random() * 8;
            const delay = Math.random() * 5;
            const duration = 18 + Math.random() * 10;
            const size = 32 + Math.random() * 24;

            charElement.style.cssText = `
                left: ${left}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                font-size: ${size}px;
                opacity: ${0.25 + Math.random() * 0.2};
                color: ${language === 'japanese' ? '#c41e3a' : '#dc143c'};
                font-weight: 500;
            `;
            container.appendChild(charElement);
        }

        // Japanese: Sakura petals falling
        if (language === 'japanese') {
            for (let i = 0; i < 6; i++) {
                const sakura = document.createElement('div');
                sakura.className = 'floating-sakura';

                const left = 8 + (i * 15) + Math.random() * 10;
                const delay = i * 1 + Math.random() * 2;
                const duration = 12 + Math.random() * 8;
                const size = 20 + Math.random() * 14;

                sakura.style.cssText = `
                    left: ${left}%;
                    animation-delay: ${delay}s;
                    animation-duration: ${duration}s;
                    width: ${size}px;
                    height: ${size}px;
                `;

                sakura.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 1 .3 1.8.7 2.5-.8.3-1.7.8-2.2 1.5C6.5 10.5 6 12 6 14c0 2.5 1.5 4.5 4 5.5 0 1 .5 2.5 2 2.5s2-1.5 2-2.5c2.5-1 4-3 4-5.5 0-2-0.5-3.5-1.5-4.5-.5-.7-1.4-1.2-2.2-1.5.4-.7.7-1.5.7-2.5 0-2-1.5-3.5-3-3.5z"/>
                    </svg>
                `;

                container.appendChild(sakura);
            }
        }

        // Chinese: Lanterns floating up
        if (language === 'chinese') {
            for (let i = 0; i < 5; i++) {
                const lantern = document.createElement('div');
                lantern.className = 'floating-lantern';

                const left = 5 + (i * 20) + Math.random() * 10;
                const delay = i * 1.5 + Math.random() * 2;
                const duration = 15 + Math.random() * 8;
                const size = 32 + Math.random() * 16;

                lantern.style.cssText = `
                    left: ${left}%;
                    animation-delay: ${delay}s;
                    animation-duration: ${duration}s;
                    width: ${size}px;
                    height: ${size * 1.3}px;
                `;

                lantern.innerHTML = `
                    <svg viewBox="0 0 24 32" fill="currentColor">
                        <ellipse cx="12" cy="4" rx="3" ry="1.5" fill="#8B0000"/>
                        <rect x="11" y="4" width="2" height="2" fill="#FFD700"/>
                        <ellipse cx="12" cy="16" rx="7" ry="9" fill="#ff4444"/>
                        <ellipse cx="12" cy="16" rx="5" ry="7" fill="#ff6b6b"/>
                        <rect x="9" y="25" width="6" height="1.5" rx="0.5" fill="#FFD700"/>
                        <line x1="10" y1="27" x2="10" y2="30" stroke="#FFD700" stroke-width="0.5"/>
                        <line x1="12" y1="27" x2="12" y2="31" stroke="#FFD700" stroke-width="0.5"/>
                        <line x1="14" y1="27" x2="14" y2="30" stroke="#FFD700" stroke-width="0.5"/>
                    </svg>
                `;

                container.appendChild(lantern);
            }
        }
    }, [language]);

    return (
        <div
            ref={containerRef}
            className={`floating-elements-container ${language}`}
            aria-hidden="true"
        />
    );
};

export default FloatingElements;
