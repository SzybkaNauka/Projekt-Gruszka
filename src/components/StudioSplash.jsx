import React, { useEffect } from 'react';
import WhiteRavenLogo from './WhiteRavenLogo.jsx';

export default function StudioSplash({ compact = false, playtest = false, onDone }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDone?.(), compact ? 1700 : 3600);
    return () => window.clearTimeout(timeout);
  }, [compact, onDone]);

  return (
    <section className={`studio-splash cinematic ${compact ? 'compact-intro' : ''}`} onClick={onDone} role="dialog" aria-modal="true">
      <div className="splash-feathers" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="splash-sequence">
        <div className="splash-frame studio-frame">
          <WhiteRavenLogo variant="loading" />
          <h1>White Raven Studio</h1>
          <p className="splash-slogan">Gry • Aplikacje • Cyfrowe projekty</p>
          <p className="splash-about">Tworzymy gry, aplikacje i interaktywne doświadczenia z charakterem.</p>
        </div>
        <div className="splash-frame title-frame">
          <p>White Raven Studio presents</p>
          <h2>Gruszka Katapulta</h2>
          <strong>Owocowy chaos zaczyna się teraz.</strong>
        </div>
      </div>
      {playtest && <button className="splash-skip" onClick={(event) => { event.stopPropagation(); onDone?.(); }}>Pomiń intro</button>}
    </section>
  );
}
