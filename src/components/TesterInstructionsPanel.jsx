import React from 'react';

export function getTesterScript() {
  const link = typeof window !== 'undefined' ? window.location.origin : '[LINK]';
  return `Hej! Testujemy "Gruszka Katapulta" od White Raven Studio.

Link:
${link}

Co sprawdzic:
1. Wejdz w link i zaakceptuj regulamin.

2. Kliknij "Graj" i przejdz 1-3 poziomy.

3. Na telefonie sprawdz sterowanie:
   lewa reka = D-pad,
   prawa reka = SKOK.

4. Zaloz konto i ustaw nick.
   Email nie jest publiczny.

5. Sprawdz ranking, profil i znajomych.

6. Jesli mozesz, sprawdz DUEL PvP z druga osoba.

7. Zainstaluj jako PWA / dodaj do ekranu glownego.

8. Jesli cos sie zepsuje, kliknij "Kopiuj raport bledu" i wyslij mi:
   - raport,
   - screen,
   - model telefonu,
   - przegladarke,
   - co kliknales przed bledem.

Dzieki za testy!`;
}

export default function TesterInstructionsPanel({ onBack }) {
  async function copyInstructions() {
    await navigator.clipboard?.writeText(getTesterScript()).catch(() => {});
  }

  return (
    <div className="legal-shell tester-instructions">
      <div className="panel-header">
        <h2>Jak testowac Gruszke Katapulte</h2>
        <button className="secondary-button compact" onClick={onBack}>Menu</button>
      </div>
      <div className="studio-about-grid">
        <article><h3>1. Gosc</h3><p>Zagraj jako gosc i sprawdz, czy start jest prosty.</p></article>
        <article><h3>2. Level 1-3</h3><p>Sprawdz sterowanie, win/lose screen i plynnosc.</p></article>
        <article><h3>3. Konto</h3><p>Zaloz konto. Email ma zostac prywatny, publiczny jest nick.</p></article>
        <article><h3>4. Ranking</h3><p>Sprawdz, czy wynik i profil laduja sie bez emaila publicznego.</p></article>
        <article><h3>5. Znajomi</h3><p>Dodaj znajomego i sprawdz zaproszenia.</p></article>
        <article><h3>6. DUEL 1v1</h3><p>Dwa konta, kod pokoju, gotowosc, countdown, ghost, POWER, wynik.</p></article>
        <article><h3>7. PWA</h3><p>Dodaj gre do ekranu glownego i uruchom z ikony.</p></article>
        <article><h3>8. Raport</h3><p>Gdy cos peknie, uzyj Kopiuj raport bledu i wyslij screen.</p></article>
      </div>
      <div className="menu-actions">
        <button className="primary-button" onClick={copyInstructions}>Kopiuj instrukcje dla kolegi</button>
      </div>
    </div>
  );
}
