import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase-client';
import type { User } from '@supabase/supabase-js';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

function useTurnstile() {
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || !TURNSTILE_SITE_KEY) return;

    function renderWidget() {
      if (!window.turnstile || !node) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = window.turnstile.render(node, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        size: 'compact',
        callback: (token: string) => {
          tokenRef.current = token;
          setReady(true);
        },
        'expired-callback': () => {
          tokenRef.current = null;
          setReady(false);
        },
      });
    }

    const scriptId = 'cf-turnstile-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => renderWidget();
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    }
  }, []);

  const reset = useCallback(() => {
    tokenRef.current = null;
    setReady(false);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { containerCallbackRef, tokenRef, ready, reset };
}

export default function AuthPanel() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const turnstile = useTurnstile();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    // Require captcha token if Turnstile is configured
    if (TURNSTILE_SITE_KEY && !turnstile.tokenRef.current) {
      setError('Please complete the verification.');
      return;
    }

    setError('');
    setMessage('');
    setSubmitting(true);

    const captchaToken = turnstile.tokenRef.current ?? undefined;

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { captchaToken },
      });
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) setError(error.message);
    }

    turnstile.reset();
    setSubmitting(false);
  }, [mode, email, password, turnstile]);

  const handleLogout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  if (!supabase) return null;
  if (loading) return null;

  if (user) {
    return (
      <div className="auth-panel">
        <span className="auth-email">{user.email}</span>
        <a href="/profile" className="auth-link">profile</a>
        <button className="auth-btn" onClick={handleLogout}>log out</button>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="auth-input"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="auth-input"
        />
        {TURNSTILE_SITE_KEY && (
          <div ref={turnstile.containerCallbackRef} className="turnstile-widget" />
        )}
        <button
          type="submit"
          className="auth-btn"
          disabled={submitting || (!!TURNSTILE_SITE_KEY && !turnstile.ready)}
        >
          {mode === 'login' ? 'log in' : 'sign up'}
        </button>
      </form>
      <button
        className="auth-toggle"
        onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
      >
        {mode === 'login' ? 'need an account?' : 'already have one?'}
      </button>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-message">{message}</p>}
    </div>
  );
}
