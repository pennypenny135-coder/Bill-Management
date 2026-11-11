import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthValue {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let alive = true;
    let eventReceived = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      eventReceived = true;
      if (!alive) return;
      setSession(next);
      setLoading(false);
    });
    client.auth.getSession().then(({ data, error: authError }) => {
      if (!alive) return;
      if (!eventReceived) setSession(data.session);
      if (authError) setError('登入狀態載入失敗，請重新登入。');
      setLoading(false);
    }).catch(() => {
      if (!alive) return;
      setError('無法連接登入服務，請檢查網絡後重新整理。');
      setLoading(false);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const cleanUrl = new URL(window.location.href);
    cleanUrl.search = '';
    cleanUrl.hash = '';
    cleanUrl.pathname = '/';
    window.history.replaceState({}, '', cleanUrl);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (authError) throw authError;
    } catch {
      setError('Google 登入未能開始，請檢查 Google provider 及 Redirect URLs 設定。');
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signOut({ scope: 'local' });
      if (authError) throw authError;
      setSession(null);
    } catch {
      setError('登出未成功，請重試。');
    }
  }, []);

  return <AuthContext.Provider value={{ session, loading, configured: Boolean(supabase), error, signIn, signOut }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
