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
    level: string; // 'N5', 'HSK1', etc.
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

// Assign role to an email
export const assignRole = async (email: string, role: 'teacher' | 'student' | 'admin') => {
    // Check if exists
    const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existing) {
        const { data, error } = await supabase
            .from('user_roles')
            .update({ role })
            .eq('email', email)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('user_roles')
            .insert({ email, role })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
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
export const assignTeacherToCourse = async (email: string, language: string, level: string) => {
    const { data, error } = await supabase
        .from('teacher_assignments')
        .insert({ teacher_email: email, language, level })
        .select()
        .single();

    if (error) throw error;
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
