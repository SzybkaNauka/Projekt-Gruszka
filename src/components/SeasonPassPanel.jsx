import React, { useEffect, useState } from 'react';
import { getPlayerXp, getSeasonRewards } from '../services/liveOpsService.js';

export default function SeasonPassPanel({ session, onBack }) {
  const [xp, setXp] = useState(null);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    if (!session?.user) return;
    getPlayerXp(session.user.id).then(setXp).catch(() => {});
    getSeasonRewards().then(setRewards).catch(() => {});
  }, [session?.user?.id]);

  const level = xp?.level || 1;
  const progress = xp ? Math.min(100, ((xp.xp % 250) / 250) * 100) : 0;

  return (
    <section className="online-panel liveops-panel">
      <h2>Season Pass</h2>
      <p>Kosmetyczny progres sezonowy. Bez pay-to-win, bez platnych power-upow.</p>
      <div className="progress-panel">
        <strong>Poziom {level}</strong>
        <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
        <span>{xp?.xp || 0} XP</span>
      </div>
      <div className="season-reward-track">
        {rewards.slice(0, 20).map((reward) => (
          <div className={`season-reward ${level >= reward.level ? 'claimed' : ''}`} key={`${reward.level}-${reward.reward_key}`}>
            <strong>{reward.level}</strong>
            <span>{reward.reward_type}</span>
            <em>{reward.reward_key}</em>
          </div>
        ))}
      </div>
      <p className="small-note">Premium pass i platnosci: TODO na przyszlosc. Ten pass pokazuje tylko kosmetyczna strukture.</p>
      <button className="secondary-button" onClick={onBack}>Menu</button>
    </section>
  );
}
