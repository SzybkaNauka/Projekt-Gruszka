import React, { useEffect, useState } from 'react';
import { buyShopItem, getShopItems, getWallet } from '../services/liveOpsService.js';

export default function ShopPanel({ session, onBack }) {
  const [items, setItems] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [status, setStatus] = useState('');

  async function load() {
    const [nextItems, nextWallet] = await Promise.all([
      getShopItems().catch(() => []),
      session?.user ? getWallet(session.user.id).catch(() => null) : Promise.resolve(null),
    ]);
    setItems(nextItems);
    setWallet(nextWallet);
  }

  useEffect(() => { load(); }, [session?.user?.id]);

  async function buy(item) {
    if (!session?.user) {
      setStatus('Zaloguj sie, zeby kupowac kosmetyki.');
      return;
    }
    try {
      await buyShopItem(session.user.id, item);
      setStatus('Kupiono kosmetyk.');
      await load();
    } catch (error) {
      setStatus(error.message || 'Zakup nieudany.');
    }
  }

  return (
    <section className="online-panel liveops-panel">
      <h2>Sklep kosmetyczny</h2>
      <p>Pestki kupuja tylko kosmetyki. Zero pay-to-win.</p>
      <div className="save-strip"><span>Pestki: {wallet?.seeds || 0}</span></div>
      <div className="cosmetic-grid">
        {items.map((item) => (
          <div className={`cosmetic-card rarity-${item.cosmetics?.rarity || 'common'}`} key={item.id}>
            <strong>{item.cosmetics?.name || item.cosmetic_id}</strong>
            <span>{item.cosmetics?.type}</span>
            <p>{item.cosmetics?.description}</p>
            <button className="primary-button compact" onClick={() => buy(item)}>{item.price_seeds} pestek</button>
          </div>
        ))}
      </div>
      <p className="small-note">Future TODO: RevenueCat/App Store/Google Play, remove ads, premium pass. Nie teraz.</p>
      {status && <p className="online-status">{status}</p>}
      <button className="secondary-button" onClick={onBack}>Menu</button>
    </section>
  );
}
