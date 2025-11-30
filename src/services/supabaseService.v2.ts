import { supabase } from '../config/supabase';

// Types for pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type Language = 'japanese' | 'chinese';
export type JapaneseLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ChineseLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';
export type Level = JapaneseLevel | ChineseLevel;

// Helper function for pagination
async function getPaginated<T>(
  tableName: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: Record<string, any>,
  orderBy?: { column: string; ascending?: boolean }
): Promise<PaginatedResponse<T>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(tableName).select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data as T[]) || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// ===== COURSES =====
export const getCourses = async (
  language?: Language,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  return getPaginated(
    'courses',
    page,
    pageSize,
    language ? { language } : undefined,
    { column: 'level', ascending: true }
  );
};

export const createCourse = async (course: {
  level: Level;
  title: string;
  description?: string;
  language: Language;
}) => {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCourse = async (
  id: string,
  updates: Partial<{ title: string; description: string; level: Level }>
) => {
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
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
};

// ===== LESSONS =====
export const getLessons = async (
  courseId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (courseId) filters.course_id = courseId;
  if (language) filters.language = language;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('lessons')
    .select(
      `
      *,
      course:courses(*)
    `,
      { count: 'exact' }
    )
    .order('lesson_number', { ascending: true });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) query = query.eq(key, value);
  });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

export const getLessonById = async (id: string) => {
  const { data, error } = await supabase
    .from('lessons')
    .select(
      `
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
      games:sentence_games(*),
      roleplay:roleplay_scenarios(*)
    `
    )
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
  level: Level;
  language: Language;
}) => {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateLesson = async (
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    lesson_number: number;
  }>
) => {
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
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw error;
};

// ===== VOCABULARY =====
export const getVocabulary = async (
  lessonId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (lessonId) filters.lesson_id = lessonId;
  if (language) filters.language = language;

  return getPaginated('vocabulary', page, pageSize, filters, {
    column: 'created_at',
    ascending: true,
  });
};

export const createVocabulary = async (vocab: {
  lesson_id: string;
  word: string;
  character?: string; // Kanji for Japanese, Hanzi for Chinese
  hiragana?: string; // For Japanese
  pinyin?: string; // For Chinese
  simplified?: string; // For Chinese
  traditional?: string; // For Chinese
  meaning: string;
  example?: string;
  example_translation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_difficult?: boolean;
  language: Language;
}) => {
  const { data, error } = await supabase
    .from('vocabulary')
    .insert(vocab)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateVocabulary = async (id: string, updates: Partial<any>) => {
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
  const { error } = await supabase.from('vocabulary').delete().eq('id', id);
  if (error) throw error;
};

// ===== KANJI / HANZI =====
export const getKanji = async (
  lessonId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (lessonId) filters.lesson_id = lessonId;
  if (language) filters.language = language;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('kanji')
    .select(
      `
      *,
      examples:kanji_examples(*)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: true });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) query = query.eq(key, value);
  });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

export const createKanji = async (kanji: {
  lesson_id: string;
  character: string;
  meaning: string;
  onyomi?: string[]; // For Japanese
  kunyomi?: string[]; // For Japanese
  pinyin?: string; // For Chinese
  simplified?: string; // For Chinese
  traditional?: string; // For Chinese
  radical?: string;
  stroke_count?: number;
  language: Language;
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
    const examplesData = examples.map((ex) => ({
      kanji_id: kanjiResult.id,
      ...ex,
    }));

    const { error: examplesError } = await supabase
      .from('kanji_examples')
      .insert(examplesData);

    if (examplesError) throw examplesError;
  }

  return kanjiResult;
};

export const updateKanji = async (id: string, updates: Partial<any>) => {
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
  const { error } = await supabase.from('kanji').delete().eq('id', id);
  if (error) throw error;
};

// ===== GRAMMAR =====
export const getGrammar = async (
  lessonId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (lessonId) filters.lesson_id = lessonId;
  if (language) filters.language = language;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('grammar')
    .select(
      `
      *,
      examples:grammar_examples(*)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: true });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) query = query.eq(key, value);
  });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

export const createGrammar = async (grammar: {
  lesson_id: string;
  pattern: string;
  meaning: string;
  explanation?: string;
  language: Language;
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
    const examplesData = examples.map((ex) => ({
      grammar_id: grammarResult.id,
      ...ex,
    }));

    const { error: examplesError } = await supabase
      .from('grammar_examples')
      .insert(examplesData);

    if (examplesError) throw examplesError;
  }

  return grammarResult;
};

export const updateGrammar = async (id: string, updates: Partial<any>) => {
  const { examples, ...grammarUpdates } = updates as any;

  const { data: grammar, error } = await supabase
    .from('grammar')
    .update(grammarUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (Array.isArray(examples)) {
    const { error: deleteError } = await supabase
      .from('grammar_examples')
      .delete()
      .eq('grammar_id', id);

    if (deleteError) throw deleteError;

    const validExamples = examples
      .filter((ex: any) => ex && (ex.japanese || '').trim() && (ex.translation || '').trim())
      .map((ex: any) => ({
        grammar_id: id,
        japanese: ex.japanese,
        romaji: ex.romaji || null,
        translation: ex.translation,
      }));

    if (validExamples.length > 0) {
      const { error: insertError } = await supabase
        .from('grammar_examples')
        .insert(validExamples);

      if (insertError) throw insertError;
    }
  }

  return grammar;
};

export const deleteGrammar = async (id: string) => {
  const { error } = await supabase.from('grammar').delete().eq('id', id);
  if (error) throw error;
};

// ===== LISTENING EXERCISES =====
export const getListeningExercises = async (
  lessonId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (lessonId) filters.lesson_id = lessonId;
  if (language) filters.language = language;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('listening_exercises')
    .select(
      `
      *,
      questions:listening_questions(*)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: true });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) query = query.eq(key, value);
  });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

export const createListeningExercise = async (exercise: {
  lesson_id: string;
  title: string;
  audio_url?: string;
  image_url?: string;
  transcript: string;
  language: Language;
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
    const questionsData = questions.map((q) => ({
      listening_exercise_id: exerciseResult.id,
      question: q.question,
      options: q.options || [],
      correct_answer: q.correct_answer,
    }));

    const { error: questionsError } = await supabase
      .from('listening_questions')
      .insert(questionsData);

    if (questionsError) throw questionsError;
  }

  return exerciseResult;
};

export const updateListeningExercise = async (id: string, updates: Partial<any>) => {
  const { questions, ...exerciseUpdates } = updates as any;

  const { data: exercise, error } = await supabase
    .from('listening_exercises')
    .update(exerciseUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (Array.isArray(questions)) {
    const { error: deleteError } = await supabase
      .from('listening_questions')
      .delete()
      .eq('listening_exercise_id', id);

    if (deleteError) throw deleteError;

    const validQuestions = questions
      .filter((q) => q && (q.question || '').trim())
      .map((q) => ({
        listening_exercise_id: id,
        question: q.question,
        options: q.options || [],
        correct_answer: q.correct_answer ?? 0,
      }));

    if (validQuestions.length > 0) {
      const { error: insertError } = await supabase
        .from('listening_questions')
        .insert(validQuestions);

      if (insertError) throw insertError;
    }
  }

  return exercise;
};

export const deleteListeningExercise = async (id: string) => {
  const { error } = await supabase.from('listening_exercises').delete().eq('id', id);
  if (error) throw error;
};

// ===== SENTENCE GAMES =====
export const getSentenceGames = async (
  lessonId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (lessonId) filters.lesson_id = lessonId;
  if (language) filters.language = language;

  return getPaginated('sentence_games', page, pageSize, filters, {
    column: 'created_at',
    ascending: true,
  });
};

export const createSentenceGame = async (game: {
  lesson_id: string;
  sentence: string;
  translation: string;
  words: string[];
  correct_order: number[];
  hint?: string;
  language: Language;
}) => {
  const { data, error } = await supabase
    .from('sentence_games')
    .insert(game)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSentenceGame = async (id: string, updates: Partial<any>) => {
  const { data, error } = await supabase
    .from('sentence_games')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSentenceGame = async (id: string) => {
  const { error } = await supabase.from('sentence_games').delete().eq('id', id);
  if (error) throw error;
};

// ===== ROLEPLAY SCENARIOS =====
export const getRoleplayScenarios = async (
  lessonId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (lessonId) filters.lesson_id = lessonId;
  if (language) filters.language = language;

  return getPaginated('roleplay_scenarios', page, pageSize, filters, {
    column: 'created_at',
    ascending: true,
  });
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
  language: Language;
}) => {
  const { data, error } = await supabase
    .from('roleplay_scenarios')
    .insert(scenario)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRoleplayScenario = async (id: string, updates: Partial<any>) => {
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
  const { error } = await supabase.from('roleplay_scenarios').delete().eq('id', id);
  if (error) throw error;
};

// ===== SPEAKING EXERCISES =====
export const getSpeakingExercises = async (
  lessonId?: string,
  language?: Language,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  const filters: Record<string, any> = {};
  if (lessonId) filters.lesson_id = lessonId;
  if (language) filters.language = language;

  return getPaginated('speaking_exercises', page, pageSize, filters, {
    column: 'created_at',
    ascending: true,
  });
};

export const createSpeakingExercise = async (exercise: {
  lesson_id: string;
  title: string;
  prompt: string;
  example_response?: string;
  language: Language;
}) => {
  const { data, error } = await supabase
    .from('speaking_exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSpeakingExercise = async (id: string, updates: Partial<any>) => {
  const { data, error } = await supabase
    .from('speaking_exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSpeakingExercise = async (id: string) => {
  const { error } = await supabase.from('speaking_exercises').delete().eq('id', id);
  if (error) throw error;
};
