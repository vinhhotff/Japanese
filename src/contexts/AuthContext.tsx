import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { getProfile, Profile } from '../services/profileService';

export type UserRole = 'admin' | 'teacher' | 'student';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signOut: () => Promise<void>;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  profile: Profile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(() => {
    // Try to restore from local storage first to prevent flicker
    const saved = localStorage.getItem('user_role');
    return (saved as UserRole) || 'student';
  });
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchUserRole = async (email: string | undefined): Promise<UserRole | null> => {
    if (!email) return null;
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('email', email)
        .single();

      if (data && !error) {
        return data.role as UserRole;
      }
    } catch (e) {
      // console.warn('Error fetching remote role', e);
    }
    return null;
  };

  const determineRole = async (user: User | null): Promise<UserRole> => {
    if (!user) return 'student';

    // 1. Check remote table (Priority)
    const remoteRole = await fetchUserRole(user.email);
    if (remoteRole) return remoteRole;

    // 2. Check metadata
    const metaRole = user.user_metadata?.role;
    if (metaRole === 'admin') return 'admin';
    if (metaRole === 'teacher') return 'teacher';

    // 3. Check email patterns (fallback/override)
    const email = user.email?.toLowerCase();
    if (email?.includes('admin')) return 'admin';
    if (email?.includes('teacher') || email?.includes('giao-vien')) return 'teacher';

    return 'student'; // Default
  };

  // Helper to update role state and storage
  const updateUserRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('user_role', newRole);
    console.log('User role updated and saved:', newRole);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const r = await determineRole(currentUser);
      updateUserRole(r);
      if (currentUser) {
        getProfile(currentUser.id).then(setProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }).catch(err => {
      console.warn('Auth session check failed, defaulting to guest:', err);
      setSession(null);
      setUser(null);
      setRole('student');
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const r = await determineRole(currentUser);
      updateUserRole(r);
      if (currentUser) {
        getProfile(currentUser.id).then(setProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      const r = await determineRole(data.session.user);
      updateUserRole(r);

      logger.log('Signed in user:', {
        email: data.session.user.email,
        role: r
      });

      getProfile(data.session.user.id).then(setProfile);
    }

    return { data, error };
  };

  const signOut = async () => {
    try {
      // Try to sign out from Supabase with 5-second timeout
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase signOut timeout')), 5000)
        )
      ]);
      logger.log('Successfully signed out from Supabase');
    } catch (error) {
      // If Supabase signOut fails (timeout or network error), continue anyway
      logger.warn('Supabase signOut failed, clearing local state:', error);
    }

    // Always clear local state regardless of Supabase response
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole('student');
    localStorage.removeItem('user_role');

    logger.log('Local session cleared');
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    role,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    profile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

