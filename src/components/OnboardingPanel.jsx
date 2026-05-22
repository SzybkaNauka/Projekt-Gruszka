import React from 'react';

export default function OnboardingPanel({ onGuest, onLogin, onSignup, onClose }) {
  return (
    <section className="panel-screen onboarding-panel">
      <div className="online-panel">
        <h2>Witaj w Gruszka Katapulta</h2>
        <p>Dowiez gruszke, zbieraj Premium Stars, walcz w DUEL i odblokowuj kosmetyki. Konto daje ranking, DUEL, nagrody i progres online, ale gosc moze grac od razu.</p>
        <div className="duel-browser-grid">
          <div><h3>Sterowanie</h3><p>Lewa reka steruje, prawa odpala SKOK. W DUEL dochodzi osobny POWER.</p></div>
          <div><h3>Codziennie</h3><p>Daily Challenge, weekly tournament, streaki i pestki.</p></div>
          <div><h3>Fair PvP</h3><p>Power-upy sa arcade, ale bez platnej przewagi.</p></div>
        </div>
        <div className="menu-actions">
          <button className="primary-button" onClick={onGuest}>Graj jako gosc</button>
          <button className="secondary-button" onClick={onSignup}>Zaloz konto</button>
          <button className="secondary-button" onClick={onLogin}>Mam konto</button>
          <button className="secondary-button" onClick={onClose}>Pozniej</button>
        </div>
      </div>
    </section>
  );
}
