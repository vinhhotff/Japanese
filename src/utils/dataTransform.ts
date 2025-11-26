// Transform Supabase data to app format
import { Lesson, Vocabulary, Kanji, Grammar, ListeningExercise, SpeakingExercise, SentenceGame } from '../types';

export const transformLessonFromDB = (dbLesson: any): Lesson => {
  // Supabase returns related data as arrays directly
  const vocabData = dbLesson.vocabulary || [];
  const kanjiData = dbLesson.kanji || [];
  const grammarData = dbLesson.grammar || [];
  const listeningData = dbLesson.listening || dbLesson.listening_exercises || [];
  const speakingData = dbLesson.speaking || dbLesson.speaking_exercises || [];

  return {
    id: dbLesson.id,
    title: dbLesson.title,
    level: dbLesson.level,
    lessonNumber: dbLesson.lesson_number,
    description: dbLesson.description || '',
    vocabulary: vocabData.map((v: any) => ({
      id: v.id,
      word: v.word,
      kanji: v.kanji || undefined,
      hiragana: v.hiragana,
      meaning: v.meaning,
      example: v.example || undefined,
      exampleTranslation: v.example_translation || undefined,
      difficulty: v.difficulty || 'easy',
    })),
    kanji: kanjiData.map((k: any) => {
      const examples = Array.isArray(k.examples) 
        ? k.examples 
        : (k.examples?.data || []);
      
      return {
        id: k.id,
        character: k.character,
        meaning: k.meaning,
        readings: {
          onyomi: Array.isArray(k.onyomi) ? k.onyomi : [],
          kunyomi: Array.isArray(k.kunyomi) ? k.kunyomi : [],
        },
        strokeCount: k.stroke_count || 0,
        examples: examples.map((ex: any) => ({
          word: ex.word,
          reading: ex.reading,
          meaning: ex.meaning,
        })),
      };
    }),
    grammar: grammarData.map((g: any) => {
      const examples = Array.isArray(g.examples) 
        ? g.examples 
        : (g.examples?.data || []);
      
      return {
        id: g.id,
        pattern: g.pattern,
        meaning: g.meaning,
        explanation: g.explanation || '',
        examples: examples.map((ex: any) => ({
          japanese: ex.japanese,
          romaji: ex.romaji || '',
          translation: ex.translation,
        })),
      };
    }),
    listening: listeningData.map((l: any) => {
      const questions = Array.isArray(l.questions) 
        ? l.questions 
        : (l.questions?.data || []);
      
      return {
        id: l.id,
        title: l.title,
        audioUrl: l.audio_url || undefined,
        imageUrl: l.image_url || undefined,
        transcript: l.transcript,
        questions: questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correct_answer,
        })),
      };
    }),
    speaking: speakingData.map((s: any) => ({
      id: s.id,
      title: s.title,
      prompt: s.prompt,
      exampleResponse: s.example_response || undefined,
    })),
    difficultVocabulary: vocabData
      .filter((v: any) => v.is_difficult)
      .map((v: any) => v.id),
  };
};

export const transformCourseFromDB = (dbCourse: any, lessons: any[]): any => {
  // Filter lessons by course_id
  const courseLessons = lessons
    .filter(l => {
      const courseId = l.course_id || l.course?.id;
      return courseId === dbCourse.id;
    })
    .map((l: any) => {
      // Transform lesson data - need to fetch full lesson data
      return {
        id: l.id,
        title: l.title,
        level: l.level || dbCourse.level,
        lessonNumber: l.lesson_number,
        description: l.description || '',
        vocabulary: [],
        kanji: [],
        grammar: [],
        listening: [],
        speaking: [],
        difficultVocabulary: [],
      };
    });

  return {
    level: dbCourse.level,
    title: dbCourse.title,
    description: dbCourse.description || '',
    lessons: courseLessons,
  };
};

