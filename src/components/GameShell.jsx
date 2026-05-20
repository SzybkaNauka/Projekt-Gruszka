import React, { useEffect, useRef } from 'react';
import { createGame } from '../game/createGame.js';
import { setAudioEnabled } from '../game/audio.js';
import MobileControls from './MobileControls.jsx';

export default function GameShell({ initialLevel, paused, soundEnabled, skipToken, performanceMode, onGameEvent, touchControlsEnabled = false, mobileControlsVisible = true, mobileControlsDisabled = false }) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const eventRef = useRef(onGameEvent);
  const mobileInputRef = useRef({ left: false, right: false, up: false, down: false, jump: false, jumpHeld: false, jumpPressed: false });

  eventRef.current = onGameEvent;

  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }

    const game = createGame(hostRef.current, (event) => eventRef.current(event), initialLevel, soundEnabled, performanceMode, mobileInputRef, touchControlsEnabled);
    gameRef.current = game;

    return () => {
      gameRef.current?.destroy(true);
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
      <MobileControls mobileInputRef={mobileInputRef} visible={mobileControlsVisible} disabled={mobileControlsDisabled} />
    </>
  );
}
