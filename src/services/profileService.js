import { requireSupabase } from '../lib/supabase.js';

const avatarIds = ['knight', 'winged', 'super', 'pirate', 'racer', 'gladiator', 'stunt', 'rocket', 'ninja', 'royal'];

function cleanUsername(username) {
  return String(username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
}

function validateUsernameRules(username) {
  const value = String(username || '');
  const norm = value.trim().toLowerCase();
  if (norm.length < 3 || norm.length > 20) return { ok: false, message: 'Nick musi miec 3-20 znakow.' };
  if (!/^[a-z0-9_]+$/.test(norm)) return { ok: false, message: 'Nick moze zawierac tylko litery, cyfry i znak _.' };
  if (norm.includes('@') || /\S+@\S+\.\S+/.test(value)) return { ok: false, message: 'Nick nie moze byc adresem email.' };
  return { ok: true, username: norm };
}
export { validateUsernameRules };

export async function checkUsernameAvailable(username) {
  const client = requireSupabase();
  try {
    const norm = String(username || '').trim().toLowerCase();
    if (!norm) return false;
    const { data, error } = await client.from('profiles').select('id').eq('username', norm).maybeSingle();
    if (error) return false;
    return !data;
  } catch {
    return false;
  }
}

export async function getProfile(userId) {
  const client = requireSupabase();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

function isUniqueError(error) {
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return msg.includes('duplicate') || msg.includes('unique');
}

export async function ensureProfile(user, profile = {}) {
  const client = requireSupabase();
  const metadata = user.user_metadata || {};
  const fallbackUsername = `pear_${user.id.slice(0, 8)}`;
  const suggested = profile.username || metadata.username || user.email?.split('@')[0] || fallbackUsername;
  let username = cleanUsername(suggested);
  if (username.length < 3) username = fallbackUsername;
  username = username.slice(0, 20);
  const payload = {
    id: user.id,
    username,
    display_name: profile.display_name || metadata.display_name || username,
    avatar_pear: avatarIds.includes(profile.avatar_pear || metadata.avatar_pear) ? (profile.avatar_pear || metadata.avatar_pear) : 'knight',
    best_level: 1,
  };
  try {
    const { data, error } = await client.from('profiles').upsert(payload, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    await client.from('player_stats').upsert({ user_id: user.id }, { onConflict: 'user_id' });
    return data;
  } catch (err) {
    if (isUniqueError(err)) {
      const fallbackPayload = {
        ...payload,
        username: fallbackUsername,
        display_name: profile.display_name || metadata.display_name || fallbackUsername,
      };
      const { data, error } = await client.from('profiles').upsert(fallbackPayload, { onConflict: 'id' }).select('*').single();
      if (error) {
        const e = new Error('Ten nick jest juz zajety. Wybierz inny.');
        e.code = 'username_taken';
        throw e;
      }
      await client.from('player_stats').upsert({ user_id: user.id }, { onConflict: 'user_id' });
      return data;
    }
    throw err;
  }
}

export async function updateProfile(userId, profile) {
  const client = requireSupabase();
  const payload = {
    display_name: profile.display_name || null,
    avatar_pear: avatarIds.includes(profile.avatar_pear) ? profile.avatar_pear : 'knight',
    updated_at: new Date().toISOString(),
  };
  if (profile.username) payload.username = cleanUsername(profile.username);
  try {
    const { data, error } = await client.from('profiles').update(payload).eq('id', userId).select('*').single();
    if (error) throw error;
    return data;
  } catch (err) {
    if (isUniqueError(err)) {
      const e = new Error('Ten nick jest juz zajety. Wybierz inny.');
      e.code = 'username_taken';
      throw e;
    }
    throw err;
  }
}

export async function getPlayerStats(userId) {
  const client = requireSupabase();
  const { data, error } = await client.from('player_stats').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
