import { supabase } from '../config/supabase';
import { PaginatedResponse } from './supabaseService.v2';

export type AssignmentType = 'writing' | 'translation' | 'essay' | 'vocabulary' | 'grammar' | 'speaking' | 'mixed';
export type QuestionType = 'short_answer' | 'essay' | 'multiple_choice' | 'fill_blank' | 'translation' | 'audio_response';
export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned';

// ===== ASSIGNMENTS (Admin) =====
export const getAssignments = async (
  lessonId?: string,
  language?: 'japanese' | 'chinese',
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('assignments')
    .select('*, lesson:lessons(*)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (lessonId) query = query.eq('lesson_id', lessonId);
  if (language) query = query.eq('language', language);

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

export const getAssignmentById = async (id: string) => {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      lesson:lessons(*),
      questions:assignment_questions(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createAssignment = async (assignment: {
  lesson_id: string;
  title: string;
  description?: string;
  instructions: string;
  language: 'japanese' | 'chinese';
  assignment_type: AssignmentType;
  difficulty?: 'easy' | 'medium' | 'hard';
  max_score?: number;
  due_date?: string;
  is_published?: boolean;
  created_by?: string;
  questions?: Array<{
    question_number: number;
    question_text: string;
    question_type: QuestionType;
    options?: string[];
    correct_answer?: string;
    points?: number;
  }>;
}) => {
  const { questions, ...assignmentData } = assignment;

  const { data: assignmentResult, error: assignmentError } = await supabase
    .from('assignments')
    .insert(assignmentData)
    .select()
    .single();

  if (assignmentError) throw assignmentError;

  if (questions && questions.length > 0) {
    const questionsData = questions.map((q) => ({
      assignment_id: assignmentResult.id,
      ...q,
    }));

    const { error: questionsError } = await supabase
      .from('assignment_questions')
      .insert(questionsData);

    if (questionsError) throw questionsError;
  }

  return assignmentResult;
};

export const updateAssignment = async (id: string, updates: Partial<any>) => {
  const { questions, ...assignmentUpdates } = updates as any;

  const { data: assignment, error } = await supabase
    .from('assignments')
    .update(assignmentUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (Array.isArray(questions)) {
    // Delete old questions
    const { error: deleteError } = await supabase
      .from('assignment_questions')
      .delete()
      .eq('assignment_id', id);

    if (deleteError) throw deleteError;

    // Insert new questions
    const validQuestions = questions
      .filter((q: any) => q && (q.question_text || '').trim())
      .map((q: any) => ({
        assignment_id: id,
        ...q,
      }));

    if (validQuestions.length > 0) {
      const { error: insertError } = await supabase
        .from('assignment_questions')
        .insert(validQuestions);

      if (insertError) throw insertError;
    }
  }

  return assignment;
};

export const deleteAssignment = async (id: string) => {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) throw error;
};

// ===== SUBMISSIONS (Student) =====
export const getMySubmissions = async (
  userId: string,
  assignmentId?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('assignment_submissions')
    .select(`
      *,
      assignment:assignments(*)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (assignmentId) query = query.eq('assignment_id', assignmentId);

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

export const getSubmissionById = async (id: string) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      assignment:assignments(*),
      answers:assignment_answers(
        *,
        question:assignment_questions(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createSubmission = async (submission: {
  assignment_id: string;
  user_id: string;
  status?: SubmissionStatus;
}) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .insert(submission)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSubmission = async (id: string, updates: Partial<any>) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const submitAssignment = async (submissionId: string) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ===== ANSWERS (Student) =====
export const saveAnswer = async (answer: {
  submission_id: string;
  question_id: string;
  answer_text?: string;
  audio_url?: string;
}) => {
  // Upsert: update if exists, insert if not
  const { data, error } = await supabase
    .from('assignment_answers')
    .upsert(answer, {
      onConflict: 'submission_id,question_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAnswersBySubmission = async (submissionId: string) => {
  const { data, error } = await supabase
    .from('assignment_answers')
    .select(`
      *,
      question:assignment_questions(*)
    `)
    .eq('submission_id', submissionId);

  if (error) throw error;
  return data;
};

// ===== GRADING (Teacher/Admin) =====
export const getAllSubmissions = async (
  assignmentId?: string,
  status?: SubmissionStatus,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<any>> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('assignment_submissions')
    .select(`
      *,
      assignment:assignments(*)
    `, { count: 'exact' })
    .order('submitted_at', { ascending: false });

  if (assignmentId) query = query.eq('assignment_id', assignmentId);
  if (status) query = query.eq('status', status);

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

export const gradeSubmission = async (
  submissionId: string,
  grading: {
    score: number;
    feedback?: string;
    graded_by: string;
    answers?: Array<{
      answer_id: string;
      is_correct?: boolean;
      points_earned: number;
      feedback?: string;
    }>;
  }
) => {
  // Update submission
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .update({
      status: 'graded',
      score: grading.score,
      feedback: grading.feedback,
      graded_by: grading.graded_by,
      graded_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (submissionError) throw submissionError;

  // Update individual answers if provided
  if (grading.answers && grading.answers.length > 0) {
    for (const answer of grading.answers) {
      const { answer_id, ...answerUpdates } = answer;
      const { error: answerError } = await supabase
        .from('assignment_answers')
        .update(answerUpdates)
        .eq('id', answer_id);

      if (answerError) throw answerError;
    }
  }

  return submission;
};

export const returnSubmission = async (submissionId: string) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({ status: 'returned' })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
