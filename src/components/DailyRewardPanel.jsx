import React, { useEffect, useState } from 'react';
import { claimDailyStreak } from '../services/liveOpsService.js';

export default function DailyRewardPanel({ session, onClose }) {
  const [reward, setReward] = useState(null);

  useEffect(() => {
    if (!session?.user) return;
    claimDailyStreak(session.user.id).then(setReward).catch(() => {});
  }, [session?.user?.id]);

  if (!session?.user || !reward || reward.alreadyClaimed) return null;

  return (
    <div className="overlay-panel daily-reward-panel">
      <h2>Codzienna nagroda</h2>
      <p>Dzien {reward.current_streak}. Dostajesz {reward.reward} pestek.</p>
      <button className="primary-button" onClick={onClose}>Super</button>
    </div>
  );
}
