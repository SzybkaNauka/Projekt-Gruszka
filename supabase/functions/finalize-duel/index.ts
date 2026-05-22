import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type DuelPlayer = {
  user_id: string;
  team: 'A' | 'B';
  score: number | null;
  progress_percent: number | null;
  time_ms: number | null;
  finished: boolean | null;
  failed: boolean | null;
  status: string | null;
  premium_star_collected: boolean | null;
  hits_dealt: number | null;
  hits_received: number | null;
  powerups_used: number | null;
  traps_placed: number | null;
  shields_used: number | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function scoreFor(player: DuelPlayer) {
  return Number(player.score || 0)
    + (player.finished ? 1500 : 0)
    + (player.premium_star_collected ? 900 : 0)
    + Number(player.hits_dealt || 0) * 120
    + Number(player.shields_used || 0) * 80;
}

function teamScores(players: DuelPlayer[]) {
  return players.reduce((scores, player) => {
    scores[player.team] += scoreFor(player);
    return scores;
  }, { A: 0, B: 0 });
}

function pickMvp(players: DuelPlayer[]) {
  return [...players].sort((a, b) => scoreFor(b) - scoreFor(a))[0] || null;
}

function resultFor(player: DuelPlayer, winnerTeam: 'A' | 'B' | null) {
  if (!winnerTeam) return 'draw';
  return player.team === winnerTeam ? 'win' : 'loss';
}

function ratingDelta(result: string, isMvp: boolean) {
  const base = result === 'win' ? 25 : result === 'loss' ? -15 : 3;
  return base + (isMvp ? 5 : 0);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500);
  }

  const authHeader = req.headers.get('Authorization') || '';
  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await service.auth.getUser(token);
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);

  const { roomId } = await req.json().catch(() => ({ roomId: null }));
  if (!roomId) return json({ error: 'roomId is required' }, 400);

  const { data: room, error: roomError } = await service.from('duel_rooms').select('*').eq('id', roomId).maybeSingle();
  if (roomError) return json({ error: roomError.message }, 500);
  if (!room) return json({ error: 'Room not found' }, 404);

  const { data: membership } = await service
    .from('duel_players')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!membership && room.host_user_id !== userData.user.id) return json({ error: 'Forbidden' }, 403);

  const { data: existing } = await service.from('duel_results').select('*, duel_player_results(*)').eq('room_id', roomId).maybeSingle();
  if (existing) return json({ result: existing, source: 'existing' });

  if (!['running', 'countdown', 'finished'].includes(room.status)) {
    return json({ error: 'Room is not finalizable' }, 409);
  }

  const { data: players, error: playersError } = await service
    .from('duel_players')
    .select('*')
    .eq('room_id', roomId)
    .neq('status', 'left');
  if (playersError) return json({ error: playersError.message }, 500);
  const activePlayers = (players || []) as DuelPlayer[];
  if (!activePlayers.length) return json({ error: 'No players' }, 409);

  const allDone = activePlayers.every((player) => player.finished || player.failed || player.status === 'left');
  const startedAt = room.start_at ? new Date(room.start_at).getTime() : Date.now();
  const maxTimeMs = Number(room.max_time_ms || 8 * 60 * 1000);
  const timedOut = Date.now() - startedAt > maxTimeMs;
  if (!allDone && !timedOut && room.status !== 'finished') {
    return json({ error: 'Duel still running' }, 409);
  }

  const scores = teamScores(activePlayers);
  const winnerTeam = scores.A === scores.B ? null : scores.A > scores.B ? 'A' : 'B';
  const mvp = pickMvp(activePlayers);
  const resultPayload = {
    room_id: roomId,
    mode: room.mode,
    level_id: room.level_id,
    winner_team: winnerTeam,
    team_a_score: scores.A,
    team_b_score: scores.B,
    mvp_user_id: mvp?.user_id || null,
    finished_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await service.from('duel_results').insert(resultPayload).select('*').single();
  if (insertError) {
    if (insertError.code === '23505') {
      const { data: duplicate } = await service.from('duel_results').select('*, duel_player_results(*)').eq('room_id', roomId).maybeSingle();
      return json({ result: duplicate, source: 'duplicate' });
    }
    return json({ error: insertError.message }, 500);
  }

  const rankedPlayers = [...activePlayers].sort((a, b) => {
    if (Number(b.progress_percent || 0) !== Number(a.progress_percent || 0)) {
      return Number(b.progress_percent || 0) - Number(a.progress_percent || 0);
    }
    return scoreFor(b) - scoreFor(a);
  });

  const playerRows = rankedPlayers.map((player, index) => ({
    result_id: inserted.id,
    room_id: roomId,
    user_id: player.user_id,
    team: player.team,
    placement: index + 1,
    score: Number(player.score || 0),
    progress_percent: Number(player.progress_percent || 0),
    time_ms: player.time_ms,
    finished: Boolean(player.finished),
    failed: Boolean(player.failed || timedOut),
    premium_star_collected: Boolean(player.premium_star_collected),
    hits_dealt: Number(player.hits_dealt || 0),
    hits_received: Number(player.hits_received || 0),
    powerups_used: Number(player.powerups_used || 0),
    traps_placed: Number(player.traps_placed || 0),
    shields_used: Number(player.shields_used || 0),
    is_mvp: player.user_id === mvp?.user_id,
  }));

  if (playerRows.length) {
    await service.from('duel_player_results').upsert(playerRows, { onConflict: 'room_id,user_id' });
  }

  const { data: season } = await service
    .from('duel_seasons')
    .select('*')
    .eq('active', true)
    .lte('starts_at', new Date().toISOString())
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const unlockedAchievements: Array<{ user_id: string; achievement_key: string }> = [];
  for (const player of activePlayers) {
    const outcome = resultFor(player, winnerTeam);
    const isMvp = player.user_id === mvp?.user_id;
    const { data: stat } = await service.from('duel_stats').select('*').eq('user_id', player.user_id).maybeSingle();
    const nextStats = {
      user_id: player.user_id,
      duel_matches: Number(stat?.duel_matches || 0) + 1,
      duel_wins: Number(stat?.duel_wins || 0) + (outcome === 'win' ? 1 : 0),
      duel_losses: Number(stat?.duel_losses || 0) + (outcome === 'loss' ? 1 : 0),
      duel_draws: Number(stat?.duel_draws || 0) + (outcome === 'draw' ? 1 : 0),
      duel_mvp_count: Number(stat?.duel_mvp_count || 0) + (isMvp ? 1 : 0),
      updated_at: new Date().toISOString(),
    };
    await service.from('duel_stats').upsert(nextStats, { onConflict: 'user_id' });

    if (outcome === 'win' && nextStats.duel_wins === 1) unlockedAchievements.push({ user_id: player.user_id, achievement_key: 'first_blood' });
    if (outcome === 'win' && room.mode === '1v1' && nextStats.duel_wins >= 10) unlockedAchievements.push({ user_id: player.user_id, achievement_key: 'master_1v1' });
    if (isMvp && nextStats.duel_mvp_count >= 5) unlockedAchievements.push({ user_id: player.user_id, achievement_key: 'mvp_pear' });

    if (season) {
      const { data: rating } = await service
        .from('duel_ratings')
        .select('*')
        .eq('user_id', player.user_id)
        .eq('season_id', season.id)
        .maybeSingle();
      const before = Number(rating?.rating || 1000);
      const delta = ratingDelta(outcome, isMvp);
      const after = Math.max(100, before + delta);
      await service.from('duel_ratings').upsert({
        user_id: player.user_id,
        season_id: season.id,
        rating: after,
        wins: Number(rating?.wins || 0) + (outcome === 'win' ? 1 : 0),
        losses: Number(rating?.losses || 0) + (outcome === 'loss' ? 1 : 0),
        draws: Number(rating?.draws || 0) + (outcome === 'draw' ? 1 : 0),
        matches: Number(rating?.matches || 0) + 1,
        mvp_count: Number(rating?.mvp_count || 0) + (isMvp ? 1 : 0),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,season_id' });
      await service.from('duel_rating_history').insert({
        user_id: player.user_id,
        season_id: season.id,
        room_id: roomId,
        rating_before: before,
        rating_after: after,
        delta,
        result: outcome,
      });
    }
  }

  if (unlockedAchievements.length) {
    await service.from('duel_achievements').upsert(
      unlockedAchievements.map((achievement) => ({ ...achievement, metadata: { roomId } })),
      { onConflict: 'user_id,achievement_key' },
    );
  }

  await service.from('duel_rooms').update({
    status: 'finished',
    finished_at: new Date().toISOString(),
    winner_team: winnerTeam,
    updated_at: new Date().toISOString(),
  }).eq('id', roomId);

  const { data: finalResult } = await service.from('duel_results').select('*, duel_player_results(*)').eq('room_id', roomId).maybeSingle();
  return json({ result: finalResult || inserted, unlockedAchievements, source: 'edge' });
});
