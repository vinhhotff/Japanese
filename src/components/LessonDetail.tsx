import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessonById, getSentenceGames, getRoleplayScenarios } from '../services/supabaseService';
import { transformLessonFromDB } from '../utils/dataTransform';
import { Lesson, Vocabulary, RoleplayScenario } from '../types';
import VocabularySection from './VocabularySection';
import KanjiSection from './KanjiSection';
import GrammarSection from './GrammarSection';
import ListeningSection from './ListeningSection';
import SpeakingSection from './SpeakingSection';
import SentenceGame from './SentenceGame';
import Flashcard from './Flashcard';
import Quiz from './Quiz';
import Roleplay from './Roleplay';
import SearchBar from './SearchBar';
import Pronunciation from './Pronunciation';
import Shadowing from './Shadowing';
import '../App.css';

const LessonDetail = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [activeTab, setActiveTab] = useState<'vocab' | 'kanji' | 'grammar' | 'listening' | 'speaking' | 'game' | 'flashcard' | 'quiz' | 'roleplay' | 'pronunciation' | 'shadowing'>('vocab');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLevel, setCourseLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [sentenceGames, setSentenceGames] = useState<any[]>([]);
  const [roleplayScenarios, setRoleplayScenarios] = useState<RoleplayScenario[]>([]);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonData = await getLessonById(lessonId!);
      
      if (lessonData) {
        const transformed = transformLessonFromDB(lessonData);
        setLesson(transformed);
        setCourseLevel(transformed.level);

        // Load sentence games
        const games = await getSentenceGames(lessonId!);
        setSentenceGames(games || []);

        // Load roleplay scenarios
        const scenarios = await getRoleplayScenarios(lessonId!);
        if (scenarios) {
          setRoleplayScenarios(scenarios.map((s: any) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            scenario: s.scenario,
            characterA: s.character_a,
            characterB: s.character_b,
            characterAScript: s.character_a_script || [],
            characterBScript: s.character_b_script || [],
            characterACorrectAnswers: s.character_a_correct_answers || [],
            characterBCorrectAnswers: s.character_b_correct_answers || [],
            vocabularyHints: s.vocabulary_hints || [],
            grammarPoints: s.grammar_points || [],
            difficulty: s.difficulty || 'medium',
            imageUrl: s.image_url,
            enableScoring: s.enable_scoring || false,
          })));
        }
      }
    } catch (err: any) {
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải bài học...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container">
        <h1>Không tìm thấy bài học</h1>
        <Link to="/" className="back-button">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  const difficultVocab = lesson.vocabulary.filter((v) =>
    lesson!.difficultVocabulary.includes(v.id)
  );

  const getDifficultyClass = (difficulty: Vocabulary['difficulty']) => {
    return difficulty;
  };

  return (
    <div className="container">
      <Link to={`/courses/${courseLevel}`} className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về danh sách bài học
      </Link>

        <div className="header">
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <SearchBar 
            vocabulary={lesson.vocabulary}
            kanji={lesson.kanji}
            grammar={lesson.grammar}
          />
        </div>

        {difficultVocab.length > 0 && (
          <div className="difficult-vocab-section">
            <h2>Từ vựng khó trong bài này</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Hãy xem qua những từ vựng khó trước khi bắt đầu học bài này:
            </p>
            {difficultVocab.map((vocab) => (
              <div key={vocab.id} className={`vocab-card ${getDifficultyClass(vocab.difficulty)}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                      {vocab.kanji || vocab.word}
                    </h3>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {vocab.hiragana}
                    </p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {vocab.meaning}
                    </p>
                    {vocab.example && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <p style={{ fontStyle: 'italic', marginBottom: '0.25rem' }}>
                          {vocab.example}
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          {vocab.exampleTranslation}
                        </p>
                      </div>
                    )}
                  </div>
                  <span className={`badge badge-${vocab.difficulty === 'hard' ? 'n1' : vocab.difficulty === 'medium' ? 'n3' : 'n5'}`}>
                    {vocab.difficulty === 'hard' ? 'Khó' : vocab.difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="tab-container">
          <button
            className={`tab tab-vocab ${activeTab === 'vocab' ? 'active' : ''}`}
            onClick={() => setActiveTab('vocab')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="tab-text">Từ vựng</span>
            <span className="tab-count">({lesson.vocabulary.length})</span>
          </button>
          <button
            className={`tab tab-kanji ${activeTab === 'kanji' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanji')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="tab-text">Kanji</span>
            <span className="tab-count">({lesson.kanji.length})</span>
          </button>
          <button
            className={`tab tab-grammar ${activeTab === 'grammar' ? 'active' : ''}`}
            onClick={() => setActiveTab('grammar')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="tab-text">Ngữ pháp</span>
            <span className="tab-count">({lesson.grammar.length})</span>
          </button>
          <button
            className={`tab tab-listening ${activeTab === 'listening' ? 'active' : ''}`}
            onClick={() => setActiveTab('listening')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="tab-text">Nghe</span>
            <span className="tab-count">({lesson.listening.length})</span>
          </button>
          <button
            className={`tab tab-speaking ${activeTab === 'speaking' ? 'active' : ''}`}
            onClick={() => setActiveTab('speaking')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="tab-text">Nói</span>
            <span className="tab-count">({lesson.speaking.length})</span>
          </button>
          <button
            className={`tab tab-game ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveTab('game')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            <span className="tab-text">Game</span>
          </button>
          <button
            className={`tab tab-flashcard ${activeTab === 'flashcard' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcard')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="tab-text">Flashcard</span>
          </button>
          <button
            className={`tab tab-quiz ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="tab-text">Quiz</span>
          </button>
          {roleplayScenarios.length > 0 && (
            <button
              className={`tab tab-roleplay ${activeTab === 'roleplay' ? 'active' : ''}`}
              onClick={() => setActiveTab('roleplay')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="tab-text">Roleplay</span>
              <span className="tab-count">({roleplayScenarios.length})</span>
            </button>
          )}
          <button
            className={`tab tab-pronunciation ${activeTab === 'pronunciation' ? 'active' : ''}`}
            onClick={() => setActiveTab('pronunciation')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="tab-text">Phát âm</span>
          </button>
          <button
            className={`tab tab-shadowing ${activeTab === 'shadowing' ? 'active' : ''}`}
            onClick={() => setActiveTab('shadowing')}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="tab-text">Shadowing</span>
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'vocab' && <VocabularySection vocabulary={lesson.vocabulary} />}
          {activeTab === 'kanji' && <KanjiSection kanji={lesson.kanji} />}
          {activeTab === 'grammar' && <GrammarSection grammar={lesson.grammar} />}
          {activeTab === 'listening' && <ListeningSection listening={lesson.listening} />}
          {activeTab === 'speaking' && <SpeakingSection speaking={lesson.speaking} vocabulary={lesson.vocabulary} />}
          {activeTab === 'game' && (
            <div className="section-container game-section">
              <div className="section-header game-header">
                <div className="section-icon game-icon">
                  <svg style={{ width: '40px', height: '40px', color: '#ec4899' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <div>
                  <h2>Sắp xếp câu</h2>
                  <p>Kéo thả các từ để sắp xếp thành câu đúng</p>
                </div>
              </div>
              <div className="section-content">
                {sentenceGames.length > 0 ? (
                  <SentenceGame 
                    sentences={sentenceGames.map((g: any) => ({
                      id: g.id,
                      sentence: g.sentence,
                      translation: g.translation,
                      words: g.words || [],
                      correctOrder: g.correct_order || [],
                      hint: g.hint || undefined,
                    }))}
                    onComplete={(score, total) => {
                      console.log(`Game completed: ${score}/${total}`);
                    }}
                  />
                ) : (
                  <div className="empty-state">
                    <p>Chưa có game cho bài học này</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'flashcard' && (
            <div className="section-container flashcard-section">
              <div className="section-header flashcard-section-header">
                <div className="section-icon flashcard-section-icon">
                  <svg style={{ width: '40px', height: '40px', color: '#06b6d4' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2>Flashcard</h2>
                  <p>Học từ vựng bằng thẻ ghi nhớ</p>
                </div>
              </div>
              <div className="section-content">
                {lesson.vocabulary.length > 0 ? (
                  <Flashcard 
                    vocabulary={lesson.vocabulary}
                    onComplete={(mastered, total) => {
                      console.log(`Flashcard completed: ${mastered}/${total} mastered`);
                    }}
                  />
                ) : (
                  <div className="empty-state">
                    <p>Chưa có từ vựng để học</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'roleplay' && roleplayScenarios.length > 0 && (
            <Roleplay scenarios={roleplayScenarios} />
          )}
          {activeTab === 'pronunciation' && (
            <Pronunciation vocabulary={lesson.vocabulary} />
          )}
          {activeTab === 'shadowing' && (
            <div className="section-container shadowing-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg style={{ width: '40px', height: '40px', color: '#8b5cf6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2>Bài tập Shadowing</h2>
                  <p>Luyện nghe và nói đồng thời</p>
                </div>
              </div>
              <div className="section-content">
                {lesson.listening.length > 0 ? (
                  <Shadowing listening={lesson.listening} />
                ) : (
                  <div className="empty-state">
                    <p>Chưa có bài nghe để luyện shadowing</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'quiz' && (
            <div className="section-container quiz-section">
              <div className="section-header quiz-section-header">
                <div className="section-icon quiz-section-icon">
                  <svg style={{ width: '40px', height: '40px', color: '#6366f1' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2>Quiz</h2>
                  <p>Kiểm tra kiến thức của bạn</p>
                </div>
              </div>
              <div className="section-content">
                <Quiz 
                  vocabulary={lesson.vocabulary}
                  kanji={lesson.kanji}
                  grammar={lesson.grammar}
                  onComplete={(score, total) => {
                    console.log(`Quiz completed: ${score}/${total}`);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default LessonDetail;

