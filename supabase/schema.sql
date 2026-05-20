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
