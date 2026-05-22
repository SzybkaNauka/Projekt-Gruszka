import React, { useEffect, useRef, useState } from 'react';
import { createGame } from '../game/createGame.js';
import { setAudioEnabled } from '../game/audio.js';
import MobileControls from './MobileControls.jsx';

export default function GameShell({ initialLevel, paused, soundEnabled, skipToken, performanceMode, onGameEvent, onGameReady, onGameError, onBackToMenu, touchControlsEnabled = false, mobileControlsVisible = true, mobileControlsDisabled = false, duelOptions = null }) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const eventRef = useRef(onGameEvent);
  const readyRef = useRef(false);
  const mobileInputRef = useRef({ left: false, right: false, up: false, down: false, jump: false, jumpHeld: false, jumpPressed: false, power: false, powerPressed: false });

  eventRef.current = onGameEvent;

  const [startError, setStartError] = useState(null);
  const [guardError, setGuardError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  useEffect(() => {
    if (!hostRef.current) return undefined;
    readyRef.current = false;
    setGuardError(null);
    console.log('[GameShell] create attempt', { initialLevel, touchControlsEnabled, hasContainer: !!hostRef.current });
    try {
      const game = createGame(hostRef.current, (event) => {
        if (event?.type === 'game_ready') {
          readyRef.current = true;
          onGameReady?.(event);
        }
        if (event?.type === 'game_error') {
          onGameError?.(event);
        }
        eventRef.current(event);
      }, initialLevel, soundEnabled, performanceMode, mobileInputRef, touchControlsEnabled, duelOptions);
      gameRef.current = game;
      console.log('[GameShell] createGame returned', { gameCreated: !!game });
      setStartError(null);
    } catch (err) {
      console.error('[GameShell] createGame failed', err);
      setStartError(err?.message || String(err));
      onGameError?.({ type: 'game_error', message: err?.message || String(err), stack: err?.stack || '' });
      gameRef.current = null;
    }

    const guardTimer = window.setTimeout(() => {
      const canvas = hostRef.current?.querySelector('canvas');
      const hasUsableCanvas = Boolean(canvas && canvas.width > 0 && canvas.height > 0 && canvas.clientWidth > 0 && canvas.clientHeight > 0);
      if (!readyRef.current || !hasUsableCanvas) {
        const message = 'Nie udało się załadować sceny gry.';
        setGuardError(message);
        onGameError?.({
          type: 'game_error',
          message,
          canvas: hasUsableCanvas ? 'ok' : 'missing-or-zero-size',
          ready: readyRef.current,
        });
      }
    }, 2000);

    return () => {
      window.clearTimeout(guardTimer);
      try { gameRef.current?.destroy(true); } catch (e) {}
      gameRef.current = null;
    };
  }, [initialLevel, duelOptions?.duelRoomId, duelOptions?.duelMode, retryToken]);

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

  async function copyGameReport() {
    const report = [
      'GameShell report',
      `initialLevel: ${initialLevel}`,
      `startError: ${startError || '-'}`,
      `guardError: ${guardError || '-'}`,
      `hasCanvas: ${Boolean(hostRef.current?.querySelector('canvas'))}`,
      `ready: ${readyRef.current}`,
      `url: ${window.location.href}`,
      `userAgent: ${navigator.userAgent}`,
    ].join('\n');
    await navigator.clipboard?.writeText(report).catch(() => {});
  }

  return (
    <>
      <div className="game-shell">
        <div className="game-host" ref={hostRef} />
      </div>
      {startError && (
        <div className="overlay-panel" style={{ zIndex: 9999 }}>
          <h2>Błąd uruchomienia gry</h2>
          <p>{startError}</p>
          <p>Konsola przeglądarki może zawierać więcej informacji.</p>
        </div>
      )}
      {guardError && !startError && (
        <div className="overlay-panel blue-screen-guard" style={{ zIndex: 9999 }}>
          <h2>Nie udało się załadować sceny gry.</h2>
          <p>Spróbuj ponownie. Jeśli problem wraca, skopiuj raport i wyślij go w zgłoszeniu.</p>
          <div className="menu-actions">
            <button className="primary-button" onClick={() => setRetryToken((value) => value + 1)}>Spróbuj ponownie</button>
            <button className="secondary-button" onClick={onBackToMenu}>Wróć do menu</button>
            <button className="secondary-button" onClick={copyGameReport}>Kopiuj raport</button>
          </div>
        </div>
      )}
      <MobileControls
        mobileInputRef={mobileInputRef}
        visible={mobileControlsVisible}
        disabled={mobileControlsDisabled}
        showPower={Boolean(duelOptions?.duelMode)}
        powerLabel={duelOptions?.heldPowerup?.icon || (duelOptions?.heldPowerup ? 'ATAK' : 'POWER')}
        powerDisabled={Boolean(duelOptions?.duelMode && !duelOptions?.heldPowerup)}
      />
    </>
  );
}
