import React from 'react';
import BuildInfoBadge from './BuildInfoBadge.jsx';
import { getTesterScript } from './TesterInstructionsPanel.jsx';
import { APP_VERSION, BUILD_CHANNEL, BUILD_DATE, getRuntimeEnvironment, isFirebaseFrontendConfigured, isPwaMode, isSupabaseFrontendConfigured } from '../config/appConfig.js';

function duelInstructions() {
  return [
    'DUEL 1v1 test:',
    '1. Otwórz grę w dwóch oknach lub dwóch przeglądarkach.',
    '2. Zaloguj dwa różne konta.',
    '3. Konto A tworzy DUEL 1v1.',
    '4. Konto A kopiuje kod albo link pokoju.',
    '5. Konto B dołącza, oba konta klikają Gotowy.',
    '6. Host klika Start DUEL.',
    '7. Sprawdź countdown, auto-start, ghost przeciwnika, POWER, wynik i rewanż.',
  ].join('\n');
}

export default function PlaytestPanel({
  buildInfo,
  online,
  session,
  profile,
  performanceMode,
  touchControlsEnabled,
  duelRoom,
  onOpenLevel,
  onUnlockAll,
  onResetGuest,
  onCopyDebugReport,
  onOpenDuel,
  onLeaveDuel,
  onOpenContact,
  onOpenTesterInstructions,
  onBack,
}) {
  const contactTarget = import.meta.env.VITE_CONTACT_EMAIL || '';
  const statusRows = [
    ['app version', APP_VERSION],
    ['build date', BUILD_DATE],
    ['channel', BUILD_CHANNEL],
    ['environment', getRuntimeEnvironment()],
    ['online/offline', online ? 'online' : 'offline'],
    ['account/guest', session?.user ? 'account' : 'guest'],
    ['profile', profile ? 'yes' : 'no'],
    ['Supabase configured', isSupabaseFrontendConfigured() ? 'yes' : 'no'],
    ['Firebase configured', isFirebaseFrontendConfigured() ? 'yes' : 'no'],
    ['PWA installed', isPwaMode() ? 'yes' : 'no'],
    ['performance mode', performanceMode ? 'ON' : 'OFF'],
    ['touch controls', touchControlsEnabled ? 'ON' : 'OFF'],
  ];

  async function copyText(text) {
    await navigator.clipboard?.writeText(text).catch(() => {});
  }

  const duelStatus = JSON.stringify({
    roomId: duelRoom?.id || null,
    code: duelRoom?.code || null,
    status: duelRoom?.status || null,
    mode: duelRoom?.mode || null,
  }, null, 2);

  return (
    <div className="legal-shell playtest-panel">
      <div className="panel-header">
        <h2>Playtest Panel</h2>
        <button className="secondary-button compact" onClick={onBack}>Menu</button>
      </div>
      <BuildInfoBadge online={online} />
      <section className="playtest-section">
        <h3>Status gry</h3>
        <div className="playtest-status-grid">
          {statusRows.map(([label, value]) => <span key={label}><strong>{label}</strong>{value}</span>)}
        </div>
      </section>
      <section className="playtest-section">
        <h3>Szybkie testy</h3>
        <div className="menu-actions">
          <button className="secondary-button" onClick={() => onOpenLevel(1)}>Otwórz level 1</button>
          <button className="secondary-button" onClick={() => onOpenLevel(10)}>Otwórz level 10</button>
          <button className="secondary-button" onClick={() => onOpenLevel(50)}>Otwórz level 50 debug</button>
          <button className="secondary-button" onClick={onUnlockAll}>Odblokuj wszystko lokalnie</button>
          <button className="danger-button" onClick={onResetGuest}>Reset lokalnych danych gościa</button>
          <button className="secondary-button" onClick={onCopyDebugReport}>Kopiuj debug report</button>
        </div>
      </section>
      <section className="playtest-section">
        <h3>DUEL test</h3>
        <div className="menu-actions">
          <button className="secondary-button" onClick={onOpenDuel}>Otwórz DUEL</button>
          <button className="secondary-button" onClick={() => copyText(duelInstructions())}>Kopiuj instrukcję testu 1v1</button>
          <button className="secondary-button" onClick={() => copyText(duelStatus)}>Kopiuj status aktywnego DUEL</button>
          <button className="danger-button" onClick={onLeaveDuel}>Porzuć aktywny DUEL</button>
        </div>
      </section>
      <section className="playtest-section">
        <h3>Zgłaszanie błędu</h3>
        <div className="menu-actions">
          <button className="secondary-button" onClick={onCopyDebugReport}>Kopiuj raport błędu</button>
          <button className="secondary-button" onClick={onOpenContact}>Otwórz ContactPanel</button>
          {contactTarget ? <a className="secondary-button link-button" href={`mailto:${contactTarget}`}>Mailto do kontaktu</a> : <button className="secondary-button" disabled>Mailto do kontaktu</button>}
          <button className="secondary-button" onClick={() => copyText(getTesterScript())}>Kopiuj test script</button>
          <button className="secondary-button" onClick={onOpenTesterInstructions}>Instrukcje testerów</button>
        </div>
      </section>
      <section className="playtest-section">
        <h3>Supabase checklist</h3>
        <ul>
          <li>schema.sql odpalone, RLS enabled, user_consents i support_reports działają.</li>
          <li>profiles username unique, level_scores 1-50, duel tables i helper functions istnieją.</li>
          <li>Edge Function finalize-duel deployed, sekrety SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY ustawione.</li>
          <li>Auth Site URL = Vercel URL, Redirect URLs = localhost + Vercel.</li>
          <li>Realtime enabled dla duel tables.</li>
        </ul>
      </section>
    </div>
  );
}
