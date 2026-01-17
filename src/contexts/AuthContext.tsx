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
  // REMOVED LOCAL STORAGE FOR SECURITY
  const [role, setRole] = useState<UserRole>('student');
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchUserRole = async (email: string | undefined): Promise<UserRole | null> => {
    if (!email) return null;
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('email', email)
        .maybeSingle();

      if (data && !error) {
        return data.role as UserRole;
      }
    } catch (e) {
      // Timeout or network error - just skip
    }
    return null;
  };

  const determineRole = async (user: User | null): Promise<UserRole> => {
    if (!user) return 'student';

    // 1. Check email patterns (instant, reliable)
    const email = user.email?.toLowerCase();
    if (email?.includes('admin')) {
      // Optional: Still verify with DB if we want strictness, or keep as hardcode override
      // For security, checking DB is better, but this acts as a hardcoded super-admin fallback
      // return 'admin'; 
    }

    // 2. PRIMARY: Check remote DB
    const remoteRole = await fetchUserRole(user.email);
    if (remoteRole) return remoteRole;

    return 'student';
  };

  // Helper to update role state (Memory Only)
  const updateUserRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  useEffect(() => {
    // Get session from localStorage via Supabase
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const r = await determineRole(currentUser);
          updateUserRole(r);
          getProfile(currentUser.id).then(setProfile).catch(() => { });
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const r = await determineRole(currentUser);
        updateUserRole(r);
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
      setLoading(true);

      // Clear local state first
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole('student');
      // localStorage.removeItem('user_role'); // No longer used

      // Clear auth cookies
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth')) {
          document.cookie = `${name}=; path=/; max-age=0`;
        }
      });

      // Also clear localStorage for legacy
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('SignOut error:', error);
    } finally {
      setLoading(false);
      // Force reload to ensure clean state
      window.location.href = '/';
    }
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

