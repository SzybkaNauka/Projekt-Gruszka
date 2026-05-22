import React, { useEffect, useMemo, useState } from 'react';
import { equipCosmetic, getCosmeticsState } from '../services/liveOpsService.js';

export default function CosmeticsPanel({ session, onBack }) {
  const [state, setState] = useState({ cosmetics: [], owned: [], loadout: null });
  const [filter, setFilter] = useState('all');
  const [status, setStatus] = useState('');

  async function load() {
    if (!session?.user) return;
    const next = await getCosmeticsState(session.user.id).catch(() => ({ cosmetics: [], owned: [], loadout: null }));
    setState(next);
  }

  useEffect(() => { load(); }, [session?.user?.id]);

  const ownedIds = useMemo(() => new Set(state.owned.map((item) => item.cosmetic_id)), [state.owned]);
  const cosmetics = state.cosmetics.filter((item) => filter === 'all' || item.type === filter);

  async function equip(item) {
    try {
      await equipCosmetic(session.user.id, item);
      setStatus(`${item.name} zalozone.`);
      await load();
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie zalozyc kosmetyku.');
    }
  }

  return (
    <section className="online-panel liveops-panel">
      <h2>Kosmetyki</h2>
      <div className="menu-actions">
        {['all', 'pear_skin', 'vehicle_skin', 'trail', 'profile_frame', 'victory_animation'].map((type) => (
          <button className="secondary-button compact" key={type} onClick={() => setFilter(type)}>{type}</button>
        ))}
      </div>
      <div className="cosmetic-grid">
        {cosmetics.map((item) => {
          const owned = ownedIds.has(item.id);
          return (
            <div className={`cosmetic-card rarity-${item.rarity}`} key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.type}</span>
              <em>{item.rarity}</em>
              <p>{item.description}</p>
              <button className="primary-button compact" disabled={!owned} onClick={() => equip(item)}>{owned ? 'Zaloz' : 'Zablokowane'}</button>
            </div>
          );
        })}
      </div>
      {status && <p className="online-status">{status}</p>}
      <button className="secondary-button" onClick={onBack}>Menu</button>
    </section>
  );
}
