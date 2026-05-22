import React, { useEffect, useMemo, useState } from 'react';
import { levels } from '../game/levels.js';
import { DUEL_MODES } from '../game/constants.js';
import { ensureProfile } from '../services/profileService.js';
import {
  acceptDuelInvite,
  cancelDuelRoom,
  createDuelRoom,
  declineDuelInvite,
  getDuelEvents,
  getDuelRoom,
  getDuelRoomByCode,
  getDuelPlayers,
  getDuelLeaderboard,
  getMyActiveDuelRoom,
  getMyDuelHistory,
  getPendingDuelInvites,
  getRoomDuelInvites,
  getRandomPlayersForDuel,
  inviteUserToDuel,
  joinDuelRoom,
  leaveDuelRoom,
  listPublicDuelRooms,
  listOpenDuelRooms,
  markDuelRunning,
  quickMatch,
  searchPlayersForDuel,
  setReady,
  startDuelCountdown,
  subscribeInvites,
  subscribePlayers,
  subscribeRoom,
} from '../services/duelService.js';

export default function DuelPanel({ session, profile, onStartDuel, onBack, initialRoomCode = '', playtest = false, onRoomJoined }) {
  const [mode, setMode] = useState('1v1');
  const [levelId, setLevelId] = useState(1);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ season: null, rows: [] });
  const [joinCode, setJoinCode] = useState('');
  const [quickMode, setQuickMode] = useState('1v1');
  const [quickLevel, setQuickLevel] = useState('random');
  const [search, setSearch] = useState('');
  const [foundPlayers, setFoundPlayers] = useState([]);
  const [randomPlayers, setRandomPlayers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [roomInvites, setRoomInvites] = useState([]);
  const [countdownMs, setCountdownMs] = useState(null);
  const [joinPromptRoom, setJoinPromptRoom] = useState(null);
  const [activePrompt, setActivePrompt] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [startedRoomId, setStartedRoomId] = useState(null);

  const me = players.find((player) => player.user_id === session?.user?.id);
  const isHost = room?.host_user_id === session?.user?.id;
  const teamA = players.filter((player) => player.team === 'A' && player.status !== 'left');
  const teamB = players.filter((player) => player.team === 'B' && player.status !== 'left');
  const activePlayers = players.filter((player) => player.status !== 'left');
  const allReady = activePlayers.length >= 2 && activePlayers.every((player) => player.ready);
  const teamsBalanced = teamA.length === teamB.length && teamA.length > 0;
  const connected = activePlayers.every((player) => player.connected);
  const canStart = Boolean(isHost && room?.status === 'lobby' && allReady && teamsBalanced && connected);
  const startReason = !room ? ''
    : activePlayers.length < 2 ? 'Czekamy na graczy'
      : !teamsBalanced ? 'Druzyny musza miec taka sama liczbe graczy'
        : !allReady ? 'Wszyscy gracze musza byc gotowi'
          : !connected ? 'Ktos jest rozlaczony'
            : room.status !== 'lobby' ? 'Pojedynek juz wystartowal'
              : 'Gotowe do startu';

  const visibleLevels = useMemo(() => levels.slice(0, 50), []);

  async function loadLobbyData() {
    try {
      const [openRooms, randoms] = await Promise.all([
        listOpenDuelRooms(12),
        getRandomPlayersForDuel(8),
      ]);
      setRooms(openRooms);
      listPublicDuelRooms({ mode: 'any', onlyJoinable: false, limit: 16 }).then(setPublicRooms).catch(() => {});
      getDuelLeaderboard(12).then(setLeaderboard).catch(() => {});
      setRandomPlayers(randoms.filter((player) => player.id !== session?.user?.id));
      if (session?.user?.id) getMyDuelHistory(session.user.id, 5).then(setHistory).catch(() => {});
      if (session?.user?.id && !room) getMyActiveDuelRoom(session.user.id).then((active) => setActivePrompt(active)).catch(() => {});
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie pobrac DUEL.');
    }
  }

  useEffect(() => {
    if (session?.user) loadLobbyData();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user || !initialRoomCode) return;
    let alive = true;
    getDuelRoomByCode(initialRoomCode)
      .then((nextRoom) => {
        if (!alive) return;
        if (!nextRoom) {
          setStatus('Nie znaleziono pokoju.');
          return;
        }
        if (nextRoom.status !== 'lobby') {
          setStatus('Ten pojedynek juz wystartowal albo zostal zakonczony.');
          return;
        }
        const alreadyInRoom = nextRoom.duel_players?.some((player) => player.user_id === session.user.id && player.status !== 'left');
        if (alreadyInRoom) {
          setRoom(nextRoom);
          onRoomJoined?.();
        } else {
          setJoinPromptRoom(nextRoom);
        }
      })
      .catch((error) => setStatus(error.message || 'Nie znaleziono pokoju.'));
    return () => { alive = false; };
  }, [session?.user?.id, initialRoomCode]);

  useEffect(() => {
    if (!session?.user) return undefined;
    let alive = true;
    const load = () => getPendingDuelInvites(session.user.id)
      .then((list) => { if (alive) setInvites(list); })
      .catch(() => {});
    load();
    const unsub = subscribeInvites(session.user.id, load);
    return () => {
      alive = false;
      unsub();
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!room?.id) return undefined;
    const unsubRoom = subscribeRoom(room.id, (nextRoom) => setRoom((current) => ({ ...(current || {}), ...(nextRoom || {}) })));
    const refreshRoomInvites = () => getRoomDuelInvites(room.id).then(setRoomInvites).catch(() => {});
    const refreshEvents = () => getDuelEvents(room.id).then((events) => setEventCount(events.length)).catch(() => {});
    refreshRoomInvites();
    refreshEvents();
    const unsubPlayers = subscribePlayers(room.id, setPlayers);
    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [room?.id]);

  useEffect(() => {
    if (!room?.id || !room.start_at || !['countdown', 'running'].includes(room.status)) {
      setCountdownMs(null);
      return undefined;
    }
    const tick = async () => {
      const remaining = new Date(room.start_at).getTime() - Date.now();
      setCountdownMs(Math.max(0, remaining));
      if (remaining <= 0 && startedRoomId !== room.id) {
        setStartedRoomId(room.id);
        if (isHost && room.status === 'countdown') {
          markDuelRunning(room.id).catch(() => {});
        }
        const latestPlayers = await getDuelPlayers(room.id).catch(() => players);
        onStartDuel({ room: { ...room, status: 'running' }, players: latestPlayers, levelId: room.level_id || levelId });
      }
    };
    tick();
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [room?.id, room?.status, room?.start_at, startedRoomId, isHost, players, levelId, onStartDuel]);

  async function requireProfile() {
    if (!session?.user) throw new Error('Zaloguj sie, zeby grac DUEL.');
    return profile || ensureProfile(session.user);
  }

  async function createRoom() {
    setBusy(true);
    setStatus('');
    try {
      const p = await requireProfile();
      const nextRoom = await createDuelRoom({ user: session.user, profile: p, mode, levelId });
      setRoom(nextRoom);
      setStatus(`Pokoj ${nextRoom.code} gotowy.`);
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie utworzyc pokoju.');
    } finally {
      setBusy(false);
    }
  }

  async function runQuickMatch() {
    setBusy(true);
    setStatus('Szukam przeciwnika...');
    try {
      const p = await requireProfile();
      const matched = await quickMatch({ user: session.user, profile: p, mode: quickMode, levelPreference: quickLevel });
      setRoom(matched.room);
      setStatus(matched.created ? 'Stworzono pokoj - czekamy na gracza.' : 'Znaleziono pokoj!');
      onRoomJoined?.();
    } catch (error) {
      setStatus(error.message || 'Quick Match nie zadzialal.');
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(targetRoom = null) {
    setBusy(true);
    setStatus('');
    try {
      const p = await requireProfile();
      const joined = await joinDuelRoom({ roomId: targetRoom?.id, code: targetRoom ? null : joinCode, user: session.user, profile: p });
      const nextRoom = targetRoom || await getDuelRoom(joined.room_id);
      setRoom(nextRoom);
      setJoinPromptRoom(null);
      setStatus('Dolaczono do DUEL.');
      onRoomJoined?.();
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie dolaczyc.');
    } finally {
      setBusy(false);
    }
  }

  async function readyUp() {
    if (!room?.id || !session?.user) return;
    const nextReady = !me?.ready;
    await setReady(room.id, session.user.id, nextReady).catch((error) => setStatus(error.message));
  }

  async function hostStart() {
    if (!room?.id) return;
    try {
      await startDuelCountdown(room.id);
      setStatus('Countdown DUEL wystartowal.');
    } catch (error) {
      setStatus(error.message || 'Start DUEL nie zadzialal.');
    }
  }

  async function findPlayers(event) {
    event?.preventDefault();
    try {
      const list = await searchPlayersForDuel(search);
      setFoundPlayers(list.filter((player) => player.id !== session?.user?.id));
    } catch (error) {
      setStatus(error.message || 'Szukajka DUEL padla.');
    }
  }

  async function invite(playerId) {
    if (!room?.id) {
      setStatus('Najpierw utworz albo dolacz do pokoju.');
      return;
    }
    try {
      await inviteUserToDuel(room.id, session.user.id, playerId);
      setStatus('Zaproszenie DUEL wyslane.');
      getRoomDuelInvites(room.id).then(setRoomInvites).catch(() => {});
    } catch (error) {
      setStatus(error.message || 'Zaproszenie nie poszlo.');
    }
  }

  async function acceptInvite(invite) {
    try {
      const p = await requireProfile();
      const accepted = await acceptDuelInvite(invite.id, session.user, p);
      const nextRoom = await getDuelRoom(accepted.room.id);
      setRoom(nextRoom);
      setStatus(`Dolaczono do pokoju ${nextRoom.code}.`);
      getPendingDuelInvites(session.user.id).then(setInvites).catch(() => {});
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie zaakceptowac zaproszenia.');
    }
  }

  async function declineInvite(invite) {
    try {
      await declineDuelInvite(invite.id);
      setInvites((current) => current.filter((item) => item.id !== invite.id));
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie odrzucic zaproszenia.');
    }
  }

  async function leaveRoom() {
    if (!room?.id || !session?.user) return;
    try {
      await leaveDuelRoom(room.id, session.user.id);
      setRoom(null);
      setPlayers([]);
      setRoomInvites([]);
      setStatus('Opuszczono pokoj.');
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie opuscic pokoju.');
    }
  }

  async function cancelRoom() {
    if (!room?.id || !isHost) return;
    try {
      await cancelDuelRoom(room.id);
      setStatus('Pokoj anulowany.');
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie anulowac pokoju.');
    }
  }

  async function forceRefresh() {
    if (!room?.id) {
      await loadLobbyData();
      return;
    }
    const [nextRoom, nextPlayers, nextInvites, events] = await Promise.all([
      getDuelRoom(room.id),
      getDuelPlayers(room.id),
      getRoomDuelInvites(room.id),
      getDuelEvents(room.id),
    ]);
    setRoom(nextRoom);
    setPlayers(nextPlayers);
    setRoomInvites(nextInvites);
    setEventCount(events.length);
    setStatus('Odswiezono stan pokoju.');
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} skopiowany.`);
    } catch {
      setStatus('Nie udalo sie skopiowac.');
    }
  }

  function roomStatusText() {
    const now = Date.now();
    const lastSnapshotAge = me?.last_snapshot_at ? Math.round((now - new Date(me.last_snapshot_at).getTime()) / 1000) : null;
    return JSON.stringify({
      roomId: room?.id,
      code: room?.code,
      status: room?.status,
      mode: room?.mode,
      levelId: room?.level_id,
      startAt: room?.start_at,
      currentUser: session?.user?.id,
      myTeam: me?.team,
      playersCount: activePlayers.length,
      playersReady: activePlayers.filter((player) => player.ready).length,
      playersConnected: activePlayers.filter((player) => player.connected).length,
      lastSnapshotAgeSeconds: lastSnapshotAge,
      eventsCount: eventCount,
    }, null, 2);
  }

  if (!session?.user) {
    return (
      <section className="online-panel duel-panel">
        <h2>DUEL PvP</h2>
        <p>DUEL jest online PvP, wiec wymaga konta. Email nie jest publiczny, widoczny jest tylko nick.</p>
        <button className="secondary-button" onClick={onBack}>Menu</button>
      </section>
    );
  }

  return (
    <section className="online-panel duel-panel">
      <div className="duel-panel-head">
        <div>
          <h2>DUEL PvP</h2>
          <p>Arcade realtime: wspolna trasa, ghosty, power-upy, ataki i team score.</p>
        </div>
        <button className="secondary-button compact" onClick={loadLobbyData}>Odśwież</button>
      </div>

      <div className="duel-setup-grid">
        <label>Tryb
          <select value={mode} onChange={(event) => setMode(event.target.value)} disabled={Boolean(room)}>
            {Object.keys(DUEL_MODES).map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
        </label>
        <label>Mapa
          <select value={levelId} onChange={(event) => setLevelId(Number(event.target.value))} disabled={Boolean(room)}>
            {visibleLevels.map((level) => <option key={level.id} value={level.id}>{level.id}. {level.name}</option>)}
          </select>
        </label>
        <button className="primary-button" onClick={createRoom} disabled={busy || Boolean(room)}>Utworz pokoj</button>
        <form className="duel-code-form" onSubmit={(event) => { event.preventDefault(); joinRoom(); }}>
          <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="KOD" maxLength={8} />
          <button className="secondary-button" disabled={busy || !joinCode}>Dolacz</button>
        </form>
      </div>

      <div className="duel-room-card">
        <div className="duel-room-title">
          <strong>Szybki DUEL</strong>
          <span>{quickMode} / {quickLevel}</span>
        </div>
        <div className="duel-setup-grid">
          <label>Tryb
            <select value={quickMode} onChange={(event) => setQuickMode(event.target.value)} disabled={Boolean(room)}>
              <option value="1v1">1v1</option>
              <option value="2v2">2v2</option>
              <option value="3v3">3v3</option>
              <option value="4v4">4v4</option>
              <option value="5v5">5v5</option>
              <option value="any">Dowolny</option>
            </select>
          </label>
          <label>Mapa
            <select value={quickLevel} onChange={(event) => setQuickLevel(event.target.value)} disabled={Boolean(room)}>
              <option value="random">random PvP</option>
              <option value="easy">easy PvP</option>
              <option value="hard">hard PvP</option>
            </select>
          </label>
          <button className="primary-button" onClick={runQuickMatch} disabled={busy || Boolean(room)}>Szybki DUEL</button>
        </div>
      </div>

      {joinPromptRoom && (
        <div className="duel-room-card">
          <div className="duel-room-title">
            <strong>Dolaczyc do DUEL {joinPromptRoom.code}?</strong>
            <span>{joinPromptRoom.mode} - level {joinPromptRoom.level_id}</span>
          </div>
          <div className="menu-actions">
            <button className="primary-button" onClick={() => joinRoom(joinPromptRoom)}>Dolacz</button>
            <button className="secondary-button" onClick={() => setJoinPromptRoom(null)}>Anuluj</button>
          </div>
        </div>
      )}

      {activePrompt && !room && (
        <div className="duel-room-card">
          <div className="duel-room-title">
            <strong>Masz aktywny DUEL. Wrocic?</strong>
            <span>{activePrompt.room.code} - {activePrompt.room.status}</span>
          </div>
          {activePrompt.room.status === 'running' && <p className="small-note">Reconnect do trwajacej gry jest ograniczony: mozesz zobaczyc status pokoju albo porzucic udzial.</p>}
          <div className="menu-actions">
            <button className="primary-button" onClick={() => { setRoom(activePrompt.room); setActivePrompt(null); }}>Wroc</button>
            <button className="secondary-button" onClick={async () => {
              await leaveDuelRoom(activePrompt.room.id, session.user.id).catch(() => {});
              setActivePrompt(null);
            }}>Porzuc DUEL</button>
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <div className="duel-room-card">
          <div className="duel-room-title">
            <strong>Zaproszenia DUEL</strong>
            <span>{invites.length} pending</span>
          </div>
          {invites.map((invite) => (
            <div className="duel-player-row" key={invite.id}>
              <span>{invite.from_profile?.display_name || invite.from_profile?.username || 'Gracz'} zaprasza do {invite.duel_rooms?.mode}</span>
              <div className="menu-actions">
                <button className="primary-button compact" onClick={() => acceptInvite(invite)}>Akceptuj</button>
                <button className="secondary-button compact" onClick={() => declineInvite(invite)}>Odrzuc</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {room && (
        <div className="duel-room-card">
          <div className="duel-room-title">
            <strong>Pokoj {room.code || room.id?.slice(0, 6)}</strong>
            <span>{room.mode} - level {room.level_id || levelId} - {room.status}</span>
          </div>
          {room.status === 'countdown' && (
            <div className="duel-countdown">
              START ZA <strong>{Math.ceil((countdownMs || 0) / 1000)}</strong>
            </div>
          )}
          <div className="duel-teams">
            {['A', 'B'].map((team) => (
              <div className={`duel-team team-${team.toLowerCase()}`} key={team}>
                <h3>Team {team}</h3>
                {players.filter((player) => player.team === team).map((player) => (
                  <div className="duel-player-row" key={player.user_id}>
                    <span>{player.display_name || player.username}</span>
                    <em>{player.ready ? 'READY' : player.status}</em>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {roomInvites.length > 0 && (
            <div className="duel-progress-list">
              {roomInvites.slice(0, 5).map((invite) => (
                <div className="duel-progress-row" key={invite.id}>
                  <span>Zaproszono: {invite.to_profile?.display_name || invite.to_profile?.username || 'gracz'}</span>
                  <b>{invite.status}</b>
                </div>
              ))}
            </div>
          )}
          <p className={`online-status ${canStart ? 'ok' : ''}`}>{startReason}</p>
          <div className="menu-actions">
            <button className="primary-button" onClick={readyUp} disabled={room.status !== 'lobby'}>{me?.ready ? 'Cofnij ready' : 'Gotowy'}</button>
            {isHost && <button className="primary-button" onClick={hostStart} disabled={!canStart}>Start DUEL</button>}
            <button className="secondary-button" onClick={leaveRoom}>Opusc</button>
          </div>
          {(playtest || import.meta.env.DEV) && (
            <div className="duel-test-tools">
              <strong>DUEL TEST TOOLS</strong>
              <div className="menu-actions">
                <button className="secondary-button compact" onClick={() => copyText(room.code || '', 'Kod pokoju')}>Kopiuj kod</button>
                <button className="secondary-button compact" onClick={() => copyText(`${window.location.origin}/?duelRoom=${room.code}&playtest=1`, 'Link pokoju')}>Kopiuj link</button>
                <button className="secondary-button compact" onClick={() => copyText(roomStatusText(), 'Status pokoju')}>Kopiuj status</button>
                <button className="secondary-button compact" onClick={forceRefresh}>Force refresh</button>
                <button className="secondary-button compact" onClick={leaveRoom}>Resetuj moj udzial</button>
                {isHost && <button className="danger-button compact" onClick={cancelRoom}>Anuluj pokoj</button>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="duel-browser-grid">
        <div>
          <h3>Publiczne pokoje</h3>
          {publicRooms.map((item) => (
            <button className="duel-list-row" key={item.id} onClick={() => item.status === 'lobby' && joinRoom(item)} disabled={item.status !== 'lobby'}>
              <strong>{item.code}</strong><span>{item.mode} L{item.level_id} {item.status}</span><em>{item.duel_players?.length || 0}/{item.max_players}</em>
            </button>
          ))}
          {!publicRooms.length && rooms.map((item) => (
            <button className="duel-list-row" key={item.id} onClick={() => joinRoom(item)}>
              <strong>{item.code}</strong><span>{item.mode} L{item.level_id}</span><em>{item.duel_players?.length || 0}/{item.max_players}</em>
            </button>
          ))}
        </div>
        <div>
          <h3>Aktywni gracze</h3>
          <form className="duel-code-form" onSubmit={findPlayers}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="username" />
            <button className="secondary-button">Szukaj</button>
          </form>
          {[...foundPlayers, ...randomPlayers].slice(0, 10).map((player) => (
            <button className="duel-list-row" key={`${player.id}-${player.username}`} onClick={() => invite(player.id)}>
              <strong>{player.display_name || player.username}</strong><span>@{player.username}</span><em>{player.duel_status || 'available'}</em>
            </button>
          ))}
        </div>
        <div>
          <h3>Ranking DUEL</h3>
          {leaderboard.season && <p className="small-note">{leaderboard.season.name}</p>}
          {leaderboard.rows.map((row, index) => (
            <div className="duel-list-row" key={`${row.user_id}-${row.season_id}`}>
              <strong>#{index + 1} {row.profile?.display_name || row.profile?.username || 'Gracz'}</strong>
              <span>{row.rating} elo</span>
              <em>{row.wins}-{row.losses}</em>
            </div>
          ))}
          {!leaderboard.rows.length && <p className="small-note">Brak sezonowego rankingu.</p>}
        </div>
        <div>
          <h3>Historia</h3>
          {history.map((item) => {
            const winner = item.duel_results?.winner_team;
            const result = !winner ? 'DRAW' : winner === item.team ? 'WIN' : 'LOSE';
            return (
              <div className="duel-list-row" key={item.id}>
                <strong>{result}</strong><span>{item.duel_results?.mode} L{item.duel_results?.level_id}</span><em>{item.score}</em>
              </div>
            );
          })}
          {!history.length && <p className="small-note">Brak DUEL w historii.</p>}
        </div>
      </div>

      {status && <p className="online-status">{status}</p>}
    </section>
  );
}
