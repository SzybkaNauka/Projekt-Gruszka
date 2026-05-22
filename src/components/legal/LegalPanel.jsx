import React, { useState } from 'react';
import WhiteRavenLogo from '../WhiteRavenLogo.jsx';
import { communityRules } from '../../legal/communityRules.js';
import { privacyPolicy } from '../../legal/privacyPolicy.js';
import { termsOfService } from '../../legal/termsOfService.js';

const rightsDoc = {
  title: 'PRAWA ZASTRZEŻONE',
  version: '2026',
  sections: [
    ['Prawa zastrzeżone', [
      '"Gruszka Katapulta", elementy gry, kod, grafika proceduralna, postacie, pojazdy, teksty, mechaniki, nazwy, logo i branding White Raven Studio są chronione prawem. Kopiowanie, rozpowszechnianie, modyfikowanie, sprzedaż lub wykorzystywanie elementów gry poza dozwolonym zakresem jest zabronione bez zgody White Raven Studio.',
      '"White Raven Studio" jest nazwą marki/projektu używaną przez twórców gry.',
      '© 2026 White Raven Studio. Wszelkie prawa zastrzeżone.',
    ]],
    ['TODO przed publikacją', [
      'Sprawdzić dostępność nazwy.',
      'Rozważyć rejestrację znaku.',
      'Sprawdzić domenę.',
      'Sprawdzić App Store/Google Play naming.',
    ]],
  ],
};

const contactDoc = {
  title: 'KONTAKT',
  version: '2026',
  sections: [
    ['Kontakt i zgłoszenia', [
      `Email: ${import.meta.env.VITE_CONTACT_EMAIL || 'Kontakt zostanie uzupelniony'}`,
      `Strona: ${import.meta.env.VITE_STUDIO_WEBSITE || 'Strona zostanie uzupelniona'}`,
      `Social: ${import.meta.env.VITE_STUDIO_SOCIAL_URL || 'Social zostanie uzupelniony'}`,
    ]],
  ],
};

const docs = {
  terms: { label: 'Regulamin', doc: termsOfService },
  privacy: { label: 'Prywatność', doc: privacyPolicy },
  community: { label: 'Zasady społeczności', doc: communityRules },
  rights: { label: 'Licencje / Prawa zastrzeżone', doc: rightsDoc },
  contact: { label: 'Kontakt', doc: contactDoc },
};

export default function LegalPanel({ initialTab = 'terms', onAccept, onBack }) {
  const [tab, setTab] = useState(docs[initialTab] ? initialTab : 'terms');
  const current = docs[tab].doc;

  return (
    <div className="legal-shell">
      <div className="legal-header">
        <WhiteRavenLogo variant="footer" />
        <button className="secondary-button compact" onClick={onBack}>Zamknij</button>
      </div>
      <div className="legal-tabs" role="tablist">
        {Object.entries(docs).map(([key, item]) => (
          <button className={key === tab ? 'active' : ''} key={key} onClick={() => setTab(key)}>{item.label}</button>
        ))}
      </div>
      <article className="legal-document">
        <h2>{current.title}</h2>
        <p className="legal-version">Wersja: {current.version}</p>
        {current.short && <p className="legal-lead">{current.short}</p>}
        {current.sections.map(([title, items]) => (
          <section key={title}>
            <h3>{title}</h3>
            <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ))}
      </article>
      <div className="legal-actions">
        {onAccept && <button className="primary-button" onClick={onAccept}>Akceptuję</button>}
        <button className="secondary-button" onClick={onBack}>Zamknij</button>
      </div>
    </div>
  );
}
