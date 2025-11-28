import { useState, useEffect } from 'react';
import { QuizQuestion, Vocabulary, Kanji, Grammar } from '../types';
import '../App.css';

interface QuizProps {
  vocabulary: Vocabulary[];
  kanji: Kanji[];
  grammar: Grammar[];
  onComplete?: (score: number, total: number) => void;
}

const Quiz = ({ vocabulary, kanji, grammar, onComplete }: QuizProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [vocabulary, kanji, grammar]);

  const generateQuestions = () => {
    const generated: QuizQuestion[] = [];

    // Questions from vocabulary
    vocabulary.slice(0, 5).forEach((vocab) => {
      const otherVocabs = vocabulary.filter(v => v.id !== vocab.id).slice(0, 3);
      const correctAnswer = vocab.meaning;
      const options = [
        vocab.meaning,
        ...otherVocabs.map(v => v.meaning)
      ];
      // Shuffle options using Fisher-Yates algorithm for better randomness
      const shuffledOptions = [...options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      // Find the new index of correct answer after shuffle
      const correctIndex = shuffledOptions.findIndex(opt => opt === correctAnswer);
      
      generated.push({
        id: `vocab-${vocab.id}`,
        question: `"${vocab.kanji || vocab.word}" (${vocab.hiragana}) có nghĩa là gì?`,
        type: 'vocabulary',
        options: shuffledOptions,
        correctAnswer: correctIndex,
        explanation: `"${vocab.kanji || vocab.word}" có nghĩa là "${vocab.meaning}"`
      });
    });

    // Questions from kanji
    kanji.slice(0, 3).forEach((k) => {
      const otherKanji = kanji.filter(kan => kan.id !== k.id).slice(0, 3);
      const correctAnswer = k.meaning;
      const options = [
        k.meaning,
        ...otherKanji.map(kan => kan.meaning)
      ];
      // Shuffle options using Fisher-Yates algorithm for better randomness
      const shuffledOptions = [...options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      // Find the new index of correct answer after shuffle
      const correctIndex = shuffledOptions.findIndex(opt => opt === correctAnswer);
      
      generated.push({
        id: `kanji-${k.id}`,
        question: `Kanji "${k.character}" có nghĩa là gì?`,
        type: 'kanji',
        options: shuffledOptions,
        correctAnswer: correctIndex,
        explanation: `Kanji "${k.character}" có nghĩa là "${k.meaning}"`
      });
    });

    // Questions from grammar
    grammar.slice(0, 2).forEach((g) => {
      const otherGrammar = grammar.filter(gram => gram.id !== g.id).slice(0, 3);
      const correctAnswer = g.meaning;
      const options = [
        g.meaning,
        ...otherGrammar.map(gram => gram.meaning)
      ];
      // Shuffle options using Fisher-Yates algorithm for better randomness
      const shuffledOptions = [...options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      // Find the new index of correct answer after shuffle
      const correctIndex = shuffledOptions.findIndex(opt => opt === correctAnswer);
      
      generated.push({
        id: `grammar-${g.id}`,
        question: `Mẫu câu "${g.pattern}" có nghĩa là gì?`,
        type: 'grammar',
        options: shuffledOptions,
        correctAnswer: correctIndex,
        explanation: g.explanation
      });
    });

    // Shuffle questions
    setQuestions(generated.sort(() => Math.random() - 0.5).slice(0, 10));
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const current = questions[currentIndex];
    const isCorrect = selectedAnswer === current.correctAnswer;

    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Last question - complete quiz
      setQuizComplete(true);
      if (onComplete) {
        // Score is already updated in handleSubmit, no need to recalculate
        onComplete(score, questions.length);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizComplete(false);
    generateQuestions();
  };

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const performanceClass = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'needs-improvement';
    
    return (
      <div className="quiz-container">
        <div className="quiz-result">
          <svg className="result-icon" style={{ width: '100px', height: '100px', color: percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {percentage >= 80 ? (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : percentage >= 60 ? (
              <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            )}
          </svg>
          <h2>Hoàn thành Quiz!</h2>
          <div className="score-display">
            <div className="score-number">{score}/{questions.length}</div>
            <div className="score-label">Câu đúng</div>
            <div className={`score-percentage ${performanceClass}`}>
              {percentage}%
            </div>
          </div>
          <div className="result-message">
            {percentage >= 80 
              ? 'Xuất sắc! Bạn đã nắm vững kiến thức! 🎉' 
              : percentage >= 60 
              ? 'Tốt! Hãy tiếp tục cố gắng! 👍' 
              : 'Hãy ôn lại và thử lại nhé! 📖'}
          </div>
          <button className="btn btn-primary" onClick={resetQuiz}>
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm lại Quiz
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="empty-state">
          <p>Không có câu hỏi. Vui lòng thêm từ vựng, kanji hoặc ngữ pháp vào bài học.</p>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-progress">
          <span>Câu {currentIndex + 1} / {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <div className="quiz-score">Điểm: {score}/{questions.length}</div>
      </div>

      <div className="quiz-question-card">
        <div className="question-type-badge">
          {current.type === 'vocabulary' ? (
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ) : current.type === 'kanji' ? (
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {current.type === 'vocabulary' ? 'Từ vựng' : current.type === 'kanji' ? 'Kanji' : 'Ngữ pháp'}
        </div>
        <h3 className="question-text">{current.question}</h3>
      </div>

      <div className="quiz-options">
        {current.options.map((option, index) => {
          let className = 'quiz-option';
          if (showResult) {
            if (index === current.correctAnswer) {
              className += ' correct';
            } else if (index === selectedAnswer && index !== current.correctAnswer) {
              className += ' incorrect';
            }
          } else if (selectedAnswer === index) {
            className += ' selected';
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
              {showResult && index === current.correctAnswer && (
                <svg className="option-icon" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
              {showResult && index === selectedAnswer && index !== current.correctAnswer && (
                <svg className="option-icon" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {showResult && current.explanation && (
        <div className="quiz-explanation">
          <div className="explanation-label">
            <svg style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Giải thích:
          </div>
          <div className="explanation-text">{current.explanation}</div>
        </div>
      )}

      <div className="quiz-actions">
        {!showResult ? (
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Kiểm tra câu trả lời
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? (
              <>
                Câu tiếp theo
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Xem kết quả
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;

