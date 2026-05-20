import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { sendMagicLink, signInWithEmail, signUpWithEmail } from '../services/authService.js';
import { checkUsernameAvailable, ensureProfile, validateUsernameRules } from '../services/profileService.js';

export default function LoginPanel({ onDone }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setStatus('Supabase nie jest skonfigurowany. Uzupełnij plik .env.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      if (mode === 'magic') {
        await sendMagicLink(email);
        setStatus('Magic link wysłany na email.');
      } else if (mode === 'signup') {
        // validate username
        const v = validateUsernameRules(username);
        if (!v.ok) {
          setStatus(v.message);
          setBusy(false);
          return;
        }
        const available = await checkUsernameAvailable(v.username);
        if (!available) {
          setStatus('Ten nick jest już zajęty.');
          setBusy(false);
          return;
        }
        const data = await signUpWithEmail(email, password, { username: v.username, display_name: v.username });
        // Create the profile only when Supabase also returned an active session.
        // If email confirmation is enabled, App will create it after the first login.
        try {
          if (data?.session && data?.user) {
            await ensureProfile(data.user, { username: v.username });
          }
          if (data?.session) {
            setStatus('Konto utworzone i zalogowane. Ranking jest gotowy.');
            onDone?.();
          } else {
            setStatus('Konto utworzone. Sprawdź email, jeśli Supabase wymaga potwierdzenia. Profil utworzy się automatycznie po pierwszym logowaniu.');
          }
        } catch (e) {
          if (e?.code === 'username_taken' || (e?.message || '').toLowerCase().includes('duplicate')) {
            setStatus('Ten nick jest już zajęty. Wybierz inny.');
          } else {
            setStatus(e?.message || 'Błąd przy tworzeniu profilu.');
          }
        }
      } else {
        await signInWithEmail(email, password);
        onDone?.();
      }
    } catch (error) {
      setStatus(error.message || 'Logowanie nie powiodło się.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="online-panel">
      <h2>Zaloguj gruszkę</h2>
      <p>Możesz grać jako gość. Konto jest potrzebne tylko do rankingu online i znajomych.</p>
      <form onSubmit={submit} className="online-form">
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="email" required />
        {mode !== 'magic' && <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="hasło" minLength={6} required />}
        {mode === 'signup' && (
          <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" placeholder="nick (publiczny)" minLength={3} maxLength={20} required />
        )}
        <button className="primary-button" disabled={busy}>{mode === 'signup' ? 'Utwórz konto' : mode === 'magic' ? 'Wyślij magic link' : 'Zaloguj'}</button>
      </form>
      <div className="tab-row">
        <button onClick={() => setMode('login')}>Login</button>
        <button onClick={() => setMode('signup')}>Rejestracja</button>
        <button onClick={() => setMode('magic')}>Magic link</button>
      </div>
      {status && <p className="online-status">{status}</p>}
    </section>
  );
}
