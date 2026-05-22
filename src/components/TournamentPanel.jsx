import React, { useEffect, useState } from 'react';
import { levels } from '../game/levels.js';
import { getActiveWeeklyTournament, getWeeklyLeaderboard } from '../services/liveOpsService.js';

export default function TournamentPanel({ onPlayLevel, onBack }) {
  const [tournament, setTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    let alive = true;
    getActiveWeeklyTournament().then(async (next) => {
      if (!alive) return;
      setTournament(next);
      const rows = next.id ? await getWeeklyLeaderboard(next.id).catch(() => []) : [];
      if (alive) setLeaderboard(rows);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <section className="online-panel liveops-panel">
      <h2>Turniej Tygodnia</h2>
      <p>5 tras, suma najlepszych wynikow, nagrody kosmetyczne i badge.</p>
      <div className="level-grid">
        {(tournament?.level_ids || [1, 5, 10, 20, 30]).map((levelId) => {
          const level = levels[levelId - 1];
          return (
            <button className="level-tile" key={levelId} onClick={() => onPlayLevel?.(levelId)}>
              <strong>Level {levelId}</strong>
              <span>{level?.name || 'Trasa'}</span>
              <em>Turniej</em>
            </button>
          );
        })}
      </div>
      <h3>Ranking tygodnia</h3>
      <div className="duel-progress-list">
        {leaderboard.map((row, index) => (
          <div className="duel-progress-row" key={row.id}>
            <span>#{index + 1} {row.user_id.slice(0, 8)}</span>
            <b>{row.total_score}</b>
            <em>{row.completed_levels}/5</em>
          </div>
        ))}
        {!leaderboard.length && <p className="small-note">Brak wynikow turniejowych.</p>}
      </div>
      <div className="menu-actions">
        <button className="secondary-button" onClick={onBack}>Menu</button>
      </div>
    </section>
  );
}
