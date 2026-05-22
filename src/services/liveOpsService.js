import { levels } from '../game/levels.js';
import { requireSupabase } from '../lib/supabase.js';

export const DAILY_MODIFIERS = {
  turbo_day: { key: 'turbo_day', name: 'Turbo dzien', description: 'Pojazdy jada szybciej, punkty rosna za odwage.' },
  one_chance: { key: 'one_chance', name: 'Jedna szansa', description: 'Wiekszy bonus za czysty przejazd.' },
  premium_star_hunt: { key: 'premium_star_hunt', name: 'Premium Star Hunt', description: 'Zlota gwiazda daje podwojny prestiz.' },
  combo_day: { key: 'combo_day', name: 'Combo Day', description: 'Combo ma wieksza wage w wyniku.' },
  rocket_chaos: { key: 'rocket_chaos', name: 'Rakietowy Chaos', description: 'Szybkie odcinki i wiecej ryzyka.' },
  golden_route: { key: 'golden_route', name: 'Zlota trasa', description: 'Wiecej monet, wiecej pokus.' },
};

export const GLOBAL_ACHIEVEMENTS = {
  first_finish: { key: 'first_finish', name: 'Pierwszy dojazd', description: 'Ukoncz pierwszy poziom.' },
  first_premium_star: { key: 'first_premium_star', name: 'Lowca Zlotej Gwiazdy', description: 'Zbierz pierwsza Premium Star.' },
  first_daily: { key: 'first_daily', name: 'Codzienny Pretendent', description: 'Ukoncz Daily Challenge.' },
  first_shop_purchase: { key: 'first_shop_purchase', name: 'Stylowa Gruszka', description: 'Kup pierwszy kosmetyk za Pestki.' },
};

const PVP_WEEKLY_LEVELS = [1, 5, 10, 20, 30];

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hashText(text) {
  return [...String(text)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function deterministicDaily(date = isoDate()) {
  const keys = Object.keys(DAILY_MODIFIERS);
  const seed = `daily-${date}`;
  const hash = hashText(seed);
  return {
    challenge_date: date,
    level_id: (hash % 50) + 1,
    seed,
    modifier_key: keys[hash % keys.length],
  };
}

function weekStart(date = new Date()) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return isoDate(copy);
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

export async function getTodayChallenge() {
  const client = requireSupabase();
  const fallback = deterministicDaily();
  const { data } = await client.from('daily_challenges').select('*').eq('challenge_date', fallback.challenge_date).maybeSingle();
  if (data) return { ...data, modifier: DAILY_MODIFIERS[data.modifier_key], level: levels[data.level_id - 1] };
  const { data: inserted } = await client.from('daily_challenges').insert(fallback).select('*').single();
  const challenge = inserted || fallback;
  return { ...challenge, modifier: DAILY_MODIFIERS[challenge.modifier_key], level: levels[challenge.level_id - 1] };
}

export async function getDailyLeaderboard(challengeId, limit = 20) {
  const client = requireSupabase();
  const { data, error } = await client.from('daily_challenge_scores').select('*').eq('challenge_id', challengeId).order('score', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function submitDailyScore(challengeId, user, profile, result) {
  const client = requireSupabase();
  const { data, error } = await client.from('daily_challenge_scores').insert({
    challenge_id: challengeId,
    user_id: user.id,
    username: profile?.username || 'player',
    score: Number(result.score || result.totalScore || 0),
    stars: Number(result.stars || 0),
    premium_star_collected: Boolean(result.premiumStarCollected),
    time_ms: result.timeMs || null,
  }).select('*').single();
  if (error) throw error;
  await grantSeeds(user.id, 100, 'daily_challenge', { challengeId }).catch(() => {});
  await grantXp(user.id, 120, 'daily_challenge').catch(() => {});
  await unlockGlobalAchievement(user.id, 'first_daily', { challengeId }).catch(() => {});
  return data;
}

export async function getActiveWeeklyTournament() {
  const client = requireSupabase();
  const start = weekStart();
  const { data } = await client.from('weekly_tournaments').select('*').eq('week_start', start).maybeSingle();
  if (data) return data;
  const payload = {
    week_start: start,
    week_end: addDays(start, 6),
    name: `Turniej tygodnia ${start}`,
    level_ids: PVP_WEEKLY_LEVELS,
    active: true,
  };
  const { data: inserted } = await client.from('weekly_tournaments').insert(payload).select('*').single();
  return inserted || payload;
}

export async function getWeeklyLeaderboard(tournamentId, limit = 20) {
  const client = requireSupabase();
  const { data, error } = await client.from('weekly_tournament_scores').select('*').eq('tournament_id', tournamentId).order('total_score', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getWallet(userId) {
  const client = requireSupabase();
  const { data } = await client.from('player_wallets').select('*').eq('user_id', userId).maybeSingle();
  if (data) return data;
  const { data: inserted, error } = await client.from('player_wallets').insert({ user_id: userId, seeds: 0 }).select('*').single();
  if (error) throw error;
  return inserted;
}

export async function grantSeeds(userId, amount, reason, metadata = {}) {
  const client = requireSupabase();
  const wallet = await getWallet(userId);
  const nextSeeds = Math.max(0, Number(wallet.seeds || 0) + Number(amount || 0));
  const { data, error } = await client.from('player_wallets').update({ seeds: nextSeeds, updated_at: new Date().toISOString() }).eq('user_id', userId).select('*').single();
  if (error) throw error;
  await client.from('wallet_transactions').insert({ user_id: userId, amount, currency: 'seeds', reason, metadata }).catch(() => {});
  return data;
}

export async function getPlayerXp(userId) {
  const client = requireSupabase();
  const { data: season } = await client.from('duel_seasons').select('*').eq('active', true).limit(1).maybeSingle();
  const { data } = await client.from('player_xp').select('*').eq('user_id', userId).maybeSingle();
  if (data) return data;
  const { data: inserted, error } = await client.from('player_xp').insert({ user_id: userId, season_id: season?.id || null }).select('*').single();
  if (error) throw error;
  return inserted;
}

export async function grantXp(userId, amount, reason = 'play') {
  const client = requireSupabase();
  const xp = await getPlayerXp(userId);
  const nextXp = Number(xp.xp || 0) + Number(amount || 0);
  const nextLevel = Math.min(50, Math.floor(nextXp / 250) + 1);
  const { data, error } = await client.from('player_xp').update({ xp: nextXp, level: nextLevel, updated_at: new Date().toISOString() }).eq('user_id', userId).select('*').single();
  if (error) throw error;
  return { ...data, reason };
}

export async function getSeasonRewards() {
  const client = requireSupabase();
  const { data, error } = await client.from('season_rewards').select('*').order('level');
  if (error) throw error;
  return data || Array.from({ length: 10 }, (_, index) => ({
    level: index + 1,
    reward_type: index % 3 === 0 ? 'cosmetic' : 'seeds',
    reward_key: index % 3 === 0 ? 'trail_leaf_spark' : `${50 + index * 10}`,
    free: true,
  }));
}

export async function getCosmeticsState(userId) {
  const client = requireSupabase();
  const [{ data: cosmetics }, { data: owned }, { data: loadout }] = await Promise.all([
    client.from('cosmetics').select('*').order('rarity'),
    client.from('player_cosmetics').select('*').eq('user_id', userId),
    client.from('player_loadout').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  return { cosmetics: cosmetics || [], owned: owned || [], loadout };
}

export async function equipCosmetic(userId, cosmetic) {
  const client = requireSupabase();
  const fieldByType = {
    pear_skin: 'pear_skin',
    vehicle_skin: 'vehicle_skin',
    trail: 'trail',
    victory_animation: 'victory_animation',
    profile_frame: 'profile_frame',
    duel_emote: 'duel_emote',
  };
  const field = fieldByType[cosmetic.type];
  if (!field) return null;
  const { data, error } = await client.from('player_loadout').upsert({ user_id: userId, [field]: cosmetic.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function getShopItems() {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const { data, error } = await client.from('shop_items').select('*, cosmetics(*)').eq('active', true).lte('starts_at', now).gte('ends_at', now).order('price_seeds');
  if (error) throw error;
  return data || [];
}

export async function buyShopItem(userId, item) {
  const wallet = await getWallet(userId);
  if (Number(wallet.seeds || 0) < Number(item.price_seeds || 0)) throw new Error('Za malo pestek.');
  const client = requireSupabase();
  await grantSeeds(userId, -Number(item.price_seeds || 0), 'shop_purchase', { itemId: item.id, cosmeticId: item.cosmetic_id });
  const { data, error } = await client.from('player_cosmetics').upsert({ user_id: userId, cosmetic_id: item.cosmetic_id, source: 'shop' }, { onConflict: 'user_id,cosmetic_id' }).select('*').single();
  if (error) throw error;
  await unlockGlobalAchievement(userId, 'first_shop_purchase', { cosmeticId: item.cosmetic_id }).catch(() => {});
  return data;
}

export async function claimDailyStreak(userId) {
  const client = requireSupabase();
  const today = isoDate();
  const { data: current } = await client.from('player_streaks').select('*').eq('user_id', userId).maybeSingle();
  if (current?.last_login_date === today) return { ...current, alreadyClaimed: true, reward: 0 };
  const yesterday = addDays(today, -1);
  const nextStreak = current?.last_login_date === yesterday ? Number(current.current_streak || 0) + 1 : 1;
  const rewardTable = [0, 20, 30, 50, 70, 100, 150, 250];
  const reward = rewardTable[Math.min(7, nextStreak)] || 50;
  const payload = {
    user_id: userId,
    current_streak: nextStreak,
    best_streak: Math.max(Number(current?.best_streak || 0), nextStreak),
    last_login_date: today,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client.from('player_streaks').upsert(payload, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  await grantSeeds(userId, reward, 'daily_streak', { streak: nextStreak }).catch(() => {});
  return { ...data, reward };
}

export async function unlockGlobalAchievement(userId, achievementKey, metadata = {}) {
  const client = requireSupabase();
  const achievement = GLOBAL_ACHIEVEMENTS[achievementKey] || { key: achievementKey };
  const { data, error } = await client.from('global_achievements').upsert({
    user_id: userId,
    achievement_key: achievement.key,
    metadata,
  }, { onConflict: 'user_id,achievement_key' }).select('*').single();
  if (error) throw error;
  return { ...data, achievement };
}
