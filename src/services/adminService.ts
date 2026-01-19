import { supabase } from '../config/supabase';

// Types
export interface UserRoleRecord {
    id?: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    created_at?: string;
}

export interface TeacherAssignment {
    id?: string;
    teacher_email: string;
    language: 'japanese' | 'chinese';
    level: string; // 'N5', 'HSK1', etc. (kept for legacy/display)
    course_id?: string; // Links to public.courses(id)
    created_at?: string;
}

// === Role Management ===

// Get all roles (Admin only)
export const getAllUserRoles = async () => {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn("Could not fetch user_roles table. Ensure it exists.", error);
        return [];
    }
    return data as UserRoleRecord[];
};

// Get single user role
export const getUserRole = async (email: string) => {
    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.warn("Error fetching user role:", error);
        return null;
    }
    return data?.role || null;
};

// Assign role to an email
export const assignRole = async (email: string, role: 'teacher' | 'student' | 'admin') => {
    // 1. Check if user exists in profiles to get leur ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    const userId = profile?.id;

    // 2. Perform upsert on user_roles
    // If we have an ID, we use it. Otherwise, email is the unique key.
    const upsertData: any = { email, role };
    if (userId) upsertData.id = userId;

    const { data, error } = await supabase
        .from('user_roles')
        .upsert(upsertData, {
            onConflict: 'email'
        })
        .select()
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error in assignRole:', error);
        throw error;
    }
    return data;
};

// Remove role (delete record)
export const removeRole = async (email: string) => {
    const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('email', email);
    if (error) throw error;
};

// === Teacher Assignments ===

// Get assignments for a teacher
export const getTeacherAssignments = async (email: string) => {
    const { data, error } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('teacher_email', email);

    if (error) {
        console.warn("Could not fetch teacher_assignments table.", error);
        return [];
    }
    return data as TeacherAssignment[];
};

// Assign teacher to course
export const assignTeacherToCourse = async (email: string, language: string, level: string, courseId?: string) => {
    // We use upsert if course_id is provided, assuming course_id is unique in teacher_assignments
    const upsertData: any = {
        teacher_email: email,
        language,
        level,
        updated_at: new Date().toISOString()
    };

    if (courseId) {
        upsertData.course_id = courseId;
    }

    const { data, error } = await supabase
        .from('teacher_assignments')
        .upsert(upsertData, {
            onConflict: 'course_id',
            ignoreDuplicates: false
        })
        .select()
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error in assignTeacherToCourse:', error);
        throw error;
    }
    return data;
};

// Remove assignment
export const removeTeacherAssignment = async (id: string) => {
    const { error } = await supabase
        .from('teacher_assignments')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// Check if teacher has permission (Helper)
export const checkTeacherPermission = async (email: string, language: string, level: string) => {
    // Admins always have permission
    // But we might not knwo if they are admin here easily without context.
    // Assuming this checks SPECIFIC teacher assignments.
    const assignments = await getTeacherAssignments(email);
    return assignments.some(a => a.language === language && a.level === level);
};
