import { DUEL_COUNTDOWN_MS, DUEL_EVENT_SEND_INTERVAL_MS, DUEL_MODES } from '../game/constants.js';
import { requireSupabase, supabase } from '../lib/supabase.js';

const ROOM_SELECT = '*, duel_players(*)';
const EVENT_BUCKET = new Map();
const DUEL_RESULT_SELECT = '*, duel_player_results(*)';

function modeConfig(mode = '1v1') {
  return DUEL_MODES[mode] || DUEL_MODES['1v1'];
}

function pvpLevelForPreference(preference = 'random') {
  const easy = [1, 5, 10];
  const hard = [20, 30, 40, 50];
  const pool = preference === 'easy' ? easy : preference === 'hard' ? hard : [1, 5, 10, 20, 30, 40, 50];
  return pool[Math.floor(Math.random() * pool.length)] || 1;
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizeProfile(user, profile = {}) {
  const metadata = user?.user_metadata || {};
  const username = profile.username || metadata.username || user?.email?.split('@')[0] || `pear_${String(user?.id || '').slice(0, 8)}`;
  return {
    username,
    display_name: profile.display_name || metadata.display_name || username,
    avatar_pear: profile.avatar_pear || metadata.avatar_pear || 'knight',
  };
}

function teamForIndex(index = 0) {
  return index % 2 === 0 ? 'A' : 'B';
}

function activePlayers(players = []) {
  return players.filter((player) => player.status !== 'left');
}

function teamCounts(players = []) {
  return activePlayers(players).reduce((counts, player) => {
    counts[player.team] = (counts[player.team] || 0) + 1;
    return counts;
  }, { A: 0, B: 0 });
}

function pickTeam(players, preferredTeam, teamSize) {
  const counts = teamCounts(players);
  const preferred = preferredTeam === 'A' || preferredTeam === 'B' ? preferredTeam : null;
  if (preferred && counts[preferred] < teamSize) return preferred;
  const other = preferred === 'A' ? 'B' : 'A';
  if (preferred && counts[other] < teamSize) return other;
  if (counts.A <= counts.B && counts.A < teamSize) return 'A';
  if (counts.B < teamSize) return 'B';
  throw new Error('Druzyna jest pelna.');
}

function validateStartConditions(room, players = []) {
  const active = activePlayers(players);
  const counts = teamCounts(active);
  if (!room) throw new Error('Nie znaleziono pokoju DUEL.');
  if (room.status !== 'lobby') throw new Error('Pojedynek juz wystartowal.');
  if (active.length < 2) throw new Error('Czekamy na graczy.');
  if (counts.A !== counts.B || counts.A === 0) throw new Error('Druzyny musza miec taka sama liczbe graczy.');
  if (counts.A > Number(room.team_size || 1) || counts.B > Number(room.team_size || 1)) throw new Error('Pokoj jest pelny.');
  if (active.some((player) => !player.connected || player.status === 'left')) throw new Error('Ktos jest rozlaczony.');
  if (active.some((player) => !player.ready)) throw new Error('Wszyscy gracze musza byc gotowi.');
  return true;
}

function calculateTeamScores(players = []) {
  return ['A', 'B'].reduce((scores, team) => {
    scores[team] = players
      .filter((player) => player.team === team)
      .reduce((sum, player) => sum
        + Number(player.score || 0)
        + (player.finished ? 1500 : 0)
        + (player.premium_star_collected ? 900 : 0)
        + Number(player.hits_dealt || 0) * 120
        + Number(player.shields_used || 0) * 80, 0);
    return scores;
  }, { A: 0, B: 0 });
}

function pickMvp(players = []) {
  return [...players].sort((a, b) => {
    const scoreA = Number(a.score || 0) + Number(a.hits_dealt || 0) * 120 + Number(a.shields_used || 0) * 80 + (a.finished ? 1500 : 0);
    const scoreB = Number(b.score || 0) + Number(b.hits_dealt || 0) * 120 + Number(b.shields_used || 0) * 80 + (b.finished ? 1500 : 0);
    return scoreB - scoreA;
  })[0] || null;
}

function normalizeDuelError(error) {
  const text = `${error?.message || error || ''}`.toLowerCase();
  if (text.includes('duplicate')) return 'Ten rekord juz istnieje.';
  if (text.includes('permission') || text.includes('rls') || text.includes('policy')) return 'Brak uprawnien do tej akcji.';
  if (text.includes('not found')) return 'Nie znaleziono pokoju.';
  return error?.message || 'Akcja DUEL nie powiodla sie.';
}

export { normalizeDuelError };

async function countPlayers(roomId) {
  const client = requireSupabase();
  const { count, error } = await client
    .from('duel_players')
    .select('user_id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .neq('status', 'left');
  if (error) throw error;
  return count || 0;
}

export async function createDuelRoom({ user, profile, mode = '1v1', levelId = 1, visibility = 'public' }) {
  const client = requireSupabase();
  const cfg = modeConfig(mode);
  const roomPayload = {
    code: createRoomCode(),
    host_user_id: user.id,
    mode,
    status: 'lobby',
    level_id: levelId,
    visibility,
    max_players: cfg.maxPlayers,
    team_size: cfg.teamSize,
  };
  const { data: room, error } = await client.from('duel_rooms').insert(roomPayload).select('*').single();
  if (error) throw error;
  await joinDuelRoom({ roomId: room.id, user, profile, preferredTeam: 'A' });
  return room;
}

export async function getDuelRoomByCode(code) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_rooms')
    .select(ROOM_SELECT)
    .eq('code', String(code || '').trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function joinDuelRoom({ roomId, code, user, profile, preferredTeam }) {
  const client = requireSupabase();
  let roomIdToJoin = roomId;
  let room = null;
  if (!roomIdToJoin && code) {
    const { data, error } = await client.from('duel_rooms').select('*').eq('code', String(code).trim().toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Nie znaleziono pokoju DUEL.');
    room = data;
    roomIdToJoin = data.id;
  }
  if (!room) {
    const { data, error } = await client.from('duel_rooms').select('*').eq('id', roomIdToJoin).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Nie znaleziono pokoju DUEL.');
    room = data;
  }
  if (room.status !== 'lobby') throw new Error('Ten pojedynek juz wystartowal.');
  const { data: existing, error: existingError } = await client
    .from('duel_players')
    .select('*')
    .eq('room_id', roomIdToJoin)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing && existing.status !== 'left') return existing;
  const { data: players, error: playersError } = await client
    .from('duel_players')
    .select('*')
    .eq('room_id', roomIdToJoin)
    .neq('status', 'left');
  if (playersError) throw playersError;
  const active = players || [];
  if (active.length >= Number(room.max_players || modeConfig(room.mode).maxPlayers)) {
    throw new Error('Pokoj jest pelny.');
  }
  const team = pickTeam(active, preferredTeam, Number(room.team_size || modeConfig(room.mode).teamSize));
  const playerProfile = normalizeProfile(user, profile);
  const payload = {
    room_id: roomIdToJoin,
    user_id: user.id,
    ...playerProfile,
    team,
    ready: false,
    connected: true,
    status: 'lobby',
    alive: true,
    finished: false,
    failed: false,
    score: 0,
    progress_percent: 0,
    x: 190,
    y: 430,
    velocity_x: 0,
    velocity_y: 0,
    current_vehicle: 'wooden',
    held_powerup: null,
    premium_star_collected: false,
    last_snapshot_at: new Date().toISOString(),
  };
  const { data, error } = await client.from('duel_players').upsert(payload, { onConflict: 'room_id,user_id' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function leaveDuelRoom(roomId, userId) {
  const client = requireSupabase();
  const { error } = await client
    .from('duel_players')
    .update({ connected: false, status: 'left', updated_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
  const { data: remaining } = await client
    .from('duel_players')
    .select('user_id, created_at')
    .eq('room_id', roomId)
    .neq('status', 'left')
    .order('created_at', { ascending: true });
  const { data: room } = await client.from('duel_rooms').select('*').eq('id', roomId).maybeSingle();
  if (room?.host_user_id === userId) {
    if (remaining?.length) {
      await client.from('duel_rooms').update({ host_user_id: remaining[0].user_id, updated_at: new Date().toISOString() }).eq('id', roomId);
    } else if (room.status === 'lobby') {
      await client.from('duel_rooms').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', roomId);
    }
  }
}

export async function resetMyDuelPlayer(roomId, userId) {
  return leaveDuelRoom(roomId, userId);
}

export async function cancelDuelRoom(roomId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_rooms')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function setReady(roomId, userId, ready = true) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_players')
    .update({ ready, status: ready ? 'loading' : 'lobby', updated_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function startDuel(roomId) {
  return startDuelCountdown(roomId);
}

export async function startDuelCountdown(roomId) {
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  const { data: room, error: roomError } = await client.from('duel_rooms').select('*').eq('id', roomId).maybeSingle();
  if (roomError) throw roomError;
  if (room?.host_user_id !== authData?.user?.id) throw new Error('Tylko host moze wystartowac DUEL.');
  const players = await getDuelPlayers(roomId);
  validateStartConditions(room, players);
  const startAt = new Date(Date.now() + DUEL_COUNTDOWN_MS).toISOString();
  const { data, error } = await client
    .from('duel_rooms')
    .update({ status: 'countdown', start_at: startAt, updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function markDuelRunning(roomId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_rooms')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .in('status', ['countdown', 'running'])
    .select('*')
    .single();
  if (error) throw error;
  await client.from('duel_players').update({ status: 'running', updated_at: new Date().toISOString() }).eq('room_id', roomId).neq('status', 'left');
  return data;
}

export async function finishDuelRoom(roomId, winnerTeam) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_rooms')
    .update({ status: 'finished', winner_team: winnerTeam || null, finished_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function finalizeDuel(roomId) {
  const client = requireSupabase();
  const { data: existing, error: existingError } = await client
    .from('duel_results')
    .select(DUEL_RESULT_SELECT)
    .eq('room_id', roomId)
    .maybeSingle();
  if (existingError && existingError.code !== '42P01') throw existingError;
  if (existing) return existing;

  const { data: room, error: roomError } = await client.from('duel_rooms').select('*').eq('id', roomId).maybeSingle();
  if (roomError) throw roomError;
  if (!room) throw new Error('Nie znaleziono pokoju DUEL.');
  const players = await getDuelPlayers(roomId);
  const scores = calculateTeamScores(players);
  const winnerTeam = scores.A === scores.B ? null : scores.A > scores.B ? 'A' : 'B';
  const mvp = pickMvp(players);
  const payload = {
    room_id: roomId,
    mode: room.mode,
    level_id: room.level_id,
    winner_team: winnerTeam,
    team_a_score: scores.A,
    team_b_score: scores.B,
    mvp_user_id: mvp?.user_id || null,
    finished_at: new Date().toISOString(),
  };

  let result;
  const { data, error } = await client.from('duel_results').insert(payload).select('*').single();
  if (error) {
    if (error.code === '23505') {
      const { data: duplicated, error: duplicateError } = await client.from('duel_results').select(DUEL_RESULT_SELECT).eq('room_id', roomId).maybeSingle();
      if (duplicateError) throw duplicateError;
      return duplicated;
    }
    throw error;
  }
  result = data;

  const rows = players.map((player, index) => ({
    result_id: result.id,
    room_id: roomId,
    user_id: player.user_id,
    team: player.team,
    placement: index + 1,
    score: Number(player.score || 0),
    progress_percent: Number(player.progress_percent || 0),
    time_ms: player.time_ms,
    finished: Boolean(player.finished),
    failed: Boolean(player.failed),
    premium_star_collected: Boolean(player.premium_star_collected),
    hits_dealt: Number(player.hits_dealt || 0),
    hits_received: Number(player.hits_received || 0),
    powerups_used: Number(player.powerups_used || 0),
    traps_placed: Number(player.traps_placed || 0),
    shields_used: Number(player.shields_used || 0),
    is_mvp: player.user_id === mvp?.user_id,
  }));
  if (rows.length) {
    await client.from('duel_player_results').upsert(rows, { onConflict: 'room_id,user_id' });
    await Promise.all(players.map(async (player) => {
      const won = winnerTeam && player.team === winnerTeam;
      const draw = !winnerTeam;
      const current = await getMyDuelStats(player.user_id).catch(() => null);
      const { error: statsError } = await client.from('duel_stats').upsert({
        user_id: player.user_id,
        duel_matches: Number(current?.duel_matches || 0) + 1,
        duel_wins: Number(current?.duel_wins || 0) + (won ? 1 : 0),
        duel_losses: Number(current?.duel_losses || 0) + (!won && !draw ? 1 : 0),
        duel_draws: Number(current?.duel_draws || 0) + (draw ? 1 : 0),
        duel_mvp_count: Number(current?.duel_mvp_count || 0) + (player.user_id === mvp?.user_id ? 1 : 0),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: false });
      if (statsError) return null;
      return true;
    }));
  }
  await finishDuelRoom(roomId, winnerTeam).catch(() => null);
  return { ...result, duel_player_results: rows };
}

export async function finalizeDuelViaEdgeFunction(roomId) {
  if (!supabase) return finalizeDuel(roomId);
  const { data, error } = await supabase.functions.invoke('finalize-duel', {
    body: { roomId },
  });
  if (error) {
    const playtest = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('playtest') === '1';
    if (import.meta.env.DEV || playtest) {
      return finalizeDuel(roomId);
    }
    throw error;
  }
  return data?.result || data;
}

export async function createRematchRoom({ roomId, user, profile, levelMode = 'same' }) {
  const previous = await getDuelRoom(roomId);
  if (!previous) throw new Error('Nie znaleziono pokoju DUEL.');
  if (previous.host_user_id !== user.id) throw new Error('Tylko host moze stworzyc rewanz.');
  const previousPlayers = await getDuelPlayers(roomId);
  const levelId = levelMode === 'next' ? Math.min(50, Number(previous.level_id || 1) + 1) : previous.level_id;
  const nextRoom = await createDuelRoom({ user, profile, mode: previous.mode, levelId, visibility: 'private' });
  await Promise.all(previousPlayers
    .filter((player) => player.user_id !== user.id)
    .map((player) => inviteUserToDuel(nextRoom.id, user.id, player.user_id).catch(() => null)));
  return nextRoom;
}

export function subscribeRoom(roomId, callback) {
  if (!supabase || !roomId) return () => {};
  const channel = supabase
    .channel(`duel-room-${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'duel_rooms', filter: `id=eq.${roomId}` }, (payload) => callback(payload.new || payload.old, payload))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribePlayers(roomId, callback) {
  if (!supabase || !roomId) return () => {};
  const channel = supabase
    .channel(`duel-players-${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'duel_players', filter: `room_id=eq.${roomId}` }, () => {
      getDuelPlayers(roomId).then(callback).catch(() => {});
    })
    .subscribe();
  getDuelPlayers(roomId).then(callback).catch(() => {});
  return () => supabase.removeChannel(channel);
}

export function subscribeDuelEvents(roomId, callback) {
  if (!supabase || !roomId) return () => {};
  const channel = supabase
    .channel(`duel-events-${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duel_events', filter: `room_id=eq.${roomId}` }, (payload) => callback(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribePlayerSnapshots(roomId, callback) {
  return subscribePlayers(roomId, callback);
}

export async function getDuelRoom(roomId) {
  const client = requireSupabase();
  const { data, error } = await client.from('duel_rooms').select(ROOM_SELECT).eq('id', roomId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDuelPlayers(roomId) {
  const client = requireSupabase();
  const { data, error } = await client.from('duel_players').select('*').eq('room_id', roomId).neq('status', 'left').order('team').order('score', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getDuelEvents(roomId, limit = 40) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_events')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getMyActiveDuelRoom(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_players')
    .select('room_id, status, last_snapshot_at')
    .eq('user_id', userId)
    .neq('status', 'left')
    .order('updated_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  const rows = data || [];
  for (const row of rows) {
    const room = await getDuelRoom(row.room_id).catch(() => null);
    if (room && ['lobby', 'countdown', 'running'].includes(room.status)) {
      return { room, player: row };
    }
  }
  return null;
}

export async function listOpenDuelRooms(limit = 12) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_rooms')
    .select(ROOM_SELECT)
    .in('status', ['lobby', 'countdown'])
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function listPublicDuelRooms({ mode = 'any', onlyJoinable = true, limit = 20 } = {}) {
  const client = requireSupabase();
  let query = client
    .from('duel_rooms')
    .select(ROOM_SELECT)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (onlyJoinable) query = query.eq('status', 'lobby');
  else query = query.in('status', ['lobby', 'running', 'countdown']);
  if (mode && mode !== 'any') query = query.eq('mode', mode);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function quickMatch({ user, profile, mode = '1v1', levelPreference = 'random' }) {
  const targetMode = mode === 'any' ? '1v1' : mode;
  const rooms = await listPublicDuelRooms({ mode: targetMode, onlyJoinable: true, limit: 20 });
  const freshSince = Date.now() - 10 * 60 * 1000;
  const room = rooms.find((item) => {
    const players = activePlayers(item.duel_players || []);
    return players.length < Number(item.max_players || modeConfig(item.mode).maxPlayers)
      && new Date(item.created_at).getTime() >= freshSince;
  });
  if (room) {
    await joinDuelRoom({ roomId: room.id, user, profile });
    return { room: await getDuelRoom(room.id), created: false };
  }
  const nextRoom = await createDuelRoom({
    user,
    profile,
    mode: targetMode,
    levelId: pvpLevelForPreference(levelPreference),
    visibility: 'public',
  });
  return { room: nextRoom, created: true };
}

export async function sendPlayerSnapshot(roomId, userId, snapshot) {
  const client = requireSupabase();
  const payload = {
    x: Math.round(snapshot.x || 0),
    y: Math.round(snapshot.y || 0),
    progress_percent: Number(snapshot.progressPercent || snapshot.progress_percent || 0),
    velocity_x: Number(snapshot.velocityX || snapshot.velocity_x || 0),
    velocity_y: Number(snapshot.velocityY || snapshot.velocity_y || 0),
    current_vehicle: snapshot.currentVehicle || snapshot.current_vehicle || null,
    held_powerup: snapshot.heldPowerup || snapshot.held_powerup || null,
    score: Number(snapshot.score || 0),
    status: snapshot.status || 'running',
    alive: snapshot.alive !== false,
    finished: Boolean(snapshot.finished),
    failed: Boolean(snapshot.failed),
    time_ms: snapshot.timeMs == null ? null : Number(snapshot.timeMs),
    premium_star_collected: Boolean(snapshot.premiumStarCollected || snapshot.premium_star_collected),
    hits_dealt: Number(snapshot.hitsDealt || snapshot.hits_dealt || 0),
    hits_received: Number(snapshot.hitsReceived || snapshot.hits_received || 0),
    powerups_used: Number(snapshot.powerupsUsed || snapshot.powerups_used || 0),
    traps_placed: Number(snapshot.trapsPlaced || snapshot.traps_placed || 0),
    shields_used: Number(snapshot.shieldsUsed || snapshot.shields_used || 0),
    last_snapshot_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from('duel_players').update(payload).eq('room_id', roomId).eq('user_id', userId);
  if (error) throw error;
}

export async function sendDuelEvent(roomId, event) {
  const client = requireSupabase();
  const now = Date.now();
  const key = `${roomId}:${event.senderUserId || event.sender_user_id || 'anon'}:${event.type}`;
  if (now - (EVENT_BUCKET.get(key) || 0) < DUEL_EVENT_SEND_INTERVAL_MS) {
    return { throttled: true };
  }
  EVENT_BUCKET.set(key, now);
  const payload = {
    room_id: roomId,
    sender_user_id: event.senderUserId || event.sender_user_id,
    target_user_id: event.targetUserId || event.target_user_id || null,
    target_team: event.targetTeam || event.target_team || null,
    type: event.type,
    payload: {
      ...event,
      createdAt: event.createdAt || new Date().toISOString(),
    },
  };
  const { data, error } = await client.from('duel_events').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function collectPowerup(roomId, userId, powerupId, powerupType) {
  await updateHeldPowerup(roomId, userId, powerupType);
  return sendDuelEvent(roomId, { type: 'powerup_collected', senderUserId: userId, powerupId, powerupType });
}

export async function usePowerup(roomId, userId, powerup) {
  await clearHeldPowerup(roomId, userId);
  return sendDuelEvent(roomId, { type: 'powerup_used', senderUserId: userId, powerupType: powerup?.type || powerup, effectDurationMs: powerup?.durationMs });
}

export function applyRemoteAttack(event) {
  return event?.payload || event;
}

export async function updateHeldPowerup(roomId, userId, powerup) {
  const client = requireSupabase();
  const { error } = await client.from('duel_players').update({ held_powerup: powerup || null, updated_at: new Date().toISOString() }).eq('room_id', roomId).eq('user_id', userId);
  if (error) throw error;
}

export async function clearHeldPowerup(roomId, userId) {
  return updateHeldPowerup(roomId, userId, null);
}

export async function searchPlayersForDuel(query) {
  const client = requireSupabase();
  const clean = String(query || '').trim().toLowerCase();
  if (clean.length < 2) return [];
  const { data, error } = await client
    .from('profiles')
    .select('id, username, display_name, avatar_pear, last_seen_at, duel_status, allow_random_invites')
    .ilike('username', `%${clean}%`)
    .limit(12);
  if (error) throw error;
  return data || [];
}

export async function getRandomPlayersForDuel(limit = 8) {
  const client = requireSupabase();
  const activeSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from('profiles')
    .select('id, username, display_name, avatar_pear, last_seen_at, duel_status, allow_random_invites')
    .eq('allow_random_invites', true)
    .not('username', 'is', null)
    .gte('last_seen_at', activeSince)
    .eq('duel_status', 'available')
    .order('last_seen_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  if (data?.length) return data;
  const { data: fallback, error: fallbackError } = await client
    .from('profiles')
    .select('id, username, display_name, avatar_pear, last_seen_at, duel_status, allow_random_invites')
    .eq('allow_random_invites', true)
    .not('username', 'is', null)
    .order('total_score', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (fallbackError) throw fallbackError;
  return fallback || [];
}

export async function inviteUserToDuel(roomId, fromUserId, toUserId) {
  const client = requireSupabase();
  const { data: targetProfile, error: profileError } = await client
    .from('profiles')
    .select('id, allow_duel_invites_from')
    .eq('id', toUserId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (targetProfile?.allow_duel_invites_from === 'none') throw new Error('Ten gracz nie przyjmuje zaproszen.');
  const { data: block } = await client
    .from('user_blocks')
    .select('*')
    .or(`and(blocker_id.eq.${toUserId},blocked_id.eq.${fromUserId}),and(blocker_id.eq.${fromUserId},blocked_id.eq.${toUserId})`)
    .maybeSingle();
  if (block) throw new Error('Nie mozesz zaprosic tego gracza.');
  if (targetProfile?.allow_duel_invites_from === 'friends') {
    const { data: friendship } = await client
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${fromUserId},addressee_id.eq.${toUserId}),and(requester_id.eq.${toUserId},addressee_id.eq.${fromUserId})`)
      .maybeSingle();
    if (!friendship) throw new Error('Ten gracz przyjmuje zaproszenia tylko od znajomych.');
  }
  const { data: room, error: roomError } = await client.from('duel_rooms').select('*').eq('id', roomId).maybeSingle();
  if (roomError) throw roomError;
  if (!room || room.status !== 'lobby') throw new Error('Pojedynek juz wystartowal.');
  const { data: pending, error: pendingError } = await client
    .from('duel_invites')
    .select('*')
    .eq('room_id', roomId)
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (pendingError) throw pendingError;
  if (pending) throw new Error('Zaproszenie jest juz wyslane.');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from('duel_invites')
    .upsert({ room_id: roomId, from_user_id: fromUserId, to_user_id: toUserId, status: 'pending', expires_at: expiresAt }, { onConflict: 'room_id,from_user_id,to_user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getPendingDuelInvites(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_invites')
    .select('*, duel_rooms(*)')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  const invites = data || [];
  const senderIds = [...new Set(invites.map((invite) => invite.from_user_id).filter(Boolean))];
  if (!senderIds.length) return invites;
  const { data: profiles } = await client
    .from('profiles')
    .select('id, username, display_name, avatar_pear')
    .in('id', senderIds);
  const profileById = new Map((profiles || []).map((item) => [item.id, item]));
  return invites.map((invite) => ({ ...invite, from_profile: profileById.get(invite.from_user_id) || null }));
}

export async function getRoomDuelInvites(roomId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_invites')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const invites = data || [];
  const userIds = [...new Set(invites.flatMap((invite) => [invite.from_user_id, invite.to_user_id]).filter(Boolean))];
  if (!userIds.length) return invites;
  const { data: profiles } = await client
    .from('profiles')
    .select('id, username, display_name, avatar_pear')
    .in('id', userIds);
  const profileById = new Map((profiles || []).map((item) => [item.id, item]));
  return invites.map((invite) => ({
    ...invite,
    from_profile: profileById.get(invite.from_user_id) || null,
    to_profile: profileById.get(invite.to_user_id) || null,
  }));
}

export async function getMyDuelHistory(userId, limit = 5) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_player_results')
    .select('*, duel_results(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getMyDuelStats(userId) {
  const client = requireSupabase();
  const { data, error } = await client.from('duel_stats').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getActiveDuelSeason() {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('duel_seasons')
    .select('*')
    .eq('active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDuelLeaderboard(limit = 20) {
  const client = requireSupabase();
  const season = await getActiveDuelSeason();
  if (!season) return { season: null, rows: [] };
  const { data, error } = await client
    .from('duel_ratings')
    .select('*')
    .eq('season_id', season.id)
    .order('rating', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const userIds = (data || []).map((row) => row.user_id);
  const { data: profiles } = userIds.length
    ? await client.from('profiles').select('id, username, display_name, avatar_pear').in('id', userIds)
    : { data: [] };
  const profileById = new Map((profiles || []).map((item) => [item.id, item]));
  return { season, rows: (data || []).map((row) => ({ ...row, profile: profileById.get(row.user_id) || null })) };
}

export async function getMyDuelAchievements(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function blockUser(blockedId) {
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  const blockerId = authData?.user?.id;
  if (!blockerId) throw new Error('Nie jestes zalogowany.');
  const { error } = await client.from('user_blocks').upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' });
  if (error) throw error;
}

export async function unblockUser(blockedId) {
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  const blockerId = authData?.user?.id;
  if (!blockerId) throw new Error('Nie jestes zalogowany.');
  const { error } = await client.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function getBlockedUsers() {
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  const blockerId = authData?.user?.id;
  if (!blockerId) return [];
  const { data, error } = await client.from('user_blocks').select('*').eq('blocker_id', blockerId);
  if (error) throw error;
  return data || [];
}

export async function acceptDuelInvite(inviteId, user, profile) {
  const client = requireSupabase();
  const { data: invite, error } = await client.from('duel_invites').select('*, duel_rooms(*)').eq('id', inviteId).maybeSingle();
  if (error) throw error;
  if (!invite) throw new Error('Nie znaleziono zaproszenia.');
  if (invite.to_user_id !== user.id) throw new Error('To nie jest Twoje zaproszenie.');
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    await client.from('duel_invites').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', inviteId);
    throw new Error('Zaproszenie wygaslo.');
  }
  if (invite.duel_rooms?.status !== 'lobby') throw new Error('Pojedynek juz wystartowal.');
  const player = await joinDuelRoom({ roomId: invite.room_id, user, profile });
  const { error: updateError } = await client.from('duel_invites').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', inviteId);
  if (updateError) throw updateError;
  return { invite, player, room: invite.duel_rooms };
}

export async function declineDuelInvite(inviteId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('duel_invites')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', inviteId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export function subscribeInvites(userId, callback) {
  if (!supabase || !userId) return () => {};
  const channel = supabase
    .channel(`duel-invites-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'duel_invites', filter: `to_user_id=eq.${userId}` }, (payload) => callback(payload.new || payload.old, payload))
    .subscribe();
  return () => supabase.removeChannel(channel);
}
