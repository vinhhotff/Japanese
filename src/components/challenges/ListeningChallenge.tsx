import { useState, useEffect } from 'react';
import { getListeningExercises } from '../../services/supabaseService';
import '../../App.css';

interface ListeningChallengeProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const ListeningChallenge = ({ onComplete, onClose }: ListeningChallengeProps) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const allExercises = await getListeningExercises();
      // Filter exercises that have questions
      const exercisesWithQuestions = allExercises.filter((ex: any) => {
        const questions = ex.questions || [];
        return Array.isArray(questions) && questions.length > 0;
      });
      
      if (exercisesWithQuestions.length === 0) {
        alert('Không có bài nghe nào có câu hỏi. Vui lòng thêm câu hỏi trong Admin Panel.');
        return;
      }
      
      const shuffled = exercisesWithQuestions.sort(() => Math.random() - 0.5).slice(0, 3);
      setExercises(shuffled);
    } catch (error) {
      console.error('Error loading exercises:', error);
      alert('Lỗi khi tải bài nghe: ' + (error as Error).message);
    }
  };

  const currentExercise = exercises[currentIndex];

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answerIndex });
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      let totalQuestions = 0;
      
      exercises.forEach((exercise: any) => {
        const questions = Array.isArray(exercise.questions) ? exercise.questions : [];
        questions.forEach((q: any) => {
          totalQuestions++;
          if (selectedAnswers[q.id] === q.correct_answer) {
            correctCount++;
          }
        });
      });
      
      const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      setScore(finalScore);
      setCompleted(true);
      onComplete(finalScore);
    }
  };

  if (completed) {
    return (
      <div className="challenge-result">
        <div className="result-icon">🎉</div>
        <h2>Hoàn thành!</h2>
        <div className="result-score">
          <div className="score-percentage">{score}%</div>
        </div>
        <div className="result-points">+{score} điểm</div>
        <button className="btn btn-primary" onClick={onClose}>
          Đóng
        </button>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="challenge-content">
        <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Không có bài nghe nào có câu hỏi.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Vui lòng thêm câu hỏi cho bài nghe trong Admin Panel.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1rem' }}>
          Đóng
        </button>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="challenge-content">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  const questions = Array.isArray(currentExercise.questions) ? currentExercise.questions : [];
  const allQuestionsAnswered = questions.length > 0 && questions.every((q: any) => 
    selectedAnswers[q.id] !== undefined
  );

  return (
    <div className="challenge-content">
      <h2>Thử thách Nghe</h2>
      <div className="challenge-progress">
        Bài {currentIndex + 1} / {exercises.length}
      </div>

      <div className="challenge-question">
        <h3>{currentExercise.title}</h3>
        {currentExercise.audio_url && (
          <audio controls className="audio-player">
            <source src={currentExercise.audio_url} type="audio/mpeg" />
          </audio>
        )}
        {currentExercise.image_url && (
          <img src={currentExercise.image_url} alt={currentExercise.title} className="exercise-image" />
        )}
      </div>

      <div className="challenge-questions">
        {questions.length > 0 ? (
          questions.map((question: any) => (
            <div key={question.id} className="question-item">
              <p className="question-text">{question.question}</p>
              <div className="question-options">
                {Array.isArray(question.options) && question.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    className={`option-button ${
                      selectedAnswers[question.id] === index ? 'selected' : ''
                    }`}
                    onClick={() => handleAnswer(question.id, index)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Bài nghe này chưa có câu hỏi. Vui lòng thêm câu hỏi trong Admin Panel.</p>
          </div>
        )}
      </div>

      <div className="challenge-actions">
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!allQuestionsAnswered}
        >
          {currentIndex < exercises.length - 1 ? 'Bài tiếp theo →' : 'Hoàn thành'}
        </button>
      </div>
    </div>
  );
};

export default ListeningChallenge;

