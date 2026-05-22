import React, { useEffect, useState } from 'react';
import { DAILY_MODIFIERS, getDailyLeaderboard, getTodayChallenge } from '../services/liveOpsService.js';

function msToClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}`;
}

export default function DailyChallengePanel({ session, onPlay, onBack }) {
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let alive = true;
    getTodayChallenge().then(async (next) => {
      if (!alive) return;
      setChallenge(next);
      const rows = next.id ? await getDailyLeaderboard(next.id).catch(() => []) : [];
      if (alive) setLeaderboard(rows);
    }).catch(() => {});
    const timer = setInterval(() => {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      setRemaining(tomorrow.getTime() - Date.now());
    }, 1000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const modifier = challenge?.modifier || DAILY_MODIFIERS[challenge?.modifier_key];

  return (
    <section className="online-panel liveops-panel">
      <h2>Dzienne Wyzwanie</h2>
      <div className="liveops-hero">
        <strong>{challenge ? `Level ${challenge.level_id}: ${challenge.level?.name || 'Trasa dnia'}` : 'Ladowanie...'}</strong>
        <span>{modifier?.name || 'Modifier'}</span>
        <p>{modifier?.description || 'Codzienny ranking i osobny wynik.'}</p>
        <em>Reset za {msToClock(remaining)}</em>
      </div>
      <div className="menu-actions">
        <button className="primary-button" disabled={!challenge} onClick={() => onPlay?.(challenge)}>Graj daily</button>
        <button className="secondary-button" onClick={onBack}>Menu</button>
      </div>
      <h3>Ranking dzienny</h3>
      <div className="duel-progress-list">
        {leaderboard.map((row, index) => (
          <div className="duel-progress-row" key={row.id}>
            <span>#{index + 1} @{row.username}</span>
            <b>{row.score}</b>
          </div>
        ))}
        {!leaderboard.length && <p className="small-note">{session?.user ? 'Brak wynikow. Mozesz byc pierwszy.' : 'Zaloguj sie, zeby zapisac wynik.'}</p>}
      </div>
    </section>
  );
}
