import { useEffect, useState } from 'react';
import '../styles/animated-character.css';

interface AnimatedCharacterProps {
  isSpeaking?: boolean;
  character?: 'waiter' | 'shopkeeper' | 'friend' | 'teacher' | 'student';
}

const AnimatedCharacter = ({ isSpeaking = false, character = 'teacher' }: AnimatedCharacterProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSpeaking) {
      setIsAnimating(true);
    } else {
      // Keep animation for a bit after speaking stops
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking]);

  return (
    <div className={`character-wrapper ${isAnimating ? 'speaking' : ''} character-${character}`}>
      <div className="background-circle">
        <div className="border-circle" id="one"></div>
        <div className="border-circle" id="two"></div>
        
        <div className="body"></div>
        
        <div className="head">
          <div className="hair-main">
            <div className="hair-top"></div>
            <div className="hair-bottom"></div>
          </div>
          <div className="sideburn" id="left"></div>
          <div className="sideburn" id="right"></div>
          
          <div className="face"></div>
          
          <div className="ear" id="left"></div>
          <div className="ear" id="right"></div>
          
          <div className="eye-shadow" id="left">
            <div className="eyebrow"></div>
            <div className="eye"></div>
          </div>
          <div className="eye-shadow" id="right">
            <div className="eyebrow"></div>
            <div className="eye"></div>
          </div>
          
          <div className="nose"></div>
          <div className="mouth"></div>
        </div>
        
        <div className="triangle-light"></div>
        <div className="triangle-dark"></div>
      </div>
      
      <div className="music-note" id="one">♪</div>
      <div className="music-note" id="two">♫</div>
    </div>
  );
};

export default AnimatedCharacter;
