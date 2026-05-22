import React, { useState } from 'react';
import WhiteRavenLogo from './WhiteRavenLogo.jsx';
import { COMMUNITY_VERSION, PRIVACY_VERSION, TERMS_VERSION } from '../legal/legalVersions.js';

export default function FirstRunConsentPanel({ playtest = false, onOpenLegal, onAccept, onClose }) {
  const [required, setRequired] = useState({ terms: false, privacy: false, community: false });
  const [analyticsConsent, setAnalyticsConsent] = useState(Boolean(playtest));
  const [marketingConsent, setMarketingConsent] = useState(false);
  const canAccept = required.terms && required.privacy && required.community;

  return (
    <section className="consent-backdrop" role="dialog" aria-modal="true">
      <div className="consent-panel">
        <WhiteRavenLogo variant="full" />
        <h2>Start gry i zgody</h2>
        <p>Gruszka Katapulta ma funkcje online: DUEL PvP, rankingi, znajomych, profil i czat, jeśli jest włączony. Email służy do logowania i nie jest publiczny; publiczny jest nick.</p>
        <div className="consent-version-row">
          <span>Regulamin {TERMS_VERSION}</span>
          <span>Prywatność {PRIVACY_VERSION}</span>
          <span>Zasady {COMMUNITY_VERSION}</span>
        </div>
        <div className="consent-checks">
          <label><input type="checkbox" checked={required.terms} onChange={(e) => setRequired((v) => ({ ...v, terms: e.target.checked }))} /> Akceptuję Regulamin gry.</label>
          <label><input type="checkbox" checked={required.privacy} onChange={(e) => setRequired((v) => ({ ...v, privacy: e.target.checked }))} /> Zapoznałem/am się z Polityką prywatności.</label>
          <label><input type="checkbox" checked={required.community} onChange={(e) => setRequired((v) => ({ ...v, community: e.target.checked }))} /> Akceptuję Zasady społeczności i fair play.</label>
        </div>
        <div className="consent-optional">
          <strong>Zgody opcjonalne</strong>
          <label><input type="checkbox" checked={analyticsConsent} onChange={(e) => setAnalyticsConsent(e.target.checked)} /> Zgadzam się na anonimowe statystyki playtestowe pomagające ulepszać grę.</label>
          <label><input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} /> Chcę otrzymywać informacje o nowościach White Raven Studio.</label>
        </div>
        <div className="consent-links">
          <button onClick={() => onOpenLegal?.('terms')}>Regulamin</button>
          <button onClick={() => onOpenLegal?.('privacy')}>Polityka prywatności</button>
          <button onClick={() => onOpenLegal?.('community')}>Zasady społeczności</button>
        </div>
        <div className="menu-actions">
          <button className="primary-button" disabled={!canAccept} onClick={() => onAccept?.({ analyticsConsent, marketingConsent })}>Akceptuję i przechodzę dalej</button>
          {onClose && <button className="secondary-button" onClick={onClose}>Później</button>}
        </div>
        {!canAccept && <p className="consent-warning">Funkcje online i zapis konta wymagają akceptacji dokumentów.</p>}
      </div>
    </section>
  );
}
