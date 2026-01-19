import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
  const roleRef = useRef<UserRole>('student'); // Keep track of role in ref for listener access
  const roleCheckCompleted = useRef(false); // Optimization: Check role only ONCE
  const retryCount = useRef(0);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Timeout helper for role fetching
  const fetchUserRoleWithTimeout = async (email: string): Promise<UserRole | null> => {
    try {
      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Role fetch timeout')), 10000);
      });

      // Race the fetch against the timeout
      const fetchPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('email', email)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error;
          // If no data found, they are a STUDENT (confirmed)
          return (data?.role as UserRole) || 'student';
        });

      // Use Promise.race
      const result = await Promise.race([fetchPromise, timeoutPromise]) as UserRole | null;
      return result;
    } catch (e) {
      console.warn('Role fetch failed or timed out:', e);
      return null;
    }
  };

  const determineRole = async (user: User | null): Promise<UserRole | null> => {
    if (!user || !user.email) return 'student';

    // 1. Check email patterns (instant, reliable)
    // admin@gmail.com check logic if needed

    // 2. PRIMARY: Check remote DB with timeout
    const remoteRole = await fetchUserRoleWithTimeout(user.email);
    // If remoteRole is null (error), return null to retry
    // If remoteRole is 'student' | 'admin' | 'teacher', return it
    return remoteRole;
  };

  // Helper to update role state (Memory Only)
  const updateUserRole = (newRole: UserRole) => {
    setRole(newRole);
    roleRef.current = newRole;
  };

  useEffect(() => {
    let mounted = true;

    // Listen for auth changes - THIS FIRES IMMEDIATELY ON MOUNT TOO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      try {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Optimization: Check role until confirmed or max retries reached.
          // Allow retires on TOKEN_REFRESHED if we haven't succeeded yet.
          // Note: determineRole now returns NULL on error, so we can retry.
          const shouldFetchRole = !roleCheckCompleted.current && retryCount.current < 3;

          if (shouldFetchRole) {
            const r = await determineRole(currentUser);

            if (mounted) {
              if (r) {
                // SUCCESS: We got a valid role (Student, Teacher, or Admin)
                // Mark as completed to STOP checking.
                roleCheckCompleted.current = true;
                updateUserRole(r);
                logger.log('Role confirmed:', r);
              } else {
                // FAILURE: Timeout or Error.
                // Increment retry count. Do not lock 'roleCheckCompleted' yet.
                retryCount.current += 1;
                console.warn(`Role check failed. Retrying... (${retryCount.current}/3)`);
              }
            }
          }

          if (mounted) {
            // Fetch profile in background, don't block loading
            getProfile(currentUser.id).then(p => {
              if (mounted) setProfile(p);
            }).catch(() => { });
          }
        } else {
          if (mounted) {
            setProfile(null);
            updateUserRole('student');
            roleCheckCompleted.current = false;
            retryCount.current = 0;
          }
        }
      } catch (err) {
        console.error('Auth state change processing error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          logger.log('Auth Loaded', {
            hasUser: !!session?.user,
            role: session?.user ? 'checked' : 'none'
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.session) {
      // State updates will be handled by the listener above
      // But we can eagerly set it if we want instant feedback, 
      // though sticking to the listener is safer for consistency.
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
      setProfile(null);
      updateUserRole('student');
      roleCheckCompleted.current = false; // Reset check flag
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

