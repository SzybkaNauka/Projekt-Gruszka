import { getSave, saveLevelResult } from '../game/storage.js';
import { MAX_LEVEL } from '../game/constants.js';
import { requireSupabase, supabase } from '../lib/supabase.js';
import { isOnline } from './networkService.js';

const PENDING_KEY = 'gruszka-katapulta-pending-scores-v1';
const SCORE_PROFILE_FIELDS = '*, profiles(username, display_name, avatar_pear, total_score, best_level)';

export function normalizeScoreResult(result) {
  return {
    level_id: Number(result.level_id || result.level || 0),
    score: Number(result.score || result.totalScore || 0),
    stars: Number(result.stars || 0),
    time_ms: result.time_ms == null ? null : Number(result.time_ms),
    combo_max: result.combo_max == null ? Number(result.bestCombo || 0) : Number(result.combo_max),
    perfect_run: Boolean(result.perfect_run || result.stars === 3),
    vehicle_used: result.vehicle_used || result.vehicle || null,
    pear_theme: result.pear_theme || result.pearTheme || null,
  };
}

export function validateScore(result) {
  const score = normalizeScoreResult(result);
  if (score.level_id < 1 || score.level_id > MAX_LEVEL) return { ok: false, reason: 'Invalid level_id' };
  if (score.score <= 0 || score.score > 999999999) return { ok: false, reason: 'Invalid score' };
  if (score.stars < 0 || score.stars > 3) return { ok: false, reason: 'Invalid stars' };
  if (score.time_ms != null && score.time_ms < 0) return { ok: false, reason: 'Invalid time_ms' };
  return { ok: true, score };
}

export const validateScoreResult = validateScore;

export function saveLocalScore(result) {
  const score = normalizeScoreResult(result);
  return saveLevelResult(score.level_id, score.score, score.stars);
}

function getPendingScores() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return [];
  }
}

function setPendingScores(scores) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(scores.slice(-50)));
}

export function queuePendingScore(result) {
  const validation = validateScore(result);
  if (!validation.ok) return { queued: false, reason: validation.reason };
  const queue = getPendingScores();
  queue.push({ ...validation.score, queued_at: new Date().toISOString() });
  setPendingScores(queue);
  return { queued: true };
}

export async function submitOnlineScore(result, userId) {
  if (!supabase || !isOnline()) return queuePendingScore(result);
  const validation = validateScore(result);
  if (!validation.ok) throw new Error(validation.reason);
  const client = requireSupabase();
  const payload = { ...validation.score, user_id: userId };
  const { error } = await client.from('level_scores').insert(payload);
  if (error) throw error;
  await submitBestScore(validation.score, userId);
  return { submitted: true };
}

export async function submitBestScore(result, userId) {
  const validation = validateScore(result);
  if (!validation.ok) throw new Error(validation.reason);
  const client = requireSupabase();
  const score = validation.score;
  const { data: current, error: readError } = await client
    .from('best_level_scores')
    .select('score')
    .eq('user_id', userId)
    .eq('level_id', score.level_id)
    .maybeSingle();
  if (readError) throw readError;
  if (current && current.score >= score.score) return { updated: false };
  const { error } = await client.from('best_level_scores').upsert({ ...score, user_id: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
  await updateOnlineStats(score, userId);
  return { updated: true };
}

async function updateOnlineStats(score, userId) {
  const client = requireSupabase();
  const save = getSave();
  await client.from('profiles').update({
    total_score: save.bestScore,
    best_level: save.unlockedLevel,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
  await client.from('player_stats').upsert({
    user_id: userId,
    total_runs: 1,
    total_wins: 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function flushPendingScores(userId) {
  if (!supabase || !isOnline() || !userId) return { flushed: 0 };
  const queue = getPendingScores();
  const remaining = [];
  let flushed = 0;
  for (const item of queue) {
    try {
      await submitOnlineScore(item, userId);
      flushed += 1;
    } catch {
      remaining.push(item);
    }
  }
  setPendingScores(remaining);
  return { flushed };
}

function applyLevelFilters(query, levelId = 'all', worldRange = 'all') {
  if (levelId !== 'all') return query.eq('level_id', Number(levelId));
  if (worldRange !== 'all') {
    const [min, max] = String(worldRange).split('-').map(Number);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return query.gte('level_id', min).lte('level_id', max);
    }
  }
  return query;
}

function createTimeCutoff(range) {
  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  if (range === 'week') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 7);
    return start.toISOString();
  }
  return null;
}

function aggregateBestRows(rows = []) {
  const bestMap = new Map();
  rows.forEach((row) => {
    const key = `${row.user_id || 'anon'}-${row.level_id}`;
    const current = bestMap.get(key);
    if (!current || Number(row.score || 0) > Number(current.score || 0)) {
      bestMap.set(key, row);
    }
  });
  return Array.from(bestMap.values()).sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

export async function getGlobalLeaderboard(levelId = 'all', worldRange = 'all', timeRange = 'all') {
  const client = requireSupabase();
  if (timeRange === 'all') {
    let query = client.from('best_level_scores').select(SCORE_PROFILE_FIELDS).order('score', { ascending: false }).limit(50);
    query = applyLevelFilters(query, levelId, worldRange);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  let query = client.from('level_scores').select(SCORE_PROFILE_FIELDS).order('score', { ascending: false }).limit(150);
  query = applyLevelFilters(query, levelId, worldRange);
  const cutoff = createTimeCutoff(timeRange);
  if (cutoff) query = query.gte('created_at', cutoff);
  const { data, error } = await query;
  if (error) throw error;
  return aggregateBestRows(data || []).slice(0, 50);
}

export async function getFriendsLeaderboard(levelId = 'all', userId, worldRange = 'all', timeRange = 'all') {
  const client = requireSupabase();
  const { data: friendships, error } = await client
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  const ids = new Set([userId]);
  friendships?.forEach((friendship) => ids.add(friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id));

  if (timeRange === 'all') {
    let query = client.from('best_level_scores').select(SCORE_PROFILE_FIELDS).in('user_id', [...ids]).order('score', { ascending: false }).limit(50);
    query = applyLevelFilters(query, levelId, worldRange);
    const { data, error: scoresError } = await query;
    if (scoresError) throw scoresError;
    return data || [];
  }

  let query = client.from('level_scores').select(SCORE_PROFILE_FIELDS).in('user_id', [...ids]).order('score', { ascending: false }).limit(150);
  query = applyLevelFilters(query, levelId, worldRange);
  const cutoff = createTimeCutoff(timeRange);
  if (cutoff) query = query.gte('created_at', cutoff);
  const { data, error: scoresError } = await query;
  if (scoresError) throw scoresError;
  return aggregateBestRows(data || []).slice(0, 50);
}

export async function getUserBestScores(userId, levelId = 'all', worldRange = 'all') {
  const client = requireSupabase();
  let query = client.from('best_level_scores').select('*, updated_at, created_at').eq('user_id', userId).order('level_id');
  query = applyLevelFilters(query, levelId, worldRange);
  const { data, error } = await query;
  if (error) throw error;
  if (levelId !== 'all') return data || [];
  const byLevel = new Map((data || []).map((row) => [row.level_id, row]));
  const [min, max] = worldRange === 'all' ? [1, MAX_LEVEL] : String(worldRange).split('-').map(Number);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return data || [];
  return Array.from({ length: max - min + 1 }, (_, index) => {
    const level = min + index;
    return byLevel.get(level) || {
      user_id: userId,
      level_id: level,
      score: 0,
      stars: 0,
      combo_max: 0,
      perfect_run: false,
      created_at: null,
      updated_at: null,
    };
  });
}

// TODO: Move score validation to a Supabase Edge Function if the leaderboard becomes competitive.
