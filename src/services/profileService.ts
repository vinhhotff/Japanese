import { supabase } from '../config/supabase';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  updated_at?: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // Only log if it's a real error, not just "not found"
      if (error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as Profile;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
};
