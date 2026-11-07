import {StrictMode, useEffect, useState, type FormEvent} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function AuthGate() {
  const [authRequired, setAuthRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to check sign-in status.');
        return (await response.json()) as { authRequired: boolean; authenticated: boolean };
      })
      .then((session) => {
        if (!active) return;
        setAuthRequired(session.authRequired);
        setAuthenticated(session.authenticated);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to connect to the server.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Sign-in failed.');
      }
      setPassword('');
      setAuthenticated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
    }
  }

  async function handleLogout() {
    setError('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Sign-out failed.');
      setAuthenticated(false);
      setUsername('');
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-out failed.');
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-950" aria-label="Loading sign-in" />;
  if (error && !authRequired && !authenticated) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-sm text-red-300">{error}</main>;
  }
  if (!authRequired) return <App />;
  if (authenticated) {
    return (
      <>
        <button
          type="button"
          onClick={handleLogout}
          className="fixed right-4 top-4 z-[100] rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
        >
          Sign out
        </button>
        {error && (
          <p role="alert" className="fixed right-4 top-14 z-[100] rounded bg-red-950 p-2 text-xs text-red-200">
            {error}
          </p>
        )}
        <App />
      </>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-xl font-semibold">Sign in to Panini Studio</h1>
        <label className="block space-y-1 text-sm">
          <span>Username</span>
          <input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 p-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 p-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <button type="submit" className="w-full rounded bg-cyan-600 p-2 font-medium hover:bg-cyan-500">Sign in</button>
      </form>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
);
