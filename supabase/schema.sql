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

do $$
begin
  alter table public.profiles add column if not exists allow_random_invites boolean default true;
  alter table public.profiles add column if not exists last_seen_at timestamptz default now();
  alter table public.profiles add column if not exists duel_status text default 'available';
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
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint duel_invites_not_self check (from_user_id <> to_user_id),
  constraint duel_invites_unique_pair unique(room_id, from_user_id, to_user_id)
);

create index if not exists duel_invites_to_user_idx on public.duel_invites(to_user_id, status);

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
alter table public.duel_rooms enable row level security;
alter table public.duel_players enable row level security;
alter table public.duel_events enable row level security;
alter table public.duel_invites enable row level security;

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

drop policy if exists "duel rooms visible to authenticated users" on public.duel_rooms;
create policy "duel rooms visible to authenticated users" on public.duel_rooms for select using (auth.uid() is not null);
drop policy if exists "users create own duel rooms" on public.duel_rooms;
create policy "users create own duel rooms" on public.duel_rooms for insert with check (auth.uid() = host_user_id);
drop policy if exists "host updates duel rooms" on public.duel_rooms;
create policy "host updates duel rooms" on public.duel_rooms for update using (auth.uid() = host_user_id) with check (auth.uid() = host_user_id);

drop policy if exists "duel players visible to room players" on public.duel_players;
create policy "duel players visible to room players" on public.duel_players for select using (auth.uid() is not null);
drop policy if exists "users join duel as self" on public.duel_players;
create policy "users join duel as self" on public.duel_players for insert with check (auth.uid() = user_id);
drop policy if exists "users update own duel player" on public.duel_players;
create policy "users update own duel player" on public.duel_players for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "duel events visible to room players" on public.duel_events;
create policy "duel events visible to room players" on public.duel_events for select using (auth.uid() is not null);
drop policy if exists "users send own duel events" on public.duel_events;
create policy "users send own duel events" on public.duel_events for insert with check (auth.uid() = sender_user_id);

drop policy if exists "duel invites visible to participants" on public.duel_invites;
create policy "duel invites visible to participants" on public.duel_invites for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
drop policy if exists "users send duel invites" on public.duel_invites;
create policy "users send duel invites" on public.duel_invites for insert with check (auth.uid() = from_user_id and from_user_id <> to_user_id);
drop policy if exists "participants update duel invites" on public.duel_invites;
create policy "participants update duel invites" on public.duel_invites for update using (auth.uid() = from_user_id or auth.uid() = to_user_id) with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

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
