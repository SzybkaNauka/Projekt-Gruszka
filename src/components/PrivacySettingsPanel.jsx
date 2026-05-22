import React, { useState } from 'react';
import { exportLocalData, getConsentState, saveOptionalConsents } from '../services/consentService.js';
import BuildInfoBadge from './BuildInfoBadge.jsx';

export default function PrivacySettingsPanel({ playtest, analyticsEnabled, marketingConsent, showStudioIntro, onAnalyticsChange, onMarketingChange, onShowIntroChange, onOpenLegal, onCopyLocalData, onClearGuestData, onLogout, onBack }) {
  const [localAnalytics, setLocalAnalytics] = useState(analyticsEnabled);
  const [localMarketing, setLocalMarketing] = useState(marketingConsent);
  const contactTarget = import.meta.env.VITE_CONTACT_EMAIL || '';
  const contactLabel = contactTarget || 'Kontakt zostanie uzupelniony';
  const consent = getConsentState(playtest);

  function updateAnalytics(next) {
    setLocalAnalytics(next);
    saveOptionalConsents({ analyticsConsent: next, marketingConsent: localMarketing });
    onAnalyticsChange?.(next);
  }

  function updateMarketing(next) {
    setLocalMarketing(next);
    saveOptionalConsents({ analyticsConsent: localAnalytics, marketingConsent: next });
    onMarketingChange?.(next);
  }

  async function copyLocalData() {
    const data = exportLocalData();
    await navigator.clipboard?.writeText(data).catch(() => {});
    onCopyLocalData?.();
  }

  return (
    <div className="legal-shell privacy-settings">
      <div className="panel-header">
        <h2>Prywatność i dane</h2>
        <button className="secondary-button compact" onClick={onBack}>Menu</button>
      </div>
      <BuildInfoBadge compact online={navigator.onLine} />
      <div className="settings-list">
        <label><span>Anonimowe statystyki</span><input type="checkbox" checked={localAnalytics} onChange={(e) => updateAnalytics(e.target.checked)} /></label>
        <label><span>Marketing/newsletter</span><input type="checkbox" checked={localMarketing} onChange={(e) => updateMarketing(e.target.checked)} /></label>
        <label><span>Pokaż intro przy starcie</span><input type="checkbox" checked={showStudioIntro} onChange={(e) => onShowIntroChange?.(e.target.checked)} /></label>
      </div>
      <div className="consent-version-row">
        <span>Regulamin: {consent.versions.terms || 'brak'}</span>
        <span>Prywatność: {consent.versions.privacy || 'brak'}</span>
        <span>Zasady: {consent.versions.community || 'brak'}</span>
      </div>
      <div className="menu-actions">
        <button className="secondary-button" onClick={() => onOpenLegal?.('terms')}>Pokaż regulamin</button>
        <button className="secondary-button" onClick={() => onOpenLegal?.('privacy')}>Pokaż politykę prywatności</button>
        <button className="secondary-button" onClick={() => onOpenLegal?.('community')}>Pokaż zasady społeczności</button>
        <button className="secondary-button" onClick={copyLocalData}>Eksportuj/kopiuj moje dane lokalne</button>
        <button className="danger-button" onClick={onClearGuestData}>Usuń lokalne dane gościa</button>
        <button className="secondary-button" onClick={onLogout}>Wyloguj</button>
        {contactTarget ? <a className="secondary-button link-button" href={`mailto:${contactTarget}?subject=${encodeURIComponent('Usunięcie konta Gruszka Katapulta')}`}>Poproś o usunięcie konta</a> : <button className="secondary-button" disabled>Poproś o usunięcie konta</button>}
      </div>
      <p className="legal-lead">Aby usunąć konto online, skontaktuj się z White Raven Studio: {contactLabel}.</p>
    </div>
  );
}
