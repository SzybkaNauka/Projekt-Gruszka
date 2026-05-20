import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { levels } from './game/levels.js';
import { MAX_LEVEL } from './game/constants.js';
import { runCampaignSanityCheck } from './game/campaignSanity.js';
import { getSave, resetProgress, saveLevelResult, setSoundEnabled, setUnlockedLevel } from './game/storage.js';
import { playSound, setAudioEnabled } from './game/audio.js';
import InstallPrompt from './components/InstallPrompt.jsx';
import * as inputSettingsService from './services/inputSettingsService.js';
import LoginPanel from './components/LoginPanel.jsx';
import ProfilePanel from './components/ProfilePanel.jsx';
import LeaderboardPanel from './components/LeaderboardPanel.jsx';
import FriendsPanel from './components/FriendsPanel.jsx';
import { getSession, onAuthStateChange, signOut } from './services/authService.js';
import { getProfile } from './services/profileService.js';
import { flushPendingScores, queuePendingScore, submitOnlineScore } from './services/scoreService.js';
import { isOnline, onOnline, onOffline } from './services/networkService.js';
import { canUseFullscreen, isFullscreen, toggleFullscreen } from './services/fullscreenService.js';

const GameShell = lazy(() => import('./components/GameShell.jsx'));

const levelWorlds = [
  { title: 'Startowa Farma', range: '1-10', from: 1, to: 10 },
  { title: 'Drugi Bieg', range: '11-20', from: 11, to: 20 },
  { title: 'Proba Mistrza', range: '21-30', from: 21, to: 30 },
  { title: 'Very Hard', range: '31-40', from: 31, to: 40 },
  { title: 'Impossible', range: '41-50', from: 41, to: 50 },
];

const PERFORMANCE_STORAGE_KEY = 'gruszka-katapulta-performance-v1';

function getDevParams() {
  if (typeof window === 'undefined') return { enabled: false, debug: false, level: null, unlockAll: false, playtest: false };
  const params = new URLSearchParams(window.location.search);
  const debug = params.get('debug') === '1';
  const enabled = import.meta.env.DEV || debug;
  const requestedLevel = params.get('level');
  return {
    enabled,
    debug,
    playtest: params.get('playtest') === '1',
    level: enabled && requestedLevel ? Math.min(MAX_LEVEL, Math.max(1, Number(requestedLevel || 1))) : null,
    unlockAll: enabled && params.get('unlockAll') === '1',
  };
}

const loseTexts = [
  'Gruszka nie dojechała.',
  'Warzywny chaos wygrał tę rundę.',
  'Katapulta zrobiła ostatni kurs.',
  'Prawie. Bardzo prawie.',
  'Gruszka poszła w sałatkę.',
];

function starsText(count = 0) {
  return '***'.slice(0, count).padEnd(3, '-');
}

export default function App() {
  const devParams = useMemo(() => getDevParams(), []);
  const [screen, setScreen] = useState(devParams.level ? 'game' : 'menu');
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('wrs-splash-seen'));
  const [save, setSave] = useState(() => {
    const initial = devParams.unlockAll ? setUnlockedLevel(MAX_LEVEL) : getSave();
    setAudioEnabled(initial.soundEnabled);
    return initial;
  });
  const [runId, setRunId] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(devParams.level || Math.min(getSave().unlockedLevel, levels.length));
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const [skipAvailable, setSkipAvailable] = useState(false);
  const [skipToken, setSkipToken] = useState(0);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState('');
  const [performanceMode, setPerformanceMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PERFORMANCE_STORAGE_KEY) || 'false');
    } catch (error) {
      return false;
    }
  });
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(() => {
    try {
      return inputSettingsService.getTouchControlsEnabled();
    } catch (e) {
      return false;
    }
  });
  const [fullscreenActive, setFullscreenActive] = useState(() => isFullscreen());
  const [fullscreenAvailable, setFullscreenAvailable] = useState(() => canUseFullscreen());
  const [mobileFullscreenActive, setMobileFullscreenActive] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const [hud, setHud] = useState({
    level: selectedLevel,
    score: 0,
    combo: 1,
    vehicle: 'Drewniana Katapulta',
    pearHealth: 100,
    canLaunch: true,
    distance: 0,
    best: save.bestScore,
  });
  const buildInfo = useMemo(() => {
    return {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      dev: import.meta.env.DEV ?? false,
    };
  }, []);
  const [leaderboardDefaults, setLeaderboardDefaults] = useState({ defaultTab: 'global', defaultLevel: 'all', defaultWorld: 'all' });

  const highestUnlocked = Math.min(save.unlockedLevel, levels.length, MAX_LEVEL);
  const totalStars = useMemo(
    () => Object.values(save.starsByLevel).reduce((sum, value) => sum + Number(value || 0), 0),
    [save.starsByLevel],
  );

  React.useEffect(() => {
    if (import.meta.env.DEV || devParams.debug) {
      runCampaignSanityCheck();
    }
  }, [devParams.debug]);

  React.useEffect(() => {
    let alive = true;
    getSession().then((nextSession) => {
      if (alive) setSession(nextSession);
    }).catch(() => {});
    const unsubscribeAuth = onAuthStateChange(async (nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        try {
          const p = await getProfile(nextSession.user.id);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });
    const unsubscribeOnline = onOnline(async () => {
      setOnlineStatus('Połączono — synchronizuję wyniki');
      if (session?.user) {
        await flushPendingScores(session.user.id).catch(() => {});
      }
    });
    const unsubscribeOffline = onOffline(() => {
      setOnlineStatus('Offline — gra zapisze lokalnie');
    });
    return () => {
      alive = false;
      unsubscribeAuth();
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [session?.user?.id]);

  React.useEffect(() => {
    localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(performanceMode));
  }, [performanceMode]);

  React.useEffect(() => {
    const updateFullscreenState = () => {
      setFullscreenActive(isFullscreen());
      setFullscreenAvailable(canUseFullscreen());
      if (!isFullscreen()) setMobileFullscreenActive(false);
    };
    const coarsePointer = window.matchMedia?.('(pointer: coarse)');
    const updateTouchState = () => setTouchDevice(Boolean(coarsePointer?.matches || navigator.maxTouchPoints > 0));

    updateFullscreenState();
    updateTouchState();
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    coarsePointer?.addEventListener?.('change', updateTouchState);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
      coarsePointer?.removeEventListener?.('change', updateTouchState);
    };
  }, []);

  React.useEffect(() => {
    try {
      inputSettingsService.setTouchControlsEnabled(!!touchControlsEnabled);
    } catch (e) {}
  }, [touchControlsEnabled]);

  React.useEffect(() => {
    if (!showSplash) return undefined;
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem('wrs-splash-seen', '1');
      setShowSplash(false);
    }, 1850);
    return () => window.clearTimeout(timeout);
  }, [showSplash]);

  function startLevel(levelId) {
    const safeLevelId = Math.min(MAX_LEVEL, Math.max(1, Number(levelId || 1)));
    playSound('ui');
    setResult(null);
    setPaused(false);
    setSkipAvailable(false);
    setSelectedLevel(safeLevelId);
    setHud({
      level: safeLevelId,
      score: 0,
      combo: 1,
      vehicle: 'Drewniana Katapulta',
      pearHealth: 100,
      canLaunch: true,
      distance: 0,
      best: save.bestScore,
    });
    setRunId((value) => value + 1);
    setScreen('game');
  }

  function playUnlocked() {
    startLevel(highestUnlocked);
  }

  async function toggleGameFullscreen() {
    const target = document.querySelector('.game-screen') || document.getElementById('root') || document.documentElement;
    const canFullscreenTarget = canUseFullscreen(target);
    const shouldExit = fullscreenActive || mobileFullscreenActive;

    if (shouldExit) {
      playSound('ui');
      try {
        if (fullscreenActive) await toggleFullscreen(target);
      } finally {
        setMobileFullscreenActive(false);
        setFullscreenActive(isFullscreen());
      }
      return;
    }

    playSound('ui');
    setMobileFullscreenActive(Boolean(touchDevice));
    try {
      if (!canFullscreenTarget) {
        if (!touchDevice) {
          setOnlineStatus('Powiększenie na cały ekran jest niedostępne w tej przeglądarce');
          setMobileFullscreenActive(false);
        }
        return;
      }
      await toggleFullscreen(target);
      const active = isFullscreen();
      setFullscreenActive(active);
      setMobileFullscreenActive(Boolean(touchDevice) && !active);
      if (active && window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (error) {
      if (!touchDevice) {
        setOnlineStatus('Powiększenie na cały ekran nie zostało włączone');
        setMobileFullscreenActive(false);
      }
    }
  }

  function restartLevel() {
    startLevel(selectedLevel);
  }

  function goMenu() {
    playSound('ui');
    setPaused(false);
    setResult(null);
    setScreen('menu');
  }

  function nextLevel() {
    startLevel(Math.min(selectedLevel + 1, levels.length));
  }

  function togglePause() {
    if (result) {
      return;
    }
    setPaused((value) => !value);
    playSound('ui');
  }

  function toggleSound() {
    const next = !save.soundEnabled;
    setAudioEnabled(next);
    const nextSave = setSoundEnabled(next);
    setSave(nextSave);
    if (next) {
      playSound('record');
    }
  }

  function launchPear() {
    setSkipAvailable(false);
    setSkipToken((value) => value + 1);
    playSound('ui');
  }

  function clearProgress() {
    playSound('ui');
    const clean = resetProgress();
    setAudioEnabled(clean.soundEnabled);
    setSave(clean);
    setSelectedLevel(1);
    setHud((current) => ({ ...current, best: 0 }));
    setResult(null);
    setScreen('menu');
  }

  function unlockAllDev() {
    if (!devParams.enabled) return;
    const nextSave = setUnlockedLevel(MAX_LEVEL);
    setSave(nextSave);
    setOnlineStatus('DEV: odblokowano wszystkie poziomy lokalnie');
  }

  function handleLockedLevel(levelId) {
    setOnlineStatus(`Poziom ${levelId} jest jeszcze zablokowany`);
  }

  function handleGameEvent(event) {
    if (event.type === 'hud') {
      setHud((current) => ({
        ...current,
        level: event.level,
        score: event.score,
        combo: event.combo || current.combo,
        vehicle: event.vehicle || current.vehicle,
        pearHealth: event.pearHealth ?? current.pearHealth,
        canLaunch: event.canLaunch ?? current.canLaunch,
        distance: event.distance ?? current.distance,
        best: Math.max(save.bestScore, event.score),
      }));
    }

    if (event.type === 'skip') {
      setSkipAvailable(event.available);
    }

    if (event.type === 'win') {
      const nextSave = saveLevelResult(event.level, event.totalScore, event.stars);
      const scorePayload = {
        level_id: event.level,
        score: event.totalScore,
        stars: event.stars,
        combo_max: event.bestCombo || 1,
        perfect_run: event.stars === 3,
      };
      setSave(nextSave);
      setHud((current) => ({ ...current, score: event.totalScore, best: nextSave.bestScore }));
      if (devParams.debug) {
        setOnlineStatus('DEV DEBUG: wynik niekwalifikowany do rankingu');
      } else if (session?.user && isOnline()) {
        submitOnlineScore(scorePayload, session.user.id)
          .then(() => setOnlineStatus('Wysłano do rankingu'))
          .catch(() => {
            queuePendingScore(scorePayload);
            setOnlineStatus('Offline — wyślemy później');
          });
      } else if (session?.user) {
        queuePendingScore(scorePayload);
        setOnlineStatus('Offline — wyślemy później');
      } else {
        setOnlineStatus('Zaloguj się, aby dodać wynik do rankingu');
      }
      const isNewRecord = event.totalScore >= nextSave.bestScore && event.totalScore > save.bestScore;
      setResult({ ...event, isRecord: isNewRecord, onlineStatus });
      setPaused(false);
    }

    if (event.type === 'lose') {
      setResult({ ...event, message: event.message || loseTexts[Math.floor(Math.random() * loseTexts.length)] });
      setPaused(false);
    }

    if (event.type === 'error') {
      setResult({
        type: 'error',
        message: `Gra nie wystartowała: ${event.message}`,
        score: hud.score,
      });
      setPaused(false);
    }
  }

  function openLeaderboardForLevel(level, tab = 'global') {
    setLeaderboardDefaults({ defaultTab: tab || 'global', defaultLevel: String(level || 'all'), defaultWorld: 'all' });
    setScreen('leaderboard');
  }

  function getPlayerLabel() {
    return profile?.display_name || profile?.username || (session?.user?.email ? session.user.email.split('@')[0] : 'Gość');
  }

  function getNetworkLabel() {
    return isOnline() ? 'Online' : 'Offline';
  }

  async function copyDebugReport() {
    const report = [
      `Gruszka Katapulta ${buildInfo.version}`,
      `Tryb: ${devParams.playtest ? 'Playtest' : buildInfo.dev ? 'DEV' : 'Release'}`,
      `Użytkownik: ${getPlayerLabel()}`,
      `Poziom: ${selectedLevel}`,
      `Wynik: ${hud.score}`,
      `Status sieci: ${getNetworkLabel()}`,
      `Informacja: ${onlineStatus}`,
      `Performance mode: ${performanceMode ? 'ON' : 'OFF'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(report);
      setOnlineStatus('Raport debugowy skopiowany do schowka');
    } catch (error) {
      setOnlineStatus('Kopiowanie debug reportu nie powiodło się');
    }
  }

  function shareResult() {
    if (!navigator.share) {
      setOnlineStatus('Twoja przeglądarka nie obsługuje udostępniania');
      return;
    }

    navigator.share({
      title: 'Gruszka Katapulta',
      text: `Właśnie zrobiłem ${hud.score} punktów na poziomie ${selectedLevel} w Gruszka Katapulta!`,
    }).catch(() => {
      setOnlineStatus('Udostępnianie anulowane lub niedostępne');
    });
  }

  return (
    <main className={`app ${fullscreenActive ? 'is-fullscreen' : ''} ${mobileFullscreenActive ? 'is-mobile-fullscreen' : ''}`}>
      {showSplash && (
        <section className="studio-splash" onClick={() => {
          sessionStorage.setItem('wrs-splash-seen', '1');
          setShowSplash(false);
        }}>
          <div className="studio-mark">WRS</div>
          <p>White Raven Studio presents</p>
        </section>
      )}

      {screen === 'menu' && (
        <section className="menu-screen">
          <div className="brand-block">
            <p className="studio-badge">White Raven Studio</p>
            <div className="menu-art" aria-hidden="true">
              <span className="menu-pear">x_x</span>
              <span className="menu-veg tomato">!</span>
              <span className="menu-veg cucumber">?</span>
              <span className="menu-veg onion">...</span>
            </div>
            <p className="kicker">skillowa jazda z katapultą</p>
            <h1>Gruszka Katapulta</h1>
            <p className="tagline">Dowiez gruszkę. Wystrzel ją tylko wtedy, gdy musisz.</p>
          </div>

          <div className="save-strip">
            <span>Rekord: {save.bestScore}</span>
            <span>Odblokowany poziom: {highestUnlocked}</span>
            <span>Gwiazdki: {totalStars}/{levels.length * 3}</span>
          </div>

          <div className="menu-actions menu-primary-actions">
            <button className="primary-button big-play" onClick={playUnlocked}>Graj</button>
            <button className="secondary-button big-play fullscreen-menu-button" onClick={toggleGameFullscreen}>
              {fullscreenActive || mobileFullscreenActive ? 'Wyjdź z pełnego ekranu' : 'Powiększ na cały ekran'}
            </button>
          </div>

          <div className="menu-actions">
            <button className="secondary-button" onClick={() => setScreen('levels')}>Poziomy</button>
            <button className="secondary-button" onClick={() => setScreen('leaderboard')}>Ranking</button>
            <button className="secondary-button" onClick={() => setScreen('friends')}>Znajomi</button>
            <button className="secondary-button" onClick={() => setScreen('profile')}>Profil</button>
            <button className="secondary-button" onClick={() => setScreen('howto')}>Jak grać</button>
          </div>

          <div className="menu-actions menu-actions-secondary">
            <button className="secondary-button" onClick={toggleSound}>
              Dźwięk: {save.soundEnabled ? 'włączony' : 'wyciszony'}
            </button>
            <button className="secondary-button" onClick={() => setTouchControlsEnabled((v) => !v)}>
              Przyciski ekranowe: {touchControlsEnabled ? 'ON' : 'OFF'}
            </button>
            <button className="secondary-button" onClick={() => setPerformanceMode((value) => !value)}>
              Tryb wydajności: {performanceMode ? 'ON' : 'OFF'}
            </button>
            {session ? (
              <button className="secondary-button" onClick={async () => { await signOut(); setSession(null); }}>
                Wyloguj
              </button>
            ) : (
              <button className="secondary-button" onClick={() => setScreen('login')}>Zaloguj</button>
            )}
            {devParams.enabled && <button className="secondary-button" onClick={unlockAllDev}>DEV: Odblokuj wszystko</button>}
            <button className="danger-button" onClick={clearProgress}>Wyczyść postęp</button>
          </div>

          <div className="menu-status">
            <span>Gracz: {getPlayerLabel()}</span>
            <span>Sieć: {getNetworkLabel()}</span>
            {onlineStatus && <span>{onlineStatus}</span>}
            {devParams.playtest && <span className="playtest-badge">PLAYTEST MODE</span>}
          </div>
          <InstallPrompt />
          <footer className="studio-footer">© 2026 White Raven Studio</footer>
        </section>
      )}

      {screen === 'login' && (
        <section className="panel-screen">
          <div className="panel-header">
            <h2>Konto</h2>
            <button className="secondary-button compact" onClick={() => setScreen('menu')}>Menu</button>
          </div>
          {session ? (
            <div className="online-panel">
              <h2>Zalogowano</h2>
              <p>{profile?.display_name || profile?.username || (session.user.email ? session.user.email.split('@')[0] : '')}</p>
              <button className="primary-button" onClick={() => setScreen('profile')}>Profil</button>
            </div>
          ) : (
            <LoginPanel onDone={() => setScreen('profile')} />
          )}
        </section>
      )}

      {screen === 'profile' && (
        <section className="panel-screen">
          <div className="panel-header">
            <h2>Profil</h2>
            <button className="secondary-button compact" onClick={() => setScreen('menu')}>Menu</button>
          </div>
          <ProfilePanel session={session} />
        </section>
      )}

      {screen === 'leaderboard' && (
        <section className="panel-screen">
          <div className="panel-header">
            <h2>Ranking</h2>
            <button className="secondary-button compact" onClick={() => setScreen('menu')}>Menu</button>
          </div>
          <LeaderboardPanel
            session={session}
            defaultTab={leaderboardDefaults.defaultTab}
            defaultLevel={leaderboardDefaults.defaultLevel}
            defaultWorld={leaderboardDefaults.defaultWorld}
          />
        </section>
      )}

      {screen === 'friends' && (
        <section className="panel-screen">
          <div className="panel-header">
            <h2>Znajomi</h2>
            <button className="secondary-button compact" onClick={() => setScreen('menu')}>Menu</button>
          </div>
          <FriendsPanel session={session} />
        </section>
      )}

      {screen === 'levels' && (
        <section className="panel-screen">
          <div className="panel-header">
            <h2>Poziomy</h2>
            <button className="secondary-button compact" onClick={() => setScreen('menu')}>Menu</button>
          </div>
          <div className="level-worlds">
            {levelWorlds.map((world) => (
              <section className="level-world" key={world.range}>
                <div className="level-world-header">
                  <strong>{world.title}</strong>
                  <span>{world.range}</span>
                </div>
                <div className="level-grid">
                  {levels.filter((level) => level.id >= world.from && level.id <= world.to).map((level) => {
              const locked = level.id > highestUnlocked;
              return (
                <button
                  key={level.id}
                  className={`level-tile ${locked ? 'locked' : ''}`}
                  aria-disabled={locked}
                  onClick={() => (locked ? handleLockedLevel(level.id) : startLevel(level.id))}
                >
                  <strong>{locked ? 'Kłódka' : `Poziom ${level.id}`}</strong>
                  <span>{level.name}</span>
                  <em>{level.difficultyTier}</em>
                  <small>{locked ? 'Zablokowany' : starsText(save.starsByLevel[level.id])}</small>
                </button>
              );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}

      {screen === 'howto' && (
        <section className="panel-screen howto-screen">
          <h2>Jak grać</h2>
          <ul>
            <li>A lub strzałka lewo skręca w lewo.</li>
            <li>D lub strzałka prawo skręca w prawo.</li>
            <li>Spacja wystrzeliwuje gruszkę na następny pojazd.</li>
            <li>Na telefonie lewa i prawa połowa ekranu skręcają pojazdem.</li>
            <li>Przycisk WYSTRZAŁ na HUD odpala gruszkę.</li>
            <li>Zbieraj pestki, jedź blisko przeszkód i utrzymuj combo.</li>
            <li>Poziom 1 ma jedną wymaganą przesiadkę przez przepaść.</li>
          </ul>
          <div className="menu-actions">
            <button className="primary-button" onClick={playUnlocked}>Graj</button>
            <button className="secondary-button" onClick={() => setScreen('menu')}>Wróć</button>
          </div>
        </section>
      )}

      {screen === 'game' && (
        <section className="game-screen">
          <div className="hud">
            <span>Poziom {hud.level}</span>
            <span>Wynik {hud.score}</span>
            <span>Rekord {hud.best}</span>
            <span>Combo x{hud.combo}</span>
            <span>Pojazd: {hud.vehicle}</span>
            <span>Gruszka {hud.pearHealth}%</span>
            <span>Dystans {hud.distance} m</span>
            <button className="launch-hud-button" onClick={launchPear} disabled={!hud.canLaunch || paused || Boolean(result)}>Wystrzał</button>
            <button onClick={togglePause}>{paused ? 'Wznów' : 'Pauza'}</button>
            <button onClick={restartLevel}>Restart</button>
            <button onClick={goMenu}>Menu</button>
            <button onClick={toggleGameFullscreen}>{fullscreenActive || mobileFullscreenActive ? 'Okno' : 'Cały ekran'}</button>
            <button onClick={toggleSound}>{save.soundEnabled ? 'Dźwięk' : 'Cisza'}</button>
          </div>

          

          <div className="rotate-notice">Obróć telefon, żeby grać wygodniej.</div>
          {/* decide whether mobile controls should be visible/disabled */}
          {(() => {
            const hasOpenOverlay = screen !== 'game' || showSplash || Boolean(result) || paused;
            const gameActive = screen === 'game' && !showSplash;
            const mobileControlsVisible = Boolean(touchControlsEnabled || touchDevice) && gameActive;
            const mobileControlsDisabled = !gameActive || hasOpenOverlay || Boolean(result) || paused;
            return (
              <Suspense fallback={<div className="game-loading"><span>White Raven Studio</span><strong>Ładowanie trasy...</strong></div>}>
                <GameShell
                  key={runId}
                  initialLevel={selectedLevel - 1}
                  paused={paused || Boolean(result)}
                  soundEnabled={save.soundEnabled}
                  skipToken={skipToken}
                  performanceMode={performanceMode}
                  onGameEvent={handleGameEvent}
                  touchControlsEnabled={touchControlsEnabled}
                  mobileControlsVisible={mobileControlsVisible}
                  mobileControlsDisabled={mobileControlsDisabled}
                />
              </Suspense>
            );
          })()}
          {skipAvailable && !paused && !result && (
            <button className="skip-button" onClick={launchPear}>Wystrzał</button>
          )}

          {hud.canLaunch && !paused && !result && (
            <div className="ability-hint">A/D albo strzałki: skręt. Spacja: wystrzał.</div>
          )}

          {paused && !result && (
            <div className="overlay-panel">
              <h2>Pauza</h2>
              <div className="menu-actions">
                <button className="primary-button" onClick={togglePause}>Wznów</button>
                <button className="secondary-button" onClick={restartLevel}>Restart</button>
                <button className="secondary-button" onClick={goMenu}>Menu</button>
              </div>
            </div>
          )}

          {result?.type === 'win' && (
            <div className={`overlay-panel result-screen ${result.level === 50 ? 'result-legendary' : 'result-win'}`} role="dialog" aria-modal>
              <div className="result-card">
                <h2 className="result-title">
                  {result.level === 50 ? 'GRUSZKA ZOSTAŁA LEGENDĄ!' : result.perfectRun ? 'PERFECT RUN!' : 'POZIOM UKOŃCZONY!'}
                </h2>

                <div className="result-stars" aria-hidden>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`result-star ${i < (result.stars || 0) ? 'result-star-earned' : ''}`}
                      style={{ animationDelay: `${i * 180}ms` }}
                    />
                  ))}
                </div>

                <div className="result-score">
                  <div className="score-value">{result.totalScore ?? result.score ?? hud.score}</div>
                  <div className="score-label">Wynik</div>
                </div>

                <div className="result-stats-grid">
                  <div className="result-stat"><strong>Poziom</strong><span>{result.level}</span></div>
                  <div className="result-stat"><strong>Monety</strong><span>{result.coins ?? result.coinsCollected ?? 0}</span></div>
                  <div className="result-stat"><strong>Max Combo</strong><span>x{result.maxCombo ?? result.bestCombo ?? 1}</span></div>
                  <div className="result-stat"><strong>Near Missy</strong><span>{result.nearMisses ?? 0}</span></div>
                  <div className="result-stat"><strong>Czas</strong><span>{typeof result.timeMs === 'number' ? `${Math.round(result.timeMs / 1000)}s` : '—'}</span></div>
                  <div className="result-stat"><strong>Perfect</strong><span>{result.perfectRun ? 'TAK' : 'NIE'}</span></div>
                </div>

                <div className="result-bonuses">
                  <div className="result-bonus-row"><strong>Ukończenie poziomu</strong><span>{result.bonusCompletion ?? result.bonus ?? '—'}</span></div>
                  {result.perfectRun && <div className="result-bonus-row"><strong>Perfect bonus</strong><span>{result.bonusPerfect ?? '—'}</span></div>}
                  {result.maxCombo && <div className="result-bonus-row"><strong>Combo bonus</strong><span>{result.bonusCombo ?? '—'}</span></div>}
                  {result.coins && <div className="result-bonus-row"><strong>Coin bonus</strong><span>{result.bonusCoins ?? '—'}</span></div>}
                  {result.tier === 'Impossible' && <div className="result-bonus-row"><strong>Impossible bonus</strong><span>{result.bonusImpossible ?? '—'}</span></div>}
                </div>

                <div className="result-online-status">
                  <strong>Status:</strong>
                  <span>
                    {devParams.debug ? 'Debug run — nie wysłano do rankingu' :
                      !session?.user ? 'Zaloguj się, żeby zapisać wynik online' :
                      onlineStatus?.includes('Wysłano') ? 'Wysłano do rankingu' :
                      onlineStatus?.includes('Offline') ? 'Offline — wyślemy później' : onlineStatus || '—'}
                  </span>
                </div>

                <div className="result-actions">
                  {!((result.level === 50) || (save.unlockedLevel < result.level + 1)) && result.level < MAX_LEVEL && (
                    <button className="primary-button" onClick={nextLevel}>Następny poziom</button>
                  )}
                  {result.level === MAX_LEVEL && (
                    <button className="primary-button" onClick={() => startLevel(1)}>Graj od nowa</button>
                  )}
                  <button className="secondary-button" onClick={restartLevel}>Restart</button>
                  <button className="secondary-button" onClick={goMenu}>Wybór poziomów</button>
                  <button className="secondary-button" onClick={() => openLeaderboardForLevel(result.level)}>Ranking poziomu</button>
                  <button className="secondary-button" onClick={shareResult}>Udostępnij wynik</button>
                  {(devParams.playtest || devParams.debug) && (
                    <button className="secondary-button" onClick={copyDebugReport}>Kopiuj raport debug</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {result?.type === 'lose' && (
            <div className="overlay-panel result-screen result-lose" role="dialog" aria-modal>
              <div className="result-card">
                <h2 className="result-title">
                  {result.failReason === 'spike' ? 'KOLCE!' : result.failReason === 'crash' ? 'PLASK!' : result.failReason === 'out_of_bounds' ? 'POZA TRASĄ!' : 'GRUSZKA OUT!'}
                </h2>

                <div className="result-fail-reason">{result.message || (result.failReason ? result.failReason : 'Przegrałeś tę próbę')}</div>

                <div className="result-hint">{result.hint || 'Patrz na monety i zielone znaczniki — pokazują bezpieczną trasę.'}</div>

                <div className="result-stats-grid">
                  <div className="result-stat"><strong>Poziom</strong><span>{result.level}</span></div>
                  <div className="result-stat"><strong>Wynik</strong><span>{result.score ?? hud.score}</span></div>
                  <div className="result-stat"><strong>Czas</strong><span>{typeof result.timeMs === 'number' ? `${Math.round(result.timeMs / 1000)}s` : '—'}</span></div>
                  <div className="result-stat"><strong>Monety</strong><span>{result.coins ?? 0}</span></div>
                  <div className="result-stat"><strong>Max Combo</strong><span>x{result.maxCombo ?? 0}</span></div>
                  <div className="result-stat"><strong>Near Missy</strong><span>{result.nearMisses ?? 0}</span></div>
                  <div className="result-stat"><strong>Pojazd</strong><span>{result.vehicle ?? hud.vehicle}</span></div>
                </div>

                <div className="result-actions">
                  <button className="primary-button" onClick={restartLevel}>Jeszcze raz</button>
                  <button className="secondary-button" onClick={goMenu}>Wybór poziomów</button>
                  <button className="secondary-button" onClick={() => openLeaderboardForLevel(result.level)}>Ranking poziomu</button>
                  {(devParams.playtest || devParams.debug) && (
                    <button className="secondary-button" onClick={copyDebugReport}>Kopiuj raport debug</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {result?.type === 'error' && (
            <div className="overlay-panel result-panel">
              <h2>Coś się wysypało</h2>
              <p>{result.message}</p>
              <div className="menu-actions">
                <button className="primary-button" onClick={restartLevel}>Spróbuj ponownie</button>
                <button className="secondary-button" onClick={goMenu}>Menu</button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
