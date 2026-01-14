import { supabase } from '../config/supabase';

export interface Class {
  id: string;
  code: string;
  name: string;
  teacher_id: string;
  level: string;
  language: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  class_id: string;
  user_id: string;
  joined_at: string;
}

// Get all classes
export const getAllClasses = async (): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get classes by teacher
export const getTeacherClasses = async (teacherId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get student enrollments with class details
export const getStudentClasses = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      classes (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
};

// Create a new class (teacher only)
export const createClass = async (classData: {
  name: string;
  level: string;
  language: string;
  teacher_id: string;
}): Promise<Class> => {
  // Generate unique class code
  const code = `${classData.language.substring(0, 2).toUpperCase()}${classData.level}-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabase
    .from('classes')
    .insert([{ ...classData, code }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Join a class by code (student)
export const joinClass = async (userId: string, classCode: string): Promise<Enrollment> => {
  // First, find the class by code
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('code', classCode)
    .single();

  if (classError || !classData) {
    throw new Error('Mã lớp không tồn tại');
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_id', classData.id)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('Bạn đã tham gia lớp này rồi');
  }

  // Create enrollment
  const { data, error } = await supabase
    .from('enrollments')
    .insert([{ class_id: classData.id, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get class students (teacher view)
export const getClassStudents = async (classId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      profiles (
        id,
        email,
        full_name
      )
    `)
    .eq('class_id', classId);

  if (error) throw error;
  return data || [];
};

// Check if student has joined any class
export const hasJoinedAnyClass = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) return false;
  return (data && data.length > 0) || false;
};

// Delete class (teacher/admin)
export const deleteClass = async (classId: string): Promise<void> => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;
};

// Leave class (student)
export const leaveClass = async (userId: string, classId: string): Promise<void> => {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('user_id', userId)
    .eq('class_id', classId);

  if (error) throw error;
};
