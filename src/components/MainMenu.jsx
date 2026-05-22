import React, { useState } from 'react';
import InstallPrompt from './InstallPrompt.jsx';
import WhiteRavenLogo from './WhiteRavenLogo.jsx';

export default function MainMenu({
  save,
  highestUnlocked,
  totalStars,
  totalPremiumStars,
  levelsCount,
  playerLabel,
  networkLabel,
  onlineStatus,
  playtest,
  performanceMode,
  session,
  showStudioIntro,
  onPlay,
  onScreen,
  onToggleSound,
  onToggleTouchControls,
  onTogglePerformance,
  onToggleAnalytics,
  onToggleIntro,
  onFullscreen,
  fullscreenLabel,
  touchControlsEnabled,
  analyticsEnabled,
  onLogout,
  onUnlockAllDev,
  devEnabled,
  onClearProgress,
  onOpenPlaytest,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const bgClass = performanceMode ? 'simple-bg' : 'rich-bg';
  return (
    <section className={`menu-screen wow-menu ${bgClass}`}>
      {!performanceMode && <div className="menu-parallax" aria-hidden="true"><i /><i /><i /><i /><i /></div>}
      <div className="menu-hero">
        <div className="menu-topline">
          <WhiteRavenLogo variant="footer" />
          <div className="status-cluster">
            <span>{playerLabel}</span>
            <span className={networkLabel === 'Online' ? 'is-online' : ''}>{networkLabel}</span>
            {playtest && <span className="menu-badge test">TEST</span>}
          </div>
        </div>
        <div className="vehicle-stage" aria-hidden="true">
          <div className="raven-shadow" />
          <div className="hero-vehicle">
            <span className="hero-pear">GK</span>
            <span className="wheel left" />
            <span className="wheel right" />
          </div>
        </div>
        <p className="kicker">White Raven Studio presents</p>
        <h1>Gruszka Katapulta</h1>
        <p className="tagline">Owocowy chaos, pojazdy, DUEL PvP i premium wyzwania.</p>
        <div className="menu-primary-actions wow-primary">
          <button className="primary-button big-play" onClick={onPlay}>Graj</button>
          <button className="primary-button big-play duel-primary" onClick={() => onScreen('duel')}>DUEL <span className="menu-pill">NOWE</span></button>
          <button className="primary-button big-play daily-primary" onClick={() => onScreen('daily')}>Daily <span className="menu-pill">DAILY</span></button>
          <button className="secondary-button more-mobile" onClick={() => setMoreOpen((value) => !value)}>Więcej</button>
        </div>
      </div>

      <div className="save-strip premium-strip">
        <span>Rekord: {save.bestScore}</span>
        <span>Poziom: {highestUnlocked}</span>
        <span>Gwiazdki: {totalStars}/{levelsCount * 3}</span>
        <span>Złote: {totalPremiumStars}/{levelsCount}</span>
      </div>

      <div className={`menu-dashboard ${moreOpen ? 'open' : ''}`}>
        <section>
          <h2>Szybkie akcje</h2>
          <div className="menu-actions">
            <button className="secondary-button" onClick={() => onScreen('levels')}>Poziomy</button>
            <button className="secondary-button" onClick={() => onScreen('leaderboard')}>Ranking <span className="menu-pill">ONLINE</span></button>
            <button className="secondary-button" onClick={() => onScreen('cosmetics')}>Kosmetyki</button>
            <button className="secondary-button" onClick={() => onScreen('shop')}>Sklep</button>
            <button className="secondary-button" onClick={() => onScreen('friends')}>Znajomi</button>
            <button className="secondary-button" onClick={() => onScreen('profile')}>Profil</button>
            <button className="secondary-button" onClick={() => onScreen('settings')}>Ustawienia</button>
            <button className="secondary-button" onClick={onFullscreen}>{fullscreenLabel}</button>
          </div>
        </section>
        <section>
          <h2>Wydarzenia</h2>
          <div className="event-row"><strong>Dzienne Wyzwanie</strong><span className="menu-badge reward">NAGRODA</span></div>
          <div className="event-row"><strong>Turniej tygodnia</strong><button onClick={() => onScreen('weekly')}>Start</button></div>
          <div className="event-row"><strong>Season Pass</strong><button onClick={() => onScreen('season')}>Zobacz</button></div>
        </section>
        <section>
          <h2>Social / PvP</h2>
          <p>DUEL PvP wymaga konta. Rankingi pokazują nick, wynik i statystyki, nigdy email.</p>
          <div className="menu-actions">
            <button className="secondary-button" onClick={() => onScreen('duel')}>DUEL PvP</button>
            <button className="secondary-button" onClick={() => onScreen('leaderboard')}>Ranking</button>
            <button className="secondary-button" onClick={() => onScreen('contact')}>Kontakt</button>
          </div>
        </section>
      </div>

      <div className="menu-actions menu-actions-secondary">
        <button className="secondary-button" onClick={onToggleSound}>Dźwięk: {save.soundEnabled ? 'ON' : 'OFF'}</button>
        <button className="secondary-button" onClick={onToggleTouchControls}>Przyciski: {touchControlsEnabled ? 'ON' : 'OFF'}</button>
        <button className="secondary-button" onClick={onTogglePerformance}>Performance: {performanceMode ? 'ON' : 'OFF'}</button>
        <button className="secondary-button" onClick={onToggleAnalytics}>Statystyki: {analyticsEnabled ? 'ON' : 'OFF'}</button>
        <button className="secondary-button" onClick={onToggleIntro}>Intro: {showStudioIntro ? 'ON' : 'OFF'}</button>
        {session ? <button className="secondary-button" onClick={onLogout}>Wyloguj</button> : <button className="secondary-button" onClick={() => onScreen('login')}>Zaloguj</button>}
        {devEnabled && <button className="secondary-button" onClick={onUnlockAllDev}>DEV: Odblokuj wszystko</button>}
        {playtest && <button className="secondary-button" onClick={onOpenPlaytest}>Playtest tools</button>}
        <button className="danger-button" onClick={onClearProgress}>Wyczyść postęp</button>
      </div>

      <div className="menu-status">
        {onlineStatus && <span>{onlineStatus}</span>}
        <span>Instalacja PWA <strong className="menu-pill">PWA</strong></span>
      </div>
      <InstallPrompt />
      <footer className="legal-footer">
        <button onClick={() => onScreen('legal:terms')}>Regulamin</button>
        <button onClick={() => onScreen('legal:privacy')}>Polityka prywatności</button>
        <button onClick={() => onScreen('legal:community')}>Zasady społeczności</button>
        <button onClick={() => onScreen('contact')}>Kontakt</button>
        <button onClick={() => onScreen('studio')}>White Raven Studio</button>
        <span>© 2026 White Raven Studio. Wszelkie prawa zastrzeżone.</span>
      </footer>
    </section>
  );
}
