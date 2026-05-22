import React, { useMemo, useState } from 'react';

export default function ContactPanel({ session, playerLabel, guestId, buildInfo, onBack }) {
  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const contactTarget = import.meta.env.VITE_CONTACT_EMAIL || '';
  const contactLabel = contactTarget || 'Kontakt zostanie uzupelniony';

  const debugReport = useMemo(() => [
    `Typ: ${type}`,
    `Temat: ${subject || '-'}`,
    `Opis: ${message || '-'}`,
    `Kontakt: ${contactEmail || '-'}`,
    `Zgoda na kontakt: ${contactConsent ? 'TAK' : 'NIE'}`,
    `User id: ${session?.user?.id || '-'}`,
    `Guest id: ${guestId || '-'}`,
    `Gracz: ${playerLabel || '-'}`,
    `Wersja: ${buildInfo?.version || '-'}`,
    `URL: ${typeof window !== 'undefined' ? window.location.href : '-'}`,
  ].join('\n'), [type, subject, message, contactEmail, contactConsent, session?.user?.id, guestId, playerLabel, buildInfo?.version]);

  async function copyReport() {
    await navigator.clipboard?.writeText(debugReport).catch(() => {});
  }

  const mailto = contactTarget ? `mailto:${contactTarget}?subject=${encodeURIComponent(`[Gruszka Katapulta] ${subject || type}`)}&body=${encodeURIComponent(debugReport)}` : null;

  return (
    <div className="legal-shell contact-panel">
      <div className="panel-header">
        <h2>Kontakt i zgłoszenia</h2>
        <button className="secondary-button compact" onClick={onBack}>Menu</button>
      </div>
      <div className="contact-grid">
        <button className={type === 'bug' ? 'active' : ''} onClick={() => setType('bug')}>Zgłoś błąd</button>
        <button className={type === 'player' ? 'active' : ''} onClick={() => setType('player')}>Zgłoś gracza</button>
        <button className={type === 'business' ? 'active' : ''} onClick={() => setType('business')}>Kontakt biznesowy</button>
        <button className={type === 'feedback' ? 'active' : ''} onClick={() => setType('feedback')}>Feedback</button>
        <button className={type === 'social' ? 'active' : ''} onClick={() => setType('social')}>Social / strona</button>
      </div>
      <label className="field-label">Temat<input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} /></label>
      <label className="field-label">Opis<textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={7} /></label>
      <label className="field-label">Email kontaktowy opcjonalnie<input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></label>
      {contactEmail && <label className="consent-inline"><input type="checkbox" checked={contactConsent} onChange={(e) => setContactConsent(e.target.checked)} /> Zgadzam się na kontakt w sprawie zgłoszenia.</label>}
      <pre className="debug-report">{debugReport}</pre>
      <p className="legal-lead">{contactLabel}</p>
      <div className="menu-actions">
        <button className="primary-button" onClick={copyReport}>Kopiuj zgłoszenie</button>
        {mailto ? <a className="secondary-button link-button" href={mailto}>Wyślij email</a> : <button className="secondary-button" disabled>Wyślij email</button>}
      </div>
    </div>
  );
}
