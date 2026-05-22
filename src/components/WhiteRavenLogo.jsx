import React from 'react';

export default function WhiteRavenLogo({ variant = 'full' }) {
  return (
    <div className={`wrs-logo wrs-logo-${variant}`} aria-label="White Raven Studio">
      <svg viewBox="0 0 96 96" role="img" aria-hidden="true">
        <circle cx="48" cy="48" r="44" className="wrs-logo-ring" />
        <path className="wrs-logo-wing" d="M18 55c17-26 36-33 60-28-12 4-21 10-27 18 11-4 20-4 28-1-15 4-27 12-36 25-6-9-14-13-25-14Z" />
        <path className="wrs-logo-head" d="M47 28c9-8 22-8 31 1-10 0-16 4-20 11-4-5-7-8-11-12Z" />
        <path className="wrs-logo-feather" d="M29 61c9 1 17 5 24 13-12-1-22-5-31-13h7Z" />
        <circle cx="59" cy="35" r="2.6" className="wrs-logo-eye" />
      </svg>
      {variant !== 'compact' && variant !== 'loading' && (
        <span>
          <strong>White Raven Studio</strong>
          {variant === 'full' && <em>Gry • Aplikacje • Cyfrowe projekty</em>}
        </span>
      )}
    </div>
  );
}
