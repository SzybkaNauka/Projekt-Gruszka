import React, { useEffect, useMemo, useState } from 'react';
import { levels } from '../game/levels.js';
import { DUEL_MODES } from '../game/constants.js';
import { ensureProfile } from '../services/profileService.js';
import {
  createDuelRoom,
  getDuelRoom,
  getRandomPlayersForDuel,
  inviteUserToDuel,
  joinDuelRoom,
  listOpenDuelRooms,
  searchPlayersForDuel,
  setReady,
  startDuel,
  subscribePlayers,
  subscribeRoom,
} from '../services/duelService.js';

export default function DuelPanel({ session, profile, onStartDuel, onBack }) {
  const [mode, setMode] = useState('1v1');
  const [levelId, setLevelId] = useState(1);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [search, setSearch] = useState('');
  const [foundPlayers, setFoundPlayers] = useState([]);
  const [randomPlayers, setRandomPlayers] = useState([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const me = players.find((player) => player.user_id === session?.user?.id);
  const allReady = players.length >= 2 && players.every((player) => player.ready || player.user_id === room?.host_user_id);
  const isHost = room?.host_user_id === session?.user?.id;

  const visibleLevels = useMemo(() => levels.slice(0, 50), []);

  async function loadLobbyData() {
    try {
      const [openRooms, randoms] = await Promise.all([
        listOpenDuelRooms(12),
        getRandomPlayersForDuel(8),
      ]);
      setRooms(openRooms);
      setRandomPlayers(randoms.filter((player) => player.id !== session?.user?.id));
    } catch (error) {
      setStatus(error.message || 'Nie udalo sie pobrac DUEL.');
    }
  }

  useEffect(() => {
    if (session?.user) loadLobbyData();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!room?.id) return undefined;
    const unsubRoom = subscribeRoom(room.id, (nextRoom) => setRoom((current) => ({ ...(current || {}), ...(nextRoom || {}) })));
    const unsubPlayers = subscribePlayers(room.id, setPlayers);
    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [room?.id]);

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

  async function joinRoom(targetRoom = null) {
    setBusy(true);
    setStatus('');
    try {
      const p = await requireProfile();
      const joined = await joinDuelRoom({ roomId: targetRoom?.id, code: targetRoom ? null : joinCode, user: session.user, profile: p });
      const nextRoom = targetRoom || await getDuelRoom(joined.room_id);
      setRoom(nextRoom);
      setStatus('Dolaczono do DUEL.');
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
      const nextRoom = await startDuel(room.id);
      onStartDuel({ room: nextRoom, players, levelId: nextRoom.level_id || levelId });
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
    } catch (error) {
      setStatus(error.message || 'Zaproszenie nie poszlo.');
    }
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

      {room && (
        <div className="duel-room-card">
          <div className="duel-room-title">
            <strong>Pokoj {room.code || room.id?.slice(0, 6)}</strong>
            <span>{room.mode} - level {room.level_id || levelId} - {room.status}</span>
          </div>
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
          <div className="menu-actions">
            {!isHost && <button className="primary-button" onClick={readyUp}>{me?.ready ? 'Cofnij ready' : 'Ready'}</button>}
            {isHost && <button className="primary-button" onClick={hostStart} disabled={!allReady}>Start DUEL</button>}
            <button className="secondary-button" onClick={() => onStartDuel({ room, players, levelId: room.level_id || levelId })}>Test lokalny DUEL</button>
          </div>
        </div>
      )}

      <div className="duel-browser-grid">
        <div>
          <h3>Otwarte pokoje</h3>
          {rooms.map((item) => (
            <button className="duel-list-row" key={item.id} onClick={() => joinRoom(item)}>
              <strong>{item.code}</strong><span>{item.mode} L{item.level_id}</span><em>{item.duel_players?.length || 0}/{item.max_players}</em>
            </button>
          ))}
        </div>
        <div>
          <h3>Zaproszenia po nicku</h3>
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
      </div>

      {status && <p className="online-status">{status}</p>}
    </section>
  );
}
