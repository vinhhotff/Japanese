import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Thay thế các giá trị này bằng thông tin Supabase project của bạn
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase URL hoặc Anon Key chưa được cấu hình!\n' +
    'Vui lòng:\n' +
    '1. Tạo file .env trong thư mục gốc\n' +
    '2. Thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY\n' +
    '3. Restart dev server (npm run dev)'
  );
} else {
  // Validate key format (JWT should have 3 parts)
  const keyParts = supabaseAnonKey.split('.');
  if (keyParts.length !== 3) {
    console.error(
      '❌ Supabase Anon Key không đúng định dạng!\n' +
      'JWT token phải có 3 phần cách nhau bởi dấu chấm (.)\n' +
      'Vui lòng kiểm tra lại key trong file .env'
    );
  } else {
    console.log('✅ Supabase config loaded successfully');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          lesson_number: number;
          description: string | null;
          level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>;
      };
      vocabulary: {
        Row: {
          id: string;
          lesson_id: string;
          word: string;
          kanji: string | null;
          hiragana: string;
          meaning: string;
          example: string | null;
          example_translation: string | null;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          is_difficult: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vocabulary']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['vocabulary']['Insert']>;
      };
      kanji: {
        Row: {
          id: string;
          lesson_id: string;
          character: string;
          meaning: string;
          onyomi: string[];
          kunyomi: string[];
          stroke_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kanji']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kanji']['Insert']>;
      };
    };
  };
}

