-- ============================================
-- Movie App: Init Schema
-- Features: Profiles, Ratings, Taste DNA,
-- Watch Parties, Clips, Trending
-- ============================================

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  location extensions.geography(point, 4326),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- MOVIES (cache from TMDB or similar)
-- ============================================
create table public.movies (
  id bigint primary key, -- TMDB id
  title text not null,
  overview text,
  poster_url text,
  backdrop_url text,
  release_date date,
  genres text[],
  runtime int,
  vote_average numeric,
  created_at timestamptz default now()
);

-- ============================================
-- RATINGS
-- ============================================
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  rating numeric not null check (rating >= 0 and rating <= 10),
  review text,
  created_at timestamptz default now(),
  unique (user_id, movie_id)
);

-- ============================================
-- TASTE DNA (auto-computed per user)
-- ============================================
create table public.taste_dna (
  user_id uuid primary key references auth.users(id) on delete cascade,
  genre_weights jsonb default '{}'::jsonb,
  avg_rating numeric,
  total_ratings int default 0,
  updated_at timestamptz default now()
);

-- ============================================
-- WATCH PARTIES
-- ============================================
create table public.watch_parties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  title text,
  scheduled_at timestamptz,
  room_code text unique,
  is_public boolean default true,
  created_at timestamptz default now()
);

create table public.watch_party_members (
  party_id uuid not null references public.watch_parties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (party_id, user_id)
);

-- ============================================
-- CLIPS
-- ============================================
create table public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  title text,
  start_seconds int not null,
  end_seconds int not null,
  video_url text,
  thumbnail_url text,
  views int default 0,
  created_at timestamptz default now(),
  check (end_seconds > start_seconds)
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_ratings_user on public.ratings(user_id);
create index idx_ratings_movie on public.ratings(movie_id);
create index idx_clips_movie on public.clips(movie_id);
create index idx_clips_user on public.clips(user_id);
create index idx_watch_parties_host on public.watch_parties(host_id);
create index idx_profiles_location on public.profiles using gist(location);

-- ============================================
-- GRANTS
-- ============================================
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select on public.movies to anon, authenticated;
grant insert, update on public.movies to authenticated;

grant select, insert, update, delete on public.ratings to authenticated;
grant select on public.ratings to anon;

grant select on public.taste_dna to authenticated;
grant insert, update on public.taste_dna to authenticated;

grant select, insert, update, delete on public.watch_parties to authenticated;
grant select on public.watch_parties to anon;

grant select, insert, delete on public.watch_party_members to authenticated;

grant select, insert, update, delete on public.clips to authenticated;
grant select on public.clips to anon;

-- ============================================
-- RLS
-- ============================================
alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.ratings enable row level security;
alter table public.taste_dna enable row level security;
alter table public.watch_parties enable row level security;
alter table public.watch_party_members enable row level security;
alter table public.clips enable row level security;

-- Profiles
create policy "profiles readable by all"
  on public.profiles for select using (true);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Movies (public cache)
create policy "movies readable by all"
  on public.movies for select using (true);
create policy "authenticated can upsert movies"
  on public.movies for insert to authenticated with check (true);
create policy "authenticated can update movies"
  on public.movies for update to authenticated using (true);

-- Ratings
create policy "ratings readable by all"
  on public.ratings for select using (true);
create policy "users insert own rating"
  on public.ratings for insert with check (auth.uid() = user_id);
create policy "users update own rating"
  on public.ratings for update using (auth.uid() = user_id);
create policy "users delete own rating"
  on public.ratings for delete using (auth.uid() = user_id);

-- Taste DNA
create policy "users read own dna"
  on public.taste_dna for select using (auth.uid() = user_id);
create policy "users write own dna"
  on public.taste_dna for insert with check (auth.uid() = user_id);
create policy "users update own dna"
  on public.taste_dna for update using (auth.uid() = user_id);

-- Watch Parties
create policy "public parties visible to all"
  on public.watch_parties for select using (is_public = true or auth.uid() = host_id);
create policy "host creates party"
  on public.watch_parties for insert with check (auth.uid() = host_id);
create policy "host updates party"
  on public.watch_parties for update using (auth.uid() = host_id);
create policy "host deletes party"
  on public.watch_parties for delete using (auth.uid() = host_id);

-- Watch Party Members
create policy "members visible to party members"
  on public.watch_party_members for select using (
    exists (select 1 from public.watch_party_members m
            where m.party_id = watch_party_members.party_id
              and m.user_id = auth.uid())
    or exists (select 1 from public.watch_parties p
               where p.id = watch_party_members.party_id and p.is_public)
  );
create policy "users join parties"
  on public.watch_party_members for insert with check (auth.uid() = user_id);
create policy "users leave parties"
  on public.watch_party_members for delete using (auth.uid() = user_id);

-- Clips
create policy "clips readable by all"
  on public.clips for select using (true);
create policy "users create own clips"
  on public.clips for insert with check (auth.uid() = user_id);
create policy "users update own clips"
  on public.clips for update using (auth.uid() = user_id);
create policy "users delete own clips"
  on public.clips for delete using (auth.uid() = user_id);

-- ============================================
-- HELPER RPC: set profile location safely
-- ============================================
create or replace function public.set_profile_location(lat double precision, lng double precision)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set location = st_setsrid(st_makepoint(lng, lat), 4326)::extensions.geography,
        updated_at = now()
    where id = auth.uid();
end;
$$;

grant execute on function public.set_profile_location(double precision, double precision) to authenticated;

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  insert into public.taste_dna (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
