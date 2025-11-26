import { useEffect, useState } from 'react';
import '../App.css';

const Celebration = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="celebration-overlay">
      <div className="celebration-content">
        <div className="celebration-icon">🎉</div>
        <h2>Chúc mừng!</h2>
        <p>Bạn đã hoàn thành tất cả thử thách hôm nay!</p>
        <div className="celebration-confetti">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][
                  Math.floor(Math.random() * 5)
                ]
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Celebration;

