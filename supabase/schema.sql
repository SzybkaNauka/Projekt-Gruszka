create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_pear text default 'knight',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  total_score bigint default 0,
  best_level integer default 1,
  country text null
);

create table if not exists public.level_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  level_id integer not null,
  score integer not null,
  stars integer not null default 0,
  time_ms integer null,
  combo_max integer null,
  perfect_run boolean default false,
  premium_star_collected boolean default false,
  vehicle_used text null,
  pear_theme text null,
  created_at timestamptz default now()
);

create index if not exists level_scores_user_id_idx on public.level_scores(user_id);
create index if not exists level_scores_level_id_idx on public.level_scores(level_id);
create index if not exists level_scores_score_desc_idx on public.level_scores(score desc);
create index if not exists level_scores_created_at_desc_idx on public.level_scores(created_at desc);

create table if not exists public.best_level_scores (
  user_id uuid references auth.users(id) on delete cascade,
  level_id integer not null,
  score integer not null,
  stars integer not null default 0,
  time_ms integer null,
  combo_max integer null,
  perfect_run boolean default false,
  premium_star_collected boolean default false,
  vehicle_used text null,
  pear_theme text null,
  updated_at timestamptz default now(),
  primary key (user_id, level_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete cascade,
  addressee_id uuid references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint friendships_not_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique(requester_id, addressee_id)
);

create table if not exists public.player_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_runs integer default 0,
  total_wins integer default 0,
  total_crashes integer default 0,
  total_perfect_landings integer default 0,
  total_near_misses integer default 0,
  total_coins_collected integer default 0,
  total_distance integer default 0,
  updated_at timestamptz default now()
);

create table if not exists public.user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  terms_version text,
  privacy_version text,
  community_version text,
  analytics_consent boolean default false,
  marketing_consent boolean default false,
  accepted_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.support_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  guest_id text null,
  type text,
  subject text,
  message text,
  contact_email text null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

do $$
begin
  alter table public.profiles add column if not exists allow_random_invites boolean default true;
  alter table public.profiles add column if not exists allow_duel_invites_from text default 'everyone';
  alter table public.profiles add column if not exists last_seen_at timestamptz default now();
  alter table public.profiles add column if not exists duel_status text default 'available';
end $$;

do $$
begin
  alter table public.profiles add constraint profiles_duel_invites_from_check check (allow_duel_invites_from in ('everyone','friends','none')) not valid;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.duel_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_user_id uuid references auth.users(id) on delete cascade,
  mode text not null check (mode in ('1v1','2v2','3v3','4v4','5v5')),
  status text not null default 'lobby' check (status in ('lobby','countdown','running','finished','cancelled')),
  level_id integer not null default 1 check (level_id between 1 and 50),
  visibility text not null default 'public' check (visibility in ('public','friends','private')),
  max_players integer not null default 2,
  team_size integer not null default 1,
  start_at timestamptz null,
  finished_at timestamptz null,
  winner_team text null check (winner_team in ('A','B') or winner_team is null),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists duel_rooms_code_idx on public.duel_rooms(code);
create index if not exists duel_rooms_status_idx on public.duel_rooms(status);

create table if not exists public.duel_players (
  room_id uuid references public.duel_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  username text not null,
  display_name text,
  avatar_pear text default 'knight',
  team text not null check (team in ('A','B')),
  ready boolean default false,
  connected boolean default true,
  status text not null default 'lobby' check (status in ('lobby','loading','running','finished','failed','left')),
  score integer default 0,
  progress_percent numeric default 0,
  x numeric default 0,
  y numeric default 0,
  velocity_x numeric default 0,
  velocity_y numeric default 0,
  current_vehicle text null,
  held_powerup text null,
  last_powerup_used_at timestamptz null,
  last_hit_at timestamptz null,
  alive boolean default true,
  finished boolean default false,
  failed boolean default false,
  time_ms integer null,
  premium_star_collected boolean default false,
  hits_dealt integer default 0,
  hits_received integer default 0,
  powerups_used integer default 0,
  traps_placed integer default 0,
  shields_used integer default 0,
  last_snapshot_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (room_id, user_id)
);

create index if not exists duel_players_room_idx on public.duel_players(room_id);
create index if not exists duel_players_user_idx on public.duel_players(user_id);

create table if not exists public.duel_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.duel_rooms(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  target_team text null check (target_team in ('A','B') or target_team is null),
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

create index if not exists duel_events_room_created_idx on public.duel_events(room_id, created_at desc);

create table if not exists public.duel_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.duel_rooms(id) on delete cascade,
  from_user_id uuid references auth.users(id) on delete cascade,
  to_user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired','cancelled')),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint duel_invites_not_self check (from_user_id <> to_user_id),
  constraint duel_invites_unique_pair unique(room_id, from_user_id, to_user_id)
);

create index if not exists duel_invites_to_user_idx on public.duel_invites(to_user_id, status);

create table if not exists public.duel_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.duel_rooms(id) on delete cascade,
  mode text not null,
  level_id integer not null,
  winner_team text null check (winner_team in ('A','B') or winner_team is null),
  team_a_score integer default 0,
  team_b_score integer default 0,
  mvp_user_id uuid references auth.users(id) on delete set null,
  finished_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint duel_results_room_id_unique unique(room_id)
);

create table if not exists public.duel_player_results (
  id uuid primary key default gen_random_uuid(),
  result_id uuid references public.duel_results(id) on delete cascade,
  room_id uuid references public.duel_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  team text not null check (team in ('A','B')),
  placement integer default 0,
  score integer default 0,
  progress_percent numeric default 0,
  time_ms integer null,
  finished boolean default false,
  failed boolean default false,
  premium_star_collected boolean default false,
  hits_dealt integer default 0,
  hits_received integer default 0,
  powerups_used integer default 0,
  traps_placed integer default 0,
  shields_used integer default 0,
  is_mvp boolean default false,
  created_at timestamptz default now(),
  constraint duel_player_results_room_user_unique unique(room_id, user_id)
);

create table if not exists public.duel_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  duel_matches integer default 0,
  duel_wins integer default 0,
  duel_losses integer default 0,
  duel_draws integer default 0,
  duel_mvp_count integer default 0,
  updated_at timestamptz default now()
);

create index if not exists duel_player_results_user_idx on public.duel_player_results(user_id, created_at desc);

create table if not exists public.duel_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.duel_ratings (
  user_id uuid references auth.users(id) on delete cascade,
  season_id uuid references public.duel_seasons(id) on delete cascade,
  rating integer default 1000,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  matches integer default 0,
  mvp_count integer default 0,
  updated_at timestamptz default now(),
  primary key(user_id, season_id)
);

create table if not exists public.duel_rating_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  season_id uuid references public.duel_seasons(id) on delete cascade,
  room_id uuid references public.duel_rooms(id) on delete cascade,
  rating_before integer default 1000,
  rating_after integer default 1000,
  delta integer default 0,
  result text check (result in ('win','loss','draw')),
  created_at timestamptz default now()
);

create table if not exists public.duel_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  metadata jsonb not null default '{}',
  constraint duel_achievements_user_key_unique unique(user_id, achievement_key)
);

create table if not exists public.user_blocks (
  blocker_id uuid references auth.users(id) on delete cascade,
  blocked_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

create index if not exists duel_ratings_rating_idx on public.duel_ratings(season_id, rating desc);
create index if not exists duel_achievements_user_idx on public.duel_achievements(user_id);

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date unique not null,
  level_id integer not null check (level_id between 1 and 50),
  seed text not null,
  modifier_key text not null,
  created_at timestamptz default now()
);

create table if not exists public.daily_challenge_scores (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.daily_challenges(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  username text not null,
  score integer not null default 0,
  stars integer not null default 0,
  premium_star_collected boolean default false,
  time_ms integer null,
  created_at timestamptz default now()
);

create table if not exists public.weekly_tournaments (
  id uuid primary key default gen_random_uuid(),
  week_start date unique not null,
  week_end date not null,
  name text not null,
  level_ids integer[] not null,
  active boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.weekly_tournament_scores (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.weekly_tournaments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  total_score integer default 0,
  completed_levels integer default 0,
  premium_stars integer default 0,
  updated_at timestamptz default now(),
  constraint weekly_tournament_scores_user_unique unique(tournament_id, user_id)
);

create table if not exists public.player_xp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  season_id uuid references public.duel_seasons(id) on delete set null,
  xp integer default 0,
  level integer default 1,
  updated_at timestamptz default now()
);

create table if not exists public.season_rewards (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.duel_seasons(id) on delete cascade,
  level integer not null,
  reward_type text not null,
  reward_key text not null,
  free boolean default true,
  premium boolean default false
);

create table if not exists public.cosmetics (
  id text primary key,
  type text not null,
  name text not null,
  rarity text not null check (rarity in ('common','rare','epic','legendary','event')),
  description text,
  preview_key text,
  created_at timestamptz default now()
);

create table if not exists public.player_cosmetics (
  user_id uuid references auth.users(id) on delete cascade,
  cosmetic_id text references public.cosmetics(id) on delete cascade,
  unlocked_at timestamptz default now(),
  source text,
  primary key(user_id, cosmetic_id)
);

create table if not exists public.player_loadout (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pear_skin text null,
  vehicle_skin text null,
  trail text null,
  victory_animation text null,
  profile_frame text null,
  duel_emote text null,
  updated_at timestamptz default now()
);

create table if not exists public.player_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seeds integer default 0,
  premium_stars_total integer default 0,
  updated_at timestamptz default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount integer not null,
  currency text not null default 'seeds',
  reason text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  cosmetic_id text references public.cosmetics(id) on delete cascade,
  price_seeds integer not null default 0,
  active boolean default true,
  starts_at timestamptz default now(),
  ends_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

create table if not exists public.playtest_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  guest_id text null,
  event_name text not null,
  level_id integer null,
  mode text null,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  guest_id text null,
  message text,
  stack text,
  source text,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.player_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer default 0,
  best_streak integer default 0,
  last_login_date date null,
  updated_at timestamptz default now()
);

create table if not exists public.global_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  metadata jsonb not null default '{}',
  constraint global_achievements_user_key_unique unique(user_id, achievement_key)
);

create index if not exists daily_challenge_scores_rank_idx on public.daily_challenge_scores(challenge_id, score desc);
create index if not exists weekly_tournament_scores_rank_idx on public.weekly_tournament_scores(tournament_id, total_score desc);
create index if not exists playtest_events_name_idx on public.playtest_events(event_name, created_at desc);

insert into public.cosmetics (id, type, name, rarity, description, preview_key)
values
  ('pear_classic_gold', 'pear_skin', 'Zlota Gruszka', 'rare', 'Kosmetyczna zlota skorka gruszki.', 'gold'),
  ('trail_leaf_spark', 'trail', 'Lisciany Trail', 'common', 'Delikatne liscie za pojazdem.', 'leaf'),
  ('vehicle_midnight', 'vehicle_skin', 'Nocna Katapulta', 'epic', 'Ciemny lakier pojazdu bez przewagi.', 'midnight'),
  ('frame_white_raven', 'profile_frame', 'White Raven Frame', 'event', 'Ramka profilu dla playtesterow.', 'wrs'),
  ('victory_confetti_pear', 'victory_animation', 'Gruszkowe Konfetti', 'rare', 'Kosmetyczna animacja zwyciestwa.', 'confetti')
on conflict (id) do nothing;

insert into public.shop_items (cosmetic_id, price_seeds, active, starts_at, ends_at)
select id, case rarity when 'common' then 150 when 'rare' then 350 when 'epic' then 700 else 1000 end, true, now() - interval '1 day', now() + interval '30 days'
from public.cosmetics
where not exists (select 1 from public.shop_items where shop_items.cosmetic_id = cosmetics.id);

insert into public.duel_seasons (name, starts_at, ends_at, active)
select 'Preseason Gruszka', now() - interval '1 day', now() + interval '90 days', true
where not exists (select 1 from public.duel_seasons where active = true);

do $$
begin
  alter table public.duel_invites drop constraint if exists duel_invites_status_check;
  alter table public.duel_invites add constraint duel_invites_status_check check (status in ('pending','accepted','declined','expired','cancelled'));
end $$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_username text;
  safe_username text;
begin
  raw_username := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'pear_' || left(new.id::text, 8)));
  safe_username := regexp_replace(raw_username, '[^a-z0-9_]', '', 'g');
  if length(safe_username) < 3 then
    safe_username := 'pear_' || left(new.id::text, 8);
  end if;
  safe_username := left(safe_username, 20);

  insert into public.profiles (id, username, display_name, avatar_pear, best_level)
  values (
    new.id,
    safe_username,
    coalesce(new.raw_user_meta_data->>'display_name', safe_username),
    coalesce(new.raw_user_meta_data->>'avatar_pear', 'knight'),
    1
  )
  on conflict (id) do nothing;

  insert into public.player_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
exception
  when unique_violation then
    insert into public.profiles (id, username, display_name, avatar_pear, best_level)
    values (
      new.id,
      'pear_' || left(new.id::text, 8),
      coalesce(new.raw_user_meta_data->>'display_name', 'pear_' || left(new.id::text, 8)),
      coalesce(new.raw_user_meta_data->>'avatar_pear', 'knight'),
      1
    )
    on conflict (id) do nothing;
    insert into public.player_stats (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

do $$
begin
  alter table public.level_scores add column if not exists premium_star_collected boolean default false;
  alter table public.best_level_scores add column if not exists premium_star_collected boolean default false;
end $$;

do $$
begin
  alter table public.profiles add constraint profiles_best_level_range check (best_level between 1 and 50) not valid;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.level_scores add constraint level_scores_level_id_range check (level_id between 1 and 50) not valid;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.best_level_scores add constraint best_level_scores_level_id_range check (level_id between 1 and 50) not valid;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.level_scores add constraint level_scores_stars_range check (stars between 0 and 3) not valid;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.best_level_scores add constraint best_level_scores_stars_range check (stars between 0 and 3) not valid;
exception
  when duplicate_object then null;
end $$;

alter table public.profiles enable row level security;
alter table public.level_scores enable row level security;
alter table public.best_level_scores enable row level security;
alter table public.friendships enable row level security;
alter table public.player_stats enable row level security;
alter table public.user_consents enable row level security;
alter table public.support_reports enable row level security;
alter table public.duel_rooms enable row level security;
alter table public.duel_players enable row level security;
alter table public.duel_events enable row level security;
alter table public.duel_invites enable row level security;
alter table public.duel_results enable row level security;
alter table public.duel_player_results enable row level security;
alter table public.duel_stats enable row level security;
alter table public.duel_seasons enable row level security;
alter table public.duel_ratings enable row level security;
alter table public.duel_rating_history enable row level security;
alter table public.duel_achievements enable row level security;
alter table public.user_blocks enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.daily_challenge_scores enable row level security;
alter table public.weekly_tournaments enable row level security;
alter table public.weekly_tournament_scores enable row level security;
alter table public.player_xp enable row level security;
alter table public.season_rewards enable row level security;
alter table public.cosmetics enable row level security;
alter table public.player_cosmetics enable row level security;
alter table public.player_loadout enable row level security;
alter table public.player_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.shop_items enable row level security;
alter table public.playtest_events enable row level security;
alter table public.client_errors enable row level security;
alter table public.player_streaks enable row level security;
alter table public.global_achievements enable row level security;

create or replace function public.is_duel_room_player(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.duel_players
    where room_id = target_room_id
      and user_id = auth.uid()
      and status <> 'left'
  );
$$;

create or replace function public.is_duel_room_player(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.duel_players
    where room_id = target_room_id
      and user_id = target_user_id
      and status <> 'left'
  );
$$;

create or replace function public.is_duel_room_host(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.duel_rooms
    where id = target_room_id
      and host_user_id = auth.uid()
  );
$$;

create or replace function public.is_duel_room_host(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.duel_rooms
    where id = target_room_id
      and host_user_id = target_user_id
  );
$$;

create or replace function public.has_duel_invite(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.duel_invites
    where room_id = target_room_id
      and (from_user_id = auth.uid() or to_user_id = auth.uid())
      and status = 'pending'
      and expires_at > now()
  );
$$;

create or replace function public.has_duel_invite(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.duel_invites
    where room_id = target_room_id
      and (from_user_id = target_user_id or to_user_id = target_user_id)
      and status = 'pending'
      and expires_at > now()
  );
$$;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "scores are public" on public.level_scores;
create policy "scores are public" on public.level_scores for select using (true);
drop policy if exists "users insert own scores" on public.level_scores;
create policy "users insert own scores" on public.level_scores for insert with check (auth.uid() = user_id);

drop policy if exists "best scores are public" on public.best_level_scores;
create policy "best scores are public" on public.best_level_scores for select using (true);
drop policy if exists "users insert own best scores" on public.best_level_scores;
create policy "users insert own best scores" on public.best_level_scores for insert with check (auth.uid() = user_id);
drop policy if exists "users update own best scores" on public.best_level_scores;
create policy "users update own best scores" on public.best_level_scores for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "friendships visible to participants" on public.friendships;
create policy "friendships visible to participants" on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "users request friendships" on public.friendships;
create policy "users request friendships" on public.friendships for insert with check (auth.uid() = requester_id and requester_id <> addressee_id);
drop policy if exists "participants update friendships" on public.friendships;
create policy "participants update friendships" on public.friendships for update using (auth.uid() = requester_id or auth.uid() = addressee_id) with check (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "participants delete friendships" on public.friendships;
create policy "participants delete friendships" on public.friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "stats are public" on public.player_stats;
create policy "stats are public" on public.player_stats for select using (true);
drop policy if exists "users insert own stats" on public.player_stats;
create policy "users insert own stats" on public.player_stats for insert with check (auth.uid() = user_id);
drop policy if exists "users update own stats" on public.player_stats;
create policy "users update own stats" on public.player_stats for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users read own consents" on public.user_consents;
create policy "users read own consents" on public.user_consents for select using (auth.uid() = user_id);
drop policy if exists "users insert own consents" on public.user_consents;
create policy "users insert own consents" on public.user_consents for insert with check (auth.uid() = user_id);
drop policy if exists "users update own consents" on public.user_consents;
create policy "users update own consents" on public.user_consents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users insert support reports" on public.support_reports;
create policy "users insert support reports" on public.support_reports for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "users read own support reports" on public.support_reports;
create policy "users read own support reports" on public.support_reports for select using (auth.uid() = user_id);

drop policy if exists "duel rooms visible to authenticated users" on public.duel_rooms;
create policy "duel rooms visible to authenticated users" on public.duel_rooms for select using (
  auth.uid() is not null and (
    visibility = 'public'
    or host_user_id = auth.uid()
    or public.is_duel_room_player(id)
    or public.has_duel_invite(id)
  )
);
drop policy if exists "users create own duel rooms" on public.duel_rooms;
create policy "users create own duel rooms" on public.duel_rooms for insert with check (auth.uid() = host_user_id);
drop policy if exists "host updates duel rooms" on public.duel_rooms;
create policy "host updates duel rooms" on public.duel_rooms for update using (auth.uid() = host_user_id) with check (auth.uid() = host_user_id);

drop policy if exists "duel players visible to room players" on public.duel_players;
create policy "duel players visible to room players" on public.duel_players for select using (
  auth.uid() is not null and (
    user_id = auth.uid()
    or public.is_duel_room_player(room_id)
    or public.is_duel_room_host(room_id)
    or public.has_duel_invite(room_id)
  )
);
drop policy if exists "users join duel as self" on public.duel_players;
create policy "users join duel as self" on public.duel_players for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.duel_rooms
    where id = room_id
      and status = 'lobby'
  )
);
drop policy if exists "users update own duel player" on public.duel_players;
create policy "users update own duel player" on public.duel_players for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "duel events visible to room players" on public.duel_events;
create policy "duel events visible to room players" on public.duel_events for select using (
  auth.uid() is not null and public.is_duel_room_player(room_id)
);
drop policy if exists "users send own duel events" on public.duel_events;
create policy "users send own duel events" on public.duel_events for insert with check (
  auth.uid() = sender_user_id
  and public.is_duel_room_player(room_id)
  and exists (
    select 1 from public.duel_rooms
    where id = room_id
      and status = 'running'
  )
);

drop policy if exists "duel invites visible to participants" on public.duel_invites;
create policy "duel invites visible to participants" on public.duel_invites for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
drop policy if exists "users send duel invites" on public.duel_invites;
create policy "users send duel invites" on public.duel_invites for insert with check (auth.uid() = from_user_id and from_user_id <> to_user_id);
drop policy if exists "participants update duel invites" on public.duel_invites;
create policy "participants update duel invites" on public.duel_invites for update using (auth.uid() = from_user_id or auth.uid() = to_user_id) with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "duel results visible to participants" on public.duel_results;
create policy "duel results visible to participants" on public.duel_results for select using (
  auth.uid() is not null and (public.is_duel_room_player(room_id) or public.is_duel_room_host(room_id))
);
drop policy if exists "room players create duel result" on public.duel_results;
create policy "room players create duel result" on public.duel_results for insert with check (
  auth.uid() is not null and public.is_duel_room_player(room_id)
);

drop policy if exists "duel player results visible to participants" on public.duel_player_results;
create policy "duel player results visible to participants" on public.duel_player_results for select using (
  auth.uid() = user_id or public.is_duel_room_player(room_id) or public.is_duel_room_host(room_id)
);
drop policy if exists "room players create duel player results" on public.duel_player_results;
create policy "room players create duel player results" on public.duel_player_results for insert with check (
  auth.uid() is not null and public.is_duel_room_player(room_id)
);
drop policy if exists "room players update duel player results" on public.duel_player_results;
create policy "room players update duel player results" on public.duel_player_results for update using (
  auth.uid() is not null and public.is_duel_room_player(room_id)
) with check (
  auth.uid() is not null and public.is_duel_room_player(room_id)
);

drop policy if exists "duel stats visible to owner" on public.duel_stats;
create policy "duel stats visible to owner" on public.duel_stats for select using (auth.uid() = user_id);
drop policy if exists "users create own duel stats" on public.duel_stats;
create policy "users create own duel stats" on public.duel_stats for insert with check (auth.uid() = user_id);
drop policy if exists "users update own duel stats" on public.duel_stats;
create policy "users update own duel stats" on public.duel_stats for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "duel seasons public" on public.duel_seasons;
create policy "duel seasons public" on public.duel_seasons for select using (true);

drop policy if exists "duel ratings public" on public.duel_ratings;
create policy "duel ratings public" on public.duel_ratings for select using (true);
drop policy if exists "users create own duel rating" on public.duel_ratings;
create policy "users create own duel rating" on public.duel_ratings for insert with check (auth.uid() = user_id);
drop policy if exists "users update own duel rating" on public.duel_ratings;
create policy "users update own duel rating" on public.duel_ratings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "duel rating history owner visible" on public.duel_rating_history;
create policy "duel rating history owner visible" on public.duel_rating_history for select using (auth.uid() = user_id);
drop policy if exists "users create own rating history" on public.duel_rating_history;
create policy "users create own rating history" on public.duel_rating_history for insert with check (auth.uid() = user_id);

drop policy if exists "duel achievements public" on public.duel_achievements;
create policy "duel achievements public" on public.duel_achievements for select using (true);
drop policy if exists "users create own duel achievements" on public.duel_achievements;
create policy "users create own duel achievements" on public.duel_achievements for insert with check (auth.uid() = user_id);

drop policy if exists "users read own blocks" on public.user_blocks;
create policy "users read own blocks" on public.user_blocks for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
drop policy if exists "users create own blocks" on public.user_blocks;
create policy "users create own blocks" on public.user_blocks for insert with check (auth.uid() = blocker_id);
drop policy if exists "users delete own blocks" on public.user_blocks;
create policy "users delete own blocks" on public.user_blocks for delete using (auth.uid() = blocker_id);

drop policy if exists "daily challenges public" on public.daily_challenges;
create policy "daily challenges public" on public.daily_challenges for select using (true);
drop policy if exists "authenticated create daily challenges" on public.daily_challenges;
create policy "authenticated create daily challenges" on public.daily_challenges for insert with check (auth.uid() is not null);

drop policy if exists "daily scores public" on public.daily_challenge_scores;
create policy "daily scores public" on public.daily_challenge_scores for select using (true);
drop policy if exists "users insert own daily scores" on public.daily_challenge_scores;
create policy "users insert own daily scores" on public.daily_challenge_scores for insert with check (auth.uid() = user_id);

drop policy if exists "weekly tournaments public" on public.weekly_tournaments;
create policy "weekly tournaments public" on public.weekly_tournaments for select using (true);
drop policy if exists "authenticated create weekly tournaments" on public.weekly_tournaments;
create policy "authenticated create weekly tournaments" on public.weekly_tournaments for insert with check (auth.uid() is not null);

drop policy if exists "weekly scores public" on public.weekly_tournament_scores;
create policy "weekly scores public" on public.weekly_tournament_scores for select using (true);
drop policy if exists "users upsert own weekly scores insert" on public.weekly_tournament_scores;
create policy "users upsert own weekly scores insert" on public.weekly_tournament_scores for insert with check (auth.uid() = user_id);
drop policy if exists "users upsert own weekly scores update" on public.weekly_tournament_scores;
create policy "users upsert own weekly scores update" on public.weekly_tournament_scores for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users own xp" on public.player_xp;
create policy "users own xp" on public.player_xp for select using (auth.uid() = user_id);
drop policy if exists "users insert own xp" on public.player_xp;
create policy "users insert own xp" on public.player_xp for insert with check (auth.uid() = user_id);
drop policy if exists "users update own xp" on public.player_xp;
create policy "users update own xp" on public.player_xp for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "season rewards public" on public.season_rewards;
create policy "season rewards public" on public.season_rewards for select using (true);
drop policy if exists "cosmetics public" on public.cosmetics;
create policy "cosmetics public" on public.cosmetics for select using (true);
drop policy if exists "shop items public" on public.shop_items;
create policy "shop items public" on public.shop_items for select using (true);

drop policy if exists "users own cosmetics" on public.player_cosmetics;
create policy "users own cosmetics" on public.player_cosmetics for select using (auth.uid() = user_id);
drop policy if exists "users unlock own cosmetics" on public.player_cosmetics;
create policy "users unlock own cosmetics" on public.player_cosmetics for insert with check (auth.uid() = user_id);

drop policy if exists "users own loadout" on public.player_loadout;
create policy "users own loadout" on public.player_loadout for select using (auth.uid() = user_id);
drop policy if exists "users insert own loadout" on public.player_loadout;
create policy "users insert own loadout" on public.player_loadout for insert with check (auth.uid() = user_id);
drop policy if exists "users update own loadout" on public.player_loadout;
create policy "users update own loadout" on public.player_loadout for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users own wallet" on public.player_wallets;
create policy "users own wallet" on public.player_wallets for select using (auth.uid() = user_id);
drop policy if exists "users insert own wallet" on public.player_wallets;
create policy "users insert own wallet" on public.player_wallets for insert with check (auth.uid() = user_id);
drop policy if exists "users update own wallet" on public.player_wallets;
create policy "users update own wallet" on public.player_wallets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users own wallet transactions" on public.wallet_transactions;
create policy "users own wallet transactions" on public.wallet_transactions for select using (auth.uid() = user_id);
drop policy if exists "users insert own wallet transactions" on public.wallet_transactions;
create policy "users insert own wallet transactions" on public.wallet_transactions for insert with check (auth.uid() = user_id);

drop policy if exists "users insert playtest events" on public.playtest_events;
create policy "users insert playtest events" on public.playtest_events for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "users insert client errors" on public.client_errors;
create policy "users insert client errors" on public.client_errors for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "users own streaks" on public.player_streaks;
create policy "users own streaks" on public.player_streaks for select using (auth.uid() = user_id);
drop policy if exists "users insert own streaks" on public.player_streaks;
create policy "users insert own streaks" on public.player_streaks for insert with check (auth.uid() = user_id);
drop policy if exists "users update own streaks" on public.player_streaks;
create policy "users update own streaks" on public.player_streaks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "global achievements public" on public.global_achievements;
create policy "global achievements public" on public.global_achievements for select using (true);
drop policy if exists "users insert own global achievements" on public.global_achievements;
create policy "users insert own global achievements" on public.global_achievements for insert with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.duel_rooms;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.duel_players;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.duel_events;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.duel_invites;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.duel_results;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.duel_ratings;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
