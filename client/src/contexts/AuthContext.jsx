import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AuthContext] useEffect - about to call checkSession');
    // Check active session
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', _event, 'session:', session);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
      console.log('[AuthContext] onAuthStateChange setLoading(false)');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Promise helper to add a timeout to getSession
  function promiseWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), timeoutMs))
    ]);
  }

  const checkSession = async () => {
    console.log('[AuthContext] checkSession: Before getSession');
    try {
      const { data: { session } } = await promiseWithTimeout(supabase.auth.getSession(), 3000); // 3s timeout
      console.log('[AuthContext] checkSession: After getSession:', session);
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('[AuthContext] Error checking session:', error);
      toast.error('You have been logged out. Please do not switch tabs or switch apps during your examination.');
    } finally {
      setLoading(false);
      console.log('[AuthContext] checkSession: setLoading(false) called in finally');
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          profession:professions(*),
          health_authority:health_authorities(*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        await loadUserProfile(data.user.id);
        toast.success('Login successful!');
        return { success: true, user: data.user };
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUserProfile(null);
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  // Combine user and profile for convenience
  const currentUser = userProfile
    ? {
        ...(user || {}),
        ...userProfile,
        role: userProfile.role,
        profession: userProfile.profession,
        healthAuthority: userProfile.health_authority,
        dailyMcqLimit: userProfile.daily_mcq_limit,
        fullName: userProfile.full_name,
      }
    : user;

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        userProfile,
        loading,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};