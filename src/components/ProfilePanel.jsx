import React, { useEffect, useMemo, useState } from 'react';
import { ensureProfile, getPlayerStats, getProfile, updateProfile } from '../services/profileService.js';
import { getSave } from '../game/storage.js';

const avatars = ['knight', 'winged', 'super', 'pirate', 'racer', 'gladiator', 'stunt', 'rocket', 'ninja', 'royal'];

const avatarLabels = {
  knight: 'Rycerz',
  winged: 'Skrzydlaty',
  super: 'Super',
  pirate: 'Piracki',
  racer: 'Wyścigowy',
  gladiator: 'Gladiator',
  stunt: 'Kaskader',
  rocket: 'Rakietowy',
  ninja: 'Ninja',
  royal: 'Królewski',
};

const titleByStars = [
  [0, 10, 'Początkująca Gruszka'],
  [11, 30, 'Kierowca Katapulty'],
  [31, 60, 'Warzywny Rozrabiaka'],
  [61, 90, 'Mistrz Lądowania'],
  [91, 120, 'Król Combo'],
  [121, 149, 'Legenda Trasy'],
  [150, 150, 'Boska Gruszka'],
];

function getTitle(stars) {
  return titleByStars.find(([min, max]) => stars >= min && stars <= max)?.[2] || 'Gruszka Wojownik';
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '—';
  }
}

export default function ProfilePanel({ session }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const save = useMemo(() => getSave(), []);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!session?.user) return;
      try {
        const existing = await getProfile(session.user.id);
        const nextProfile = existing || await ensureProfile(session.user);
        const nextStats = await getPlayerStats(session.user.id);
        if (alive) {
          setProfile(nextProfile);
          setStats(nextStats);
        }
      } catch (error) {
        if (alive) setStatus(error.message || 'Nie udało się wczytać profilu.');
      }
    }
    load();
    return () => { alive = false; };
  }, [session]);

  async function saveProfile() {
    if (!session?.user || !profile) return;
    setSaving(true);
    try {
      const next = await updateProfile(session.user.id, profile);
      setProfile(next);
      setStatus('Profil zapisany.');
    } catch (error) {
      setStatus(error.message || 'Nie udało się zapisać profilu.');
    } finally {
      setSaving(false);
    }
  }

  const totalStars = useMemo(() => Object.values(save.starsByLevel).reduce((sum, value) => sum + Number(value || 0), 0), [save.starsByLevel]);
  const completedLevels = useMemo(() => Object.keys(save.starsByLevel).length, [save.starsByLevel]);
  const title = useMemo(() => getTitle(totalStars), [totalStars]);

  if (!session?.user) {
    return (
      <section className="online-panel">
        <h2>Profil</h2>
        <p>Zaloguj się, aby utworzyć profil online.</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="online-panel">
        <h2>Profil</h2>
        <p>Ładowanie profilu...</p>
        {status && <p className="online-status">{status}</p>}
      </section>
    );
  }

  return (
    <section className="online-panel profile-panel">
      <div className="profile-top">
        <div className="profile-card preview-card">
          <div className={`pear-avatar avatar-${profile.avatar_pear}`}>
            <div className="pear-leaf" />
            <div className="pear-body" />
            <div className="pear-face">
              <div className="pear-eye left" />
              <div className="pear-eye right" />
              <div className="pear-mouth" />
            </div>
            <div className="pear-accessory" />
          </div>
          <div className="profile-meta">
            <strong>{profile.display_name || profile.username}</strong>
            <span>@{profile.username}</span>
            <span className="profile-badge">{title}</span>
            <span>{avatarLabels[profile.avatar_pear] || 'Klasyczna'} gruszka</span>
            <span className="profile-score">Rekord: {save.bestScore || 0}</span>
          </div>
        </div>

        <div className="profile-stats-card">
          <div className="stat-row"><strong>{profile.total_score || 0}</strong><span>Łączny wynik</span></div>
          <div className="stat-row"><strong>{profile.best_level || 1}</strong><span>Najlepszy level</span></div>
          <div className="stat-row"><strong>{completedLevels}/50</strong><span>Ukończone poziomy</span></div>
          <div className="stat-row"><strong>{totalStars}/150</strong><span>Gwiazdki</span></div>
          <div className="stat-row"><strong>{stats?.total_wins || 0}</strong><span>Wygrane</span></div>
          <div className="stat-row"><strong>{stats?.total_crashes || 0}</strong><span>Upadki</span></div>
          <div className="stat-row"><strong>{stats?.total_perfect_landings || 0}</strong><span>Perfecty</span></div>
          <div className="stat-row"><strong>{stats?.total_near_misses || 0}</strong><span>Near-missy</span></div>
        </div>
      </div>

      <div className="progress-panel">
        <div>
          <strong>Postęp kampanii</strong>
          <div className="progress-bar"><div style={{ width: `${(completedLevels / 50) * 100}%` }} /></div>
        </div>
        <div>
          <strong>Gwiazdy</strong>
          <div className="progress-bar"><div style={{ width: `${(totalStars / 150) * 100}%` }} /></div>
        </div>
      </div>

      <div className="profile-edit-grid">
        <label>
          Username
          <input value={profile.username || ''} onChange={(event) => setProfile({ ...profile, username: event.target.value })} />
        </label>
        <label>
          Nazwa
          <input value={profile.display_name || ''} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} />
        </label>
        <label>
          Tematyczna gruszka
          <select value={profile.avatar_pear || 'knight'} onChange={(event) => setProfile({ ...profile, avatar_pear: event.target.value })}>
            {avatars.map((avatar) => (
              <option key={avatar} value={avatar}>{avatarLabels[avatar] || avatar}</option>
            ))}
          </select>
        </label>
      </div>

      <button className="primary-button" type="button" onClick={saveProfile} disabled={saving}>{saving ? 'Zapis...' : 'Zapisz profil'}</button>
      {status && <p className="online-status">{status}</p>}
      <p className="small-note">Dołączenie: {formatDate(profile.created_at)}</p>
    </section>
  );
}
