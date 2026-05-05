'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';

const supabase = createClient(); // ✅ SINGLE INSTANCE

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      setUser(null);
      return;
    }

    if (session?.user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("User fetch error:", error);
        setUser(null); // 🔥 important fallback
      } else {
        setUser(data);
      }
    } else {
      setUser(null);
    }
  } catch (err) {
    console.error("Auth crash:", err);
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadUser();

   const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (_event, session) => {
    try {
      if (session?.user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("User fetch error:", error);
          setUser(null);
        } else {
          setUser(data);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth change crash:", err);
      setUser(null);
    } finally {
      setLoading(false); // ✅ ALWAYS run
    }
  }
);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);