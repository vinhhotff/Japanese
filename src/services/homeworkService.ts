import { supabase } from '../config/supabase';

export interface Homework {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  content: string;
  feedback?: string;
  grade?: string;
  submitted_at: string;
}

// Get homework for a class
export const getClassHomework = async (classId: string): Promise<Homework[]> => {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('class_id', classId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Get homework by teacher
export const getTeacherHomework = async (teacherId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('homework')
    .select(`
      *,
      classes (
        name,
        code
      )
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get student homework (from enrolled classes)
export const getStudentHomework = async (userId: string): Promise<any[]> => {
  try {
    // 1. Get enrolled class info (including teacher IDs)
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        classes (
          id,
          name,
          code,
          teacher_id,
          language,
          level
        )
      `)
      .eq('user_id', userId);

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) return [];

    const classIds = enrollments.map(e => e.class_id);
    const teacherIds = enrollments.map((e: any) => e.classes?.teacher_id).filter(Boolean);

    // 2. Fetch both simple homework and media assignments in parallel
    const [homeworkRes, assignmentsRes] = await Promise.all([
      // Simple homework (linked to class)
      supabase
        .from('homework')
        .select(`
          *,
          classes (name, code)
        `)
        .in('class_id', classIds)
        .order('due_date', { ascending: true }),

      // Media assignments (linked to teacher)
      supabase
        .from('assignments')
        .select(`
          *,
          lesson:lessons(title, level)
        `)
        .in('created_by', teacherIds)
        .order('created_at', { ascending: false })
    ]);

    // 3. Process and merge results
    const homeworkItems = (homeworkRes.data || []).map(hw => ({
      ...hw,
      type: 'homework',
      source: 'homework'
    }));

    const assignmentItems = (assignmentsRes.data || []).map(assign => ({
      ...assign,
      type: 'assignment',
      source: 'assignment',
      // Map relevant fields for UI compatibility
      due_date: assign.due_date || assign.created_at,
      classes: {
        name: assign.lesson?.title || 'Bài tập Media',
        code: 'MEDIA'
      }
    }));

    // Combine and sort by due date or creation date
    return [...homeworkItems, ...assignmentItems].sort((a, b) => {
      const dateA = new Date(a.due_date || a.created_at).getTime();
      const dateB = new Date(b.due_date || b.created_at).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error in getStudentHomework:', error);
    throw error;
  }
};

// Create homework (teacher)
export const createHomework = async (homeworkData: {
  class_id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_date?: string;
}): Promise<Homework> => {
  const { data, error } = await supabase
    .from('homework')
    .insert([homeworkData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update homework (teacher)
export const updateHomework = async (homeworkId: string, homeworkData: Partial<{
  class_id: string;
  title: string;
  description: string;
  due_date: string;
}>): Promise<Homework> => {
  const { data, error } = await supabase
    .from('homework')
    .update(homeworkData)
    .eq('id', homeworkId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Submit homework (student)
export const submitHomework = async (submissionData: {
  homework_id: string;
  student_id: string;
  content: string;
}): Promise<HomeworkSubmission> => {
  // Check if already submitted
  const { data: existing } = await supabase
    .from('homework_submissions')
    .select('id')
    .eq('homework_id', submissionData.homework_id)
    .eq('student_id', submissionData.student_id)
    .maybeSingle(); // Changed from single() to maybeSingle()

  if (existing) {
    // Update existing submission
    const { data, error } = await supabase
      .from('homework_submissions')
      .update({ content: submissionData.content, submitted_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new submission
  const { data, error } = await supabase
    .from('homework_submissions')
    .insert([submissionData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get submissions for homework (teacher)
export const getHomeworkSubmissions = async (homeworkId: string): Promise<any[]> => {
  // 1. Get submissions first
  const { data: submissions, error: subError } = await supabase
    .from('homework_submissions')
    .select('*')
    .eq('homework_id', homeworkId);

  if (subError) throw subError;
  if (!submissions || submissions.length === 0) return [];

  // 2. Get profile information manually for the students
  const studentIds = submissions.map(s => s.student_id);
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', studentIds);

  if (profError) {
    console.warn('Could not fetch profiles for submissions:', profError);
    // Return submissions without profile info if it fails
    return submissions.map(s => ({ ...s, profiles: null }));
  }

  // 3. Merge data
  return submissions.map(sub => ({
    ...sub,
    profiles: profiles?.find(p => p.id === sub.student_id) || null
  }));
};

// Grade submission (teacher)
export const gradeSubmission = async (
  submissionId: string,
  feedback: string,
  grade: string
): Promise<HomeworkSubmission> => {
  const { data, error } = await supabase
    .from('homework_submissions')
    .update({ feedback, grade })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get student's submission for homework
export const getStudentSubmission = async (
  homeworkId: string,
  studentId: string
): Promise<HomeworkSubmission | null> => {
  const { data, error } = await supabase
    .from('homework_submissions')
    .select('*')
    .eq('homework_id', homeworkId)
    .eq('student_id', studentId)
    .maybeSingle(); // Changed from single() to maybeSingle()

  if (error) return null;
  return data;
};

// Delete homework (teacher) - remove submissions first due to FK
export const deleteHomework = async (homeworkId: string): Promise<void> => {
  // 1. Remove submissions first
  const { error: submissionsError } = await supabase
    .from('homework_submissions')
    .delete()
    .eq('homework_id', homeworkId);
  if (submissionsError) throw new Error(`Không thể xóa bài nộp: ${submissionsError.message}`);

  // 2. Delete homework and verify deletion
  const { data: deletedHomework, error } = await supabase
    .from('homework')
    .delete()
    .eq('id', homeworkId)
    .select();

  if (error) throw new Error(`Không thể xóa bài tập: ${error.message}`);

  // Check if any row was actually deleted
  if (!deletedHomework || deletedHomework.length === 0) {
    throw new Error('Không thể xóa bài tập. Bạn có thể không có quyền xóa hoặc bài tập không tồn tại.');
  }
};
