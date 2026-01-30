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
    .select('id, teacher_id')
    .eq('code', classCode)
    .limit(1)
    .maybeSingle();

  if (classError || !classData) {
    throw new Error('Mã lớp không tồn tại');
  }

  // Prevent teacher from joining own class
  if (classData.teacher_id === userId) {
    throw new Error('Giáo viên không thể tham gia lớp học của chính mình');
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_id', classData.id)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    throw new Error('Bạn đã tham gia lớp này rồi');
  }

  // Create enrollment
  const { data, error } = await supabase
    .from('enrollments')
    .insert([{ class_id: classData.id, user_id: userId }])
    .select()
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Get class students (teacher view)
export const getClassStudents = async (classId: string): Promise<any[]> => {
  try {
    // 1. Get enrollments first
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('class_id', classId);

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) return [];

    // 2. Get info from both 'profiles' and 'user_roles' to be safe
    const userIds = enrollments.map(e => e.user_id);

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name').in('id', userIds),
      supabase.from('user_roles').select('id, email').in('id', userIds)
    ]);

    // 3. Merge data intelligently
    return enrollments.map(enroll => {
      const profile = profiles?.find(p => p.id === enroll.user_id);
      const role = roles?.find(r => r.id === enroll.user_id);

      const email = profile?.email || role?.email || 'N/A';
      const name = profile?.full_name || 'Học sinh';

      // If we still get fallback values, it's likely an RLS issue
      return {
        ...enroll,
        email: email,
        // Show truncated ID for debugging if name is missing
        full_name: (name === 'Học sinh' && enroll.user_id)
          ? `Học sinh (${enroll.user_id.substring(0, 5)})`
          : name
      };
    });
  } catch (error) {
    console.error('Error in getClassStudents:', error);
    throw error;
  }
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

// Delete class (teacher/admin) - removes enrollments and homework for this class first
export const deleteClass = async (classId: string): Promise<void> => {
  // 1. Remove all enrollments for this class
  const { error: enrollError } = await supabase
    .from('enrollments')
    .delete()
    .eq('class_id', classId);
  if (enrollError) throw enrollError;

  // 2. Remove all homework for this class
  const { error: homeworkError } = await supabase
    .from('homework')
    .delete()
    .eq('class_id', classId);
  if (homeworkError) throw homeworkError;

  // 3. Delete the class
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

// Remove student from class (teacher)
export const removeStudent = async (classId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('class_id', classId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Get all classes for Admin (with teacher info and student count)
export const getAdminClasses = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      profiles (
        full_name,
        email
      ),
      enrollments (count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform data to include student count property
  return (data || []).map((cls: any) => ({
    ...cls,
    teacher: cls.profiles, // Rename profiles to teacher for clarity
    student_count: cls.enrollments[0]?.count || 0
  }));
};
