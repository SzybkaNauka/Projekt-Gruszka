import { DUEL_EVENT_SEND_INTERVAL_MS, DUEL_MODES } from '../game/constants.js';
import { requireSupabase, supabase } from '../lib/supabase.js';

const ROOM_SELECT = '*, duel_players(*)';
const EVENT_BUCKET = new Map();

function modeConfig(mode = '1v1') {
  return DUEL_MODES[mode] || DUEL_MODES['1v1'];
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

export async function joinDuelRoom({ roomId, code, user, profile, preferredTeam }) {
  const client = requireSupabase();
  let roomIdToJoin = roomId;
  if (!roomIdToJoin && code) {
    const { data, error } = await client.from('duel_rooms').select('*').eq('code', String(code).trim().toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Nie znaleziono pokoju DUEL.');
    roomIdToJoin = data.id;
  }
  const index = await countPlayers(roomIdToJoin);
  const playerProfile = normalizeProfile(user, profile);
  const payload = {
    room_id: roomIdToJoin,
    user_id: user.id,
    ...playerProfile,
    team: preferredTeam || teamForIndex(index),
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
  const client = requireSupabase();
  const startAt = new Date(Date.now() + 3500).toISOString();
  const { data, error } = await client
    .from('duel_rooms')
    .update({ status: 'countdown', start_at: startAt, updated_at: new Date().toISOString() })
    .eq('id', roomId)
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
  const { data, error } = await client
    .from('profiles')
    .select('id, username, display_name, avatar_pear, last_seen_at, duel_status, allow_random_invites')
    .eq('allow_random_invites', true)
    .order('last_seen_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function inviteUserToDuel(roomId, fromUserId, toUserId) {
  const client = requireSupabase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from('duel_invites')
    .upsert({ room_id: roomId, from_user_id: fromUserId, to_user_id: toUserId, status: 'pending', expires_at: expiresAt }, { onConflict: 'room_id,from_user_id,to_user_id' })
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
