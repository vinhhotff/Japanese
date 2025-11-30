import { useEffect, useRef } from 'react';
import type { Language } from '../services/supabaseService.v2';
import '../styles/floating-characters.css';

interface FloatingCharactersProps {
  language: Language;
  count?: number;
}

const FloatingCharacters = ({ language, count = 20 }: FloatingCharactersProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const japaneseCharacters = [
    'あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ',
    'い', 'き', 'し', 'ち', 'に', 'ひ', 'み', 'り',
    'う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る',
    'え', 'け', 'せ', 'て', 'ね', 'へ', 'め', 'れ',
    'お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'を',
    '学', '日', '本', '語', '言', '書', '読', '聞', '話', '見'
  ];

  const chineseCharacters = [
    '你', '好', '学', '习', '中', '文', '汉', '字', '语', '言',
    '书', '写', '读', '听', '说', '看', '想', '知', '道', '会',
    '我', '们', '的', '是', '在', '有', '和', '了', '不', '人',
    '大', '小', '多', '少', '上', '下', '前', '后', '左', '右',
    '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'
  ];

  const characters = language === 'japanese' ? japaneseCharacters : chineseCharacters;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing characters
    containerRef.current.innerHTML = '';

    // Create floating characters
    for (let i = 0; i < count; i++) {
      const char = document.createElement('div');
      char.className = `floating-char char-${i + 1}`;
      char.textContent = characters[Math.floor(Math.random() * characters.length)];
      
      // Random position
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 15 + Math.random() * 10;
      const size = 20 + Math.random() * 30;
      
      char.style.left = `${left}%`;
      char.style.top = `${top}%`;
      char.style.animationDelay = `${delay}s`;
      char.style.animationDuration = `${duration}s`;
      char.style.fontSize = `${size}px`;
      char.style.opacity = `${0.3 + Math.random() * 0.4}`;
      
      containerRef.current.appendChild(char);
    }
  }, [language, count, characters]);

  return <div ref={containerRef} className="floating-characters-container" />;
};

export default FloatingCharacters;

