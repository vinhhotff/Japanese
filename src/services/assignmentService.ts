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
  pageSize: number = 10
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

export const getTeacherAssignments = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, lesson:lessons(title)')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
    .maybeSingle();

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
    attachment_urls?: string[];
    audio_url?: string;
    video_url?: string;
    requires_file_upload?: boolean;
    allowed_file_types?: string[];
  }>;
  attachment_urls?: string[];
  audio_url?: string;
  video_url?: string;
  rich_content?: any;
  allow_file_upload?: boolean;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
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
        question_number: q.question_number,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        correct_answer: q.correct_answer || '',
        points: q.points || 0,
        attachment_urls: q.attachment_urls || [],
        audio_url: q.audio_url || null,
        video_url: q.video_url || null,
        requires_file_upload: q.requires_file_upload || false,
        allowed_file_types: q.allowed_file_types || [],
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
  try {
    // Xóa theo thứ tự để tránh lỗi FK (nếu DB không dùng CASCADE)
    // 1. Xóa assignment_answers trước
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', id);

    const submissionIds = (submissions || []).map((s: any) => s.id);

    if (submissionIds.length > 0) {
      const { error: answersErr } = await supabase
        .from('assignment_answers')
        .delete()
        .in('submission_id', submissionIds);
      if (answersErr) {
        console.error('Error deleting assignment_answers:', answersErr);
        throw new Error(`Không thể xóa câu trả lời: ${answersErr.message}`);
      }
    }

    // 2. Xóa assignment_submissions
    const { error: subsErr } = await supabase
      .from('assignment_submissions')
      .delete()
      .eq('assignment_id', id);
    if (subsErr) {
      console.error('Error deleting assignment_submissions:', subsErr);
      throw new Error(`Không thể xóa bài nộp: ${subsErr.message}`);
    }

    // 3. Xóa assignment_questions
    const { error: questionsErr } = await supabase
      .from('assignment_questions')
      .delete()
      .eq('assignment_id', id);
    if (questionsErr) {
      console.error('Error deleting assignment_questions:', questionsErr);
      throw new Error(`Không thể xóa câu hỏi: ${questionsErr.message}`);
    }

    // 4. Cuối cùng xóa assignment và kiểm tra thực sự xóa được
    const { data: deletedAssignment, error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting assignment:', error);
      throw new Error(`Không thể xóa bài tập: ${error.message}. Có thể do thiếu quyền hoặc RLS policy chưa được cấu hình.`);
    }

    // Check if any row was actually deleted
    if (!deletedAssignment || deletedAssignment.length === 0) {
      throw new Error('Không thể xóa bài tập. Bạn có thể không có quyền xóa hoặc bài tập không tồn tại.');
    }
  } catch (error: any) {
    // Re-throw với thông báo rõ ràng hơn
    if (error.message) {
      throw error;
    }
    throw new Error(`Lỗi khi xóa bài tập: ${error?.message || 'Lỗi không xác định'}`);
  }
};

// ===== SUBMISSIONS (Student) =====
export const getMySubmissions = async (
  userId: string,
  assignmentId?: string,
  page: number = 1,
  pageSize: number = 10
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
  // First, get submission with answers from the new table (assignment_answers)
  const { data: submissionWithNewAnswers, error } = await supabase
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
  if (!submissionWithNewAnswers) return null;

  // Check if we have answers from the new table, otherwise fall back to JSONB (old model)
  let answers = submissionWithNewAnswers.answers || [];
  const hasNewAnswers = Array.isArray(answers) && answers.length > 0 && answers[0]?.question_id;

  if (!hasNewAnswers && submissionWithNewAnswers.answers) {
    // Old model: answers is JSONB in submission.answers, map to new format for compatibility
    // The JSONB likely contains { question_id, answer_text, ... } or similar
    const jsonbAnswers = submissionWithNewAnswers.answers as any[];
    if (Array.isArray(jsonbAnswers) && jsonbAnswers.length > 0) {
      // Map old format to new format for GradingInterface compatibility
      const { data: questions } = await supabase
        .from('assignment_questions')
        .select('*')
        .eq('assignment_id', submissionWithNewAnswers.assignment_id);

      answers = jsonbAnswers.map((ans: any, idx: number) => {
        // Find matching question by various possible fields
        const q = questions?.find((q: any) =>
          q.id === ans.question_id ||
          q.question_text === ans.question_text ||
          q.question_text === ans.question
        );
        // Handle various possible field names for student's answer
        const studentAnswer = ans.answer_text || ans.answer || ans.response || ans.text || ans.content || '';
        return {
          id: ans.id || `temp-${idx}`,
          question_id: ans.question_id || q?.id || ans.questionId,
          answer_text: studentAnswer,
          points_earned: ans.points_earned || ans.score || 0,
          feedback: ans.feedback || '',
          is_correct: ans.is_correct ?? ans.correct,
          question: q || { question_text: ans.question_text || ans.question || `Câu hỏi ${idx + 1}` },
        };
      });
    }
  }

  (submissionWithNewAnswers as any).answers = answers;

  // Load profile
  if (submissionWithNewAnswers.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', submissionWithNewAnswers.user_id)
      .maybeSingle();
    (submissionWithNewAnswers as any).profiles = profile ?? null;
  } else {
    (submissionWithNewAnswers as any).profiles = null;
  }
  return submissionWithNewAnswers;
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
  file_urls?: string[];
  video_url?: string;
  file_metadata?: any;
}) => {
  // Find if exists
  const { data: existing } = await supabase
    .from('assignment_answers')
    .select('id')
    .eq('submission_id', answer.submission_id)
    .eq('question_id', answer.question_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('assignment_answers')
      .update(answer)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('assignment_answers')
      .insert(answer)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
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
// Note: assignment_submissions.user_id references auth.users(id), not public.profiles,
// so we cannot embed profiles via PostgREST. We fetch profiles separately and merge.
export const getAllSubmissions = async (
  assignmentId?: string,
  status?: SubmissionStatus,
  page: number = 1,
  pageSize: number = 10
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

  const rows = data || [];
  const userIds = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))];
  let profileMap: Record<string, { id: string; full_name: string | null; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
    }
  }
  const dataWithProfiles = rows.map((r: any) => ({
    ...r,
    profiles: r.user_id ? profileMap[r.user_id] ?? null : null,
  }));

  return {
    data: dataWithProfiles,
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
