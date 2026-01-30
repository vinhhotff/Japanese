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
  // First get enrolled class IDs
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('class_id')
    .eq('user_id', userId);

  if (enrollError) throw enrollError;

  const classIds = enrollments?.map(e => e.class_id) || [];
  if (classIds.length === 0) return [];

  // Get homework for those classes
  const { data, error } = await supabase
    .from('homework')
    .select(`
      *,
      classes (
        name,
        code
      )
    `)
    .in('class_id', classIds)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
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
    .single();

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
  const { data, error } = await supabase
    .from('homework_submissions')
    .select(`
      *,
      profiles (
        email,
        full_name
      )
    `)
    .eq('homework_id', homeworkId);

  if (error) throw error;
  return data || [];
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
    .single();

  if (error) return null;
  return data;
};

// Delete homework (teacher) - remove submissions first due to FK
export const deleteHomework = async (homeworkId: string): Promise<void> => {
  const { error: submissionsError } = await supabase
    .from('homework_submissions')
    .delete()
    .eq('homework_id', homeworkId);
  if (submissionsError) throw submissionsError;

  const { error } = await supabase
    .from('homework')
    .delete()
    .eq('id', homeworkId);
  if (error) throw error;
};
