import { useState, useEffect } from 'react';
import { QuizQuestion, Vocabulary, Kanji, Grammar } from '../types';
import '../styles/learning-sections-premium.css';

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
        <div className="quiz-result" style={{ textAlign: 'center' }}>
          <svg className="result-icon" style={{ width: '100px', height: '100px', color: percentage >= 80 ? 'var(--success-color)' : percentage >= 60 ? 'var(--warning-color)' : 'var(--danger-color)', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {percentage >= 80 ? (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : percentage >= 60 ? (
              <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            )}
          </svg>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '1rem' }}>Kết quả Quiz</h2>
          <div className="score-display" style={{ margin: '2rem 0' }}>
            <div className="score-number" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary-color)' }}>{score}/{questions.length}</div>
            <div className="score-label" style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Câu đúng</div>
            <div className={`score-percentage ${performanceClass}`} style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>
              {percentage}%
            </div>
          </div>
          <div className="result-message" style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            {percentage >= 80
              ? 'Xuất sắc! Bạn đã nắm vững kiến thức! 🎉'
              : percentage >= 60
                ? 'Tốt! Hãy tiếp tục cố gắng! 👍'
                : 'Hãy ôn lại và thử lại nhé! 📖'}
          </div>
          <button className="btn btn-primary" onClick={resetQuiz}>
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
      <div className="quiz-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="quiz-progress" style={{ flex: 1 }}>
          <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Câu {currentIndex + 1} / {questions.length}</span>
          <div className="progress-bar" style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div
              className="progress-fill"
              style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }}
            ></div>
          </div>
        </div>
        <div className="quiz-score" style={{ marginLeft: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>Điểm: {score}/{questions.length}</div>
      </div>

      <div className="quiz-question-card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div className="question-type-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
          {current.type === 'vocabulary' ? 'Từ vựng' : current.type === 'kanji' ? 'Kanji' : 'Ngữ pháp'}
        </div>
        <h3 className="question-text" style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-primary)' }}>{current.question}</h3>
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
              style={{ position: 'relative' }}
            >
              <span className="option-letter" style={{ width: '32px', height: '32px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginRight: '1rem' }}>{String.fromCharCode(65 + index)}</span>
              <span className="option-text" style={{ flex: 1, textAlign: 'left', fontWeight: '600' }}>{option}</span>
              {showResult && index === current.correctAnswer && (
                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>✓</span>
              )}
              {showResult && index === selectedAnswer && index !== current.correctAnswer && (
                <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>✗</span>
              )}
            </button>
          );
        })}
      </div>

      {showResult && current.explanation && (
        <div className="quiz-explanation" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <div className="explanation-label" style={{ fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Giải thích:
          </div>
          <div className="explanation-text" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{current.explanation}</div>
        </div>
      )}

      <div className="quiz-actions" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
        {!showResult ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
          >
            Kiểm tra
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
          </button>
        )}
      </div>
    </div>
  );
};


export default Quiz;

