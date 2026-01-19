import React, { useEffect, useRef, useState } from 'react';
import '../styles/floating-physics.css';

interface Character {
    id: number;
    text: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
}

interface FloatingCharactersPhysicsProps {
    language: 'japanese' | 'chinese';
}

const JAPANESE_CHARS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', '学', '日'];
const CHINESE_CHARS = ['你', '好', '学', '习', '中', '文', '汉', '字', '语', '言', '书', '写'];

const FloatingCharactersPhysics: React.FC<FloatingCharactersPhysicsProps> = ({ language }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const charactersRef = useRef<Character[]>([]);
    const requestRef = useRef<number>();
    const [renderCount, setRenderCount] = useState(0); // Trigger re-render for positions

    const initCharacters = () => {
        const chars = language === 'japanese' ? JAPANESE_CHARS : CHINESE_CHARS;
        const count = 12;
        const initialChars: Character[] = [];
        const width = window.innerWidth;
        const height = window.innerHeight;

        for (let i = 0; i < count; i++) {
            const radius = Math.random() * 30 + 40; // 40px to 70px
            initialChars.push({
                id: i,
                text: chars[i % chars.length],
                x: Math.random() * (width - radius * 2) + radius,
                y: Math.random() * (height - radius * 2) + radius,
                vx: (Math.random() - 0.5) * 1.5, // Slower velocity
                vy: (Math.random() - 0.5) * 1.5,
                radius: radius,
                opacity: Math.random() * 0.3 + 0.2 // 0.2 to 0.5
            });
        }
        charactersRef.current = initialChars;
    };

    const updatePhysics = () => {
        const chars = charactersRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Update Positions
        chars.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;

            // 2. Boundary Collisions
            if (c.x - c.radius < 0) {
                c.x = c.radius;
                c.vx *= -1;
            } else if (c.x + c.radius > width) {
                c.x = width - c.radius;
                c.vx *= -1;
            }

            if (c.y - c.radius < 0) {
                c.y = c.radius;
                c.vy *= -1;
            } else if (c.y + c.radius > height) {
                c.y = height - c.radius;
                c.vy *= -1;
            }
        });

        // 3. Circle-to-Circle Collisions (Collision detection and response)
        for (let i = 0; i < chars.length; i++) {
            for (let j = i + 1; j < chars.length; j++) {
                const c1 = chars[i];
                const c2 = chars[j];

                const dx = c2.x - c1.x;
                const dy = c2.y - c1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = c1.radius + c2.radius;

                if (distance < minDistance) {
                    // Resolve overlap (static resolution)
                    const overlap = minDistance - distance;
                    const nx = dx / distance; // Normal X
                    const ny = dy / distance; // Normal Y

                    c1.x -= nx * (overlap / 2);
                    c1.y -= ny * (overlap / 2);
                    c2.x += nx * (overlap / 2);
                    c2.y += ny * (overlap / 2);

                    // Resolve velocity (dynamic resolution - elastic collision)
                    // Simple bounce: Swap normal velocities component
                    const relativeVelocityX = c2.vx - c1.vx;
                    const relativeVelocityY = c2.vy - c1.vy;
                    const dotProduct = relativeVelocityX * nx + relativeVelocityY * ny;

                    if (dotProduct < 0) {
                        const impulse = (2 * dotProduct) / (1 + 1); // Assuming equal mass = 1
                        c1.vx += impulse * nx;
                        c1.vy += impulse * ny;
                        c2.vx -= impulse * nx;
                        c2.vy -= impulse * ny;
                    }
                }
            }
        }

        setRenderCount(prev => prev + 1);
        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        initCharacters();
        requestRef.current = requestAnimationFrame(updatePhysics);

        window.addEventListener('resize', initCharacters);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', initCharacters);
        };
    }, [language]);

    return (
        <div className="physics-characters-container" ref={containerRef}>
            {charactersRef.current.map((char) => (
                <div
                    key={char.id}
                    className={`physics-char ${language === 'japanese' ? 'jp-physics-char' : 'cn-physics-char'}`}
                    style={{
                        transform: `translate3d(${char.x - char.radius}px, ${char.y - char.radius}px, 0)`,
                        width: `${char.radius * 2}px`,
                        height: `${char.radius * 2}px`,
                        fontSize: `${char.radius * 1.2}px`,
                        opacity: char.opacity
                    }}
                >
                    {char.text}
                </div>
            ))}
        </div>
    );
};

export default FloatingCharactersPhysics;
