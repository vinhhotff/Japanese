import { supabase } from '../config/supabase';
import { Lesson, Vocabulary, Kanji, Grammar, ListeningExercise, SpeakingExercise, SentenceGame } from '../types';

// Courses
export const getCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('level', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const createCourse = async (course: { level: string; title: string; description?: string }) => {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCourse = async (id: string, updates: Partial<{ title: string; description: string }>) => {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCourse = async (id: string) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Lessons
export const getLessons = async (courseId?: string) => {
  let query = supabase
    .from('lessons')
    .select(`
      *,
      course:courses(*)
    `)
    .order('lesson_number', { ascending: true });
  
  if (courseId) {
    query = query.eq('course_id', courseId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getLessonById = async (id: string) => {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      course:courses(*),
      vocabulary:vocabulary(*),
      kanji:kanji(
        *,
        examples:kanji_examples(*)
      ),
      grammar:grammar(
        *,
        examples:grammar_examples(*)
      ),
      listening:listening_exercises(
        *,
        questions:listening_questions(*)
      ),
      speaking:speaking_exercises(*),
      games:sentence_games(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createLesson = async (lesson: {
  course_id: string;
  title: string;
  lesson_number: number;
  description?: string;
  level: string;
}) => {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateLesson = async (id: string, updates: Partial<{
  title: string;
  description: string;
  lesson_number: number;
}>) => {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteLesson = async (id: string) => {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Vocabulary
export const getVocabulary = async (lessonId?: string) => {
  let query = supabase
    .from('vocabulary')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createVocabulary = async (vocab: {
  lesson_id: string;
  word: string;
  kanji?: string;
  hiragana: string;
  meaning: string;
  example?: string;
  example_translation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_difficult?: boolean;
}) => {
  const { data, error } = await supabase
    .from('vocabulary')
    .insert(vocab)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateVocabulary = async (id: string, updates: Partial<{
  word: string;
  kanji: string;
  hiragana: string;
  meaning: string;
  example: string;
  example_translation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_difficult: boolean;
}>) => {
  const { data, error } = await supabase
    .from('vocabulary')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteVocabulary = async (id: string) => {
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Kanji
export const getKanji = async (lessonId?: string) => {
  let query = supabase
    .from('kanji')
    .select(`
      *,
      examples:kanji_examples(*)
    `)
    .order('created_at', { ascending: true });
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createKanji = async (kanji: {
  lesson_id: string;
  character: string;
  meaning: string;
  onyomi: string[];
  kunyomi: string[];
  stroke_count?: number;
  examples?: Array<{ word: string; reading: string; meaning: string }>;
}) => {
  const { examples, ...kanjiData } = kanji;
  
  const { data: kanjiResult, error: kanjiError } = await supabase
    .from('kanji')
    .insert(kanjiData)
    .select()
    .single();
  
  if (kanjiError) throw kanjiError;
  
  if (examples && examples.length > 0) {
    const examplesData = examples.map(ex => ({
      kanji_id: kanjiResult.id,
      ...ex
    }));
    
    const { error: examplesError } = await supabase
      .from('kanji_examples')
      .insert(examplesData);
    
    if (examplesError) throw examplesError;
  }
  
  return kanjiResult;
};

export const updateKanji = async (id: string, updates: Partial<{
  character: string;
  meaning: string;
  onyomi: string[];
  kunyomi: string[];
  stroke_count: number;
}>) => {
  const { data, error } = await supabase
    .from('kanji')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteKanji = async (id: string) => {
  const { error } = await supabase
    .from('kanji')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Grammar
export const getGrammar = async (lessonId?: string) => {
  let query = supabase
    .from('grammar')
    .select(`
      *,
      examples:grammar_examples(*)
    `)
    .order('created_at', { ascending: true });
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createGrammar = async (grammar: {
  lesson_id: string;
  pattern: string;
  meaning: string;
  explanation?: string;
  examples?: Array<{ japanese: string; romaji?: string; translation: string }>;
}) => {
  const { examples, ...grammarData } = grammar;
  
  const { data: grammarResult, error: grammarError } = await supabase
    .from('grammar')
    .insert(grammarData)
    .select()
    .single();
  
  if (grammarError) throw grammarError;
  
  if (examples && examples.length > 0) {
    const examplesData = examples.map(ex => ({
      grammar_id: grammarResult.id,
      ...ex
    }));
    
    const { error: examplesError } = await supabase
      .from('grammar_examples')
      .insert(examplesData);
    
    if (examplesError) throw examplesError;
  }
  
  return grammarResult;
};

export const updateGrammar = async (id: string, updates: Partial<{
  pattern: string;
  meaning: string;
  explanation: string;
}>) => {
  const { data, error } = await supabase
    .from('grammar')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteGrammar = async (id: string) => {
  const { error } = await supabase
    .from('grammar')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Listening Exercises
export const getListeningExercises = async (lessonId?: string) => {
  let query = supabase
    .from('listening_exercises')
    .select(`
      *,
      questions:listening_questions(*)
    `)
    .order('created_at', { ascending: true });
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createListeningExercise = async (exercise: {
  lesson_id: string;
  title: string;
  audio_url?: string;
  image_url?: string;
  transcript: string;
  questions?: Array<{ question: string; options: string[]; correct_answer: number }>;
}) => {
  const { questions, ...exerciseData } = exercise;
  
  const { data: exerciseResult, error: exerciseError } = await supabase
    .from('listening_exercises')
    .insert(exerciseData)
    .select()
    .single();
  
  if (exerciseError) throw exerciseError;
  
  if (questions && questions.length > 0) {
    const questionsData = questions.map(q => ({
      listening_exercise_id: exerciseResult.id,
      question: q.question,
      options: q.options || [],
      correct_answer: q.correct_answer
    }));
    
    const { error: questionsError } = await supabase
      .from('listening_questions')
      .insert(questionsData);
    
    if (questionsError) throw questionsError;
  }
  
  return exerciseResult;
};

// Speaking Exercises
export const getSpeakingExercises = async (lessonId?: string) => {
  let query = supabase
    .from('speaking_exercises')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createSpeakingExercise = async (exercise: {
  lesson_id: string;
  title: string;
  prompt: string;
  example_response?: string;
}) => {
  const { data, error } = await supabase
    .from('speaking_exercises')
    .insert(exercise)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Sentence Games
export const getSentenceGames = async (lessonId?: string) => {
  let query = supabase
    .from('sentence_games')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createSentenceGame = async (game: {
  lesson_id: string;
  sentence: string;
  translation: string;
  words: string[];
  correct_order: number[];
  hint?: string;
}) => {
  const { data, error } = await supabase
    .from('sentence_games')
    .insert(game)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Roleplay Scenarios
export const getRoleplayScenarios = async (lessonId?: string) => {
  let query = supabase
    .from('roleplay_scenarios')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createRoleplayScenario = async (scenario: {
  lesson_id: string;
  title: string;
  description?: string;
  scenario: string;
  character_a: string;
  character_b: string;
  character_a_script: string[];
  character_b_script: string[];
  vocabulary_hints?: string[];
  grammar_points?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  image_url?: string;
}) => {
  const { data, error } = await supabase
    .from('roleplay_scenarios')
    .insert(scenario)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateRoleplayScenario = async (id: string, updates: Partial<{
  title: string;
  description: string;
  scenario: string;
  character_a: string;
  character_b: string;
  character_a_script: string[];
  character_b_script: string[];
  vocabulary_hints: string[];
  grammar_points: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  image_url: string;
}>) => {
  const { data, error } = await supabase
    .from('roleplay_scenarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteRoleplayScenario = async (id: string) => {
  const { error } = await supabase
    .from('roleplay_scenarios')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

