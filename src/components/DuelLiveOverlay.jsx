import React from 'react';
import { DUEL_POWERUPS } from '../game/constants.js';

function teamScore(players, team) {
  return players
    .filter((player) => player.team === team)
    .reduce((sum, player) => sum + Number(player.score || 0) + (player.finished ? 1500 : 0) + (player.premium_star_collected ? 900 : 0), 0);
}

export default function DuelLiveOverlay({ room, players = [], currentUserId, heldPowerup, duelHud, debug = false, eventsCount = 0 }) {
  if (!room) return null;
  const sorted = [...players].sort((a, b) => Number(b.progress_percent || 0) - Number(a.progress_percent || 0)).slice(0, 5);
  const currentPlayer = players.find((player) => player.user_id === currentUserId);
  const held = heldPowerup || (currentPlayer?.held_powerup ? DUEL_POWERUPS[currentPlayer.held_powerup] : null);
  return (
    <div className="duel-live-overlay">
      <div className="duel-team-score">
        <span className="team-a">A {teamScore(players, 'A')}</span>
        <strong>{room.mode} DUEL</strong>
        <span className="team-b">B {teamScore(players, 'B')}</span>
      </div>
      <div className="duel-held-power">
        <span>{held?.icon || 'POWER'}</span>
        <strong>{held?.name || 'Brak power-upa'}</strong>
        <em>{held ? 'E / Shift: POWER' : (duelHud?.status || room.status)}</em>
      </div>
      <div className="duel-progress-list">
        {sorted.map((player) => (
          <div className={`duel-progress-row team-${String(player.team || 'A').toLowerCase()}`} key={player.user_id}>
            <span>{player.display_name || player.username || 'Gracz'}</span>
            <div className="duel-progress-bar"><i style={{ width: `${Math.min(100, Number(player.progress_percent || 0))}%` }} /></div>
            <b>{Math.round(Number(player.progress_percent || 0))}%</b>
          </div>
        ))}
      </div>
      {debug && (
        <div className="duel-debug">
          <span>{room.status}</span>
          <span>players {players.length}</span>
          <span>snap {currentPlayer?.last_snapshot_at ? Math.max(0, Math.round((Date.now() - new Date(currentPlayer.last_snapshot_at).getTime()) / 1000)) : '?'}s</span>
          <span>events {eventsCount}</span>
        </div>
      )}
    </div>
  );
}
