import React from 'react';
import WhiteRavenLogo from './WhiteRavenLogo.jsx';
import BuildInfoBadge from './BuildInfoBadge.jsx';

function getContactConfig() {
  return {
    email: import.meta.env.VITE_CONTACT_EMAIL || 'Kontakt zostanie uzupelniony',
    website: import.meta.env.VITE_STUDIO_WEBSITE || 'Strona zostanie uzupelniona',
    social: import.meta.env.VITE_STUDIO_SOCIAL_URL || 'Social zostanie uzupelniony',
  };
}

export default function StudioAboutPanel({ onBack }) {
  const contact = getContactConfig();
  return (
    <div className="studio-about-panel legal-shell">
      <div className="legal-header">
        <WhiteRavenLogo variant="full" />
        <button className="secondary-button compact" onClick={onBack}>Menu</button>
      </div>
      <h2>White Raven Studio</h2>
      <BuildInfoBadge compact online={navigator.onLine} />
      <p className="legal-lead">White Raven Studio tworzy gry, aplikacje i cyfrowe projekty z charakterem. Łączymy prostą zabawę, rywalizację online, humor i dynamiczne mechaniki, żeby tworzyć rzeczy, które chce się odpalać ponownie.</p>
      <div className="studio-about-grid">
        <article><h3>Gry</h3><p>Tworzymy gry web/mobile, prototypy i dynamiczne projekty oparte o rywalizację, humor i replayability.</p></article>
        <article><h3>Aplikacje</h3><p>Budujemy proste, użyteczne aplikacje i narzędzia cyfrowe.</p></article>
        <article><h3>Eksperymenty</h3><p>Testujemy nowe pomysły, systemy online, PvP, rankingi, sezonowe wydarzenia i społecznościowe funkcje.</p></article>
        <article><h3>Kontakt</h3><p>Masz feedback albo pomysł? Skontaktuj się z White Raven Studio.</p><small>{contact.email} • {contact.website} • {contact.social}</small></article>
      </div>
    </div>
  );
}
