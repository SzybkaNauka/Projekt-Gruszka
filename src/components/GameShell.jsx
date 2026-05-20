import React, { useEffect, useRef, useState } from 'react';
import { createGame } from '../game/createGame.js';
import { setAudioEnabled } from '../game/audio.js';
import MobileControls from './MobileControls.jsx';

export default function GameShell({ initialLevel, paused, soundEnabled, skipToken, performanceMode, onGameEvent, touchControlsEnabled = false, mobileControlsVisible = true, mobileControlsDisabled = false }) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const eventRef = useRef(onGameEvent);
  const mobileInputRef = useRef({ left: false, right: false, up: false, down: false, jump: false, jumpHeld: false, jumpPressed: false });

  eventRef.current = onGameEvent;

  const [startError, setStartError] = useState(null);
  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }
    try {
      const game = createGame(hostRef.current, (event) => eventRef.current(event), initialLevel, soundEnabled, performanceMode, mobileInputRef, touchControlsEnabled);
      gameRef.current = game;
      setStartError(null);
    } catch (err) {
      console.error('[GameShell] createGame failed', err);
      setStartError(err?.message || String(err));
      gameRef.current = null;
    }

    return () => {
      try { gameRef.current?.destroy(true); } catch (e) {}
      gameRef.current = null;
    };
  }, [initialLevel]);

  useEffect(() => {
    const scene = gameRef.current?.scene?.getScene('PearScene');
    if (scene?.setPaused) {
      scene.setPaused(paused);
    }
  }, [paused]);

  useEffect(() => {
    setAudioEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (!skipToken) {
      return;
    }
    const scene = gameRef.current?.scene?.getScene('PearScene');
    scene?.forceNextPear?.();
  }, [skipToken]);

  return (
    <>
      <div className="game-host" ref={hostRef} />
      {startError && (
        <div className="overlay-panel" style={{ zIndex: 9999 }}>
          <h2>Błąd uruchomienia gry</h2>
          <p>{startError}</p>
          <p>Konsola przeglądarki może zawierać więcej informacji.</p>
        </div>
      )}
      <MobileControls mobileInputRef={mobileInputRef} visible={mobileControlsVisible} disabled={mobileControlsDisabled} />
    </>
  );
}
