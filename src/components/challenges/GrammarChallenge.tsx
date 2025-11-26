import { useState, useEffect } from 'react';
import { getGrammar } from '../../services/supabaseService';
import '../../App.css';

interface GrammarChallengeProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const GrammarChallenge = ({ onComplete, onClose }: GrammarChallengeProps) => {
  const [grammars, setGrammars] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Array<{
    grammar: any;
    options: string[];
    correctIndex: number;
  }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadGrammars();
  }, []);

  const loadGrammars = async () => {
    try {
      const allGrammar = await getGrammar();
      const shuffled = allGrammar.sort(() => Math.random() - 0.5).slice(0, 5);
      setGrammars(shuffled);

      // Generate questions with fixed options (shuffle once)
      const generatedQuestions = shuffled.map((grammar, index) => {
        const otherGrammars = shuffled.filter((g, i) => i !== index).slice(0, 3);
        const correctAnswer = grammar.meaning;
        const options = [
          grammar.meaning,
          ...otherGrammars.map(g => g.meaning)
        ];
        
        // Shuffle options using Fisher-Yates algorithm
        const shuffledOptions = [...options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        
        // Find the new index of correct answer after shuffle
        const correctIndex = shuffledOptions.findIndex(opt => opt === correctAnswer);
        
        return {
          grammar,
          options: shuffledOptions,
          correctIndex
        };
      });

      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error loading grammar:', error);
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentGrammar = currentQuestion?.grammar;
  const options = currentQuestion?.options || [];
  const correctAnswerIndex = currentQuestion?.correctIndex ?? -1;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === correctAnswerIndex) {
      setScore(prevScore => prevScore + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
      const finalScore = score + (selectedAnswer === correctAnswerIndex ? 1 : 0);
      onComplete(finalScore * 10);
    }
  };

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="challenge-result">
        <div className="result-icon">🎉</div>
        <h2>Hoàn thành!</h2>
        <div className="result-score">
          <div className="score-number">{score}/{questions.length}</div>
          <div className="score-percentage">{percentage}%</div>
        </div>
        <div className="result-points">+{score * 10} điểm</div>
        <button className="btn btn-primary" onClick={onClose}>
          Đóng
        </button>
      </div>
    );
  }

  if (!currentGrammar) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="challenge-content">
      <h2>Thử thách Ngữ pháp</h2>
      <div className="challenge-progress">
        Câu {currentIndex + 1} / {questions.length}
      </div>

      <div className="challenge-question">
        <div className="question-text">
          <span className="grammar-pattern">{currentGrammar.pattern}</span>
        </div>
        <p className="question-prompt">Nghĩa của mẫu câu này là gì?</p>
      </div>

      <div className="challenge-options">
        {options.map((option, index) => {
          let className = 'option-button';
          if (showResult) {
            if (index === correctAnswerIndex) {
              className += ' correct';
            } else if (index === selectedAnswer && index !== correctAnswerIndex) {
              className += ' incorrect';
            }
          } else if (selectedAnswer === index) {
            className += ' selected';
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="challenge-feedback">
          {selectedAnswer === correctAnswerIndex ? (
            <div className="feedback-correct">✅ Đúng rồi!</div>
          ) : (
            <div className="feedback-incorrect">
              ❌ Sai rồi. Đáp án đúng: {currentGrammar.meaning}
            </div>
          )}
          {currentGrammar.explanation && (
            <div className="grammar-explanation">
              <strong>Giải thích:</strong> {currentGrammar.explanation}
            </div>
          )}
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? 'Câu tiếp theo →' : 'Hoàn thành'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GrammarChallenge;

