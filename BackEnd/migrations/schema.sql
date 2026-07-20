create extension if not exists "uuid-ossp";
-- 1. profiles
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    avatar_url text,
    city text,
    created_at timestamptz not null default now()
);
-- 2. movies
create table public.movies (
    id uuid primary key default uuid_generate_v4(),
    tmdb_id integer unique,
    title text not null,
    poster_url text,
    overview text,
    genres text [] not null default '{}',
    created_at timestamptz not null default now()
);
-- 3. ratings
create table public.ratings (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    movie_id uuid not null references public.movies(id) on delete cascade,
    rating numeric(3, 1) not null check (
        rating >= 0
        and rating <= 10
    ),
    created_at timestamptz not null default now(),
    unique (user_id, movie_id)
);
-- 4. watch_parties
create table public.watch_parties (
    id uuid primary key default uuid_generate_v4(),
    host_id uuid not null references public.profiles(id) on delete cascade,
    movie_id uuid not null references public.movies(id) on delete cascade,
    invite_code text unique,
    is_active boolean not null default true,
    current_time numeric not null default 0,
    created_at timestamptz not null default now()
);
-- 5. party_members
create table public.party_members (
    id uuid primary key default uuid_generate_v4(),
    party_id uuid not null references public.watch_parties(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    is_talking boolean not null default false,
    joined_at timestamptz not null default now(),
    unique (party_id, user_id)
);
-- 6. clips
create table public.clips (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    movie_id uuid not null references public.movies(id) on delete cascade,
    video_url text not null,
    caption text,
    city text,
    created_at timestamptz not null default now()
);
-- 7. user_taste_dna
create table public.user_taste_dna (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null unique references public.profiles(id) on delete cascade,
    genre_percentages jsonb not null default '{}',
    updated_at timestamptz not null default now()
);
create or replace function public.tg_touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now();
return new;
end;
$$;
create trigger user_taste_dna_touch before
update on public.user_taste_dna for each row execute function public.tg_touch_updated_at();
-- RLS
alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.ratings enable row level security;
alter table public.watch_parties enable row level security;
alter table public.party_members enable row level security;
alter table public.clips enable row level security;
alter table public.user_taste_dna enable row level security;
create policy "profiles_select_all" on public.profiles for
select using (true);
create policy "profiles_update_own" on public.profiles for
update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for
insert with check (auth.uid() = id);
create policy "movies_select_all" on public.movies for
select using (auth.role() = 'authenticated');
create policy "ratings_select_all" on public.ratings for
select using (auth.role() = 'authenticated');
create policy "ratings_insert_own" on public.ratings for
insert with check (auth.uid() = user_id);
create policy "ratings_update_own" on public.ratings for
update using (auth.uid() = user_id);
create policy "watch_parties_select_participant" on public.watch_parties for
select using (
        auth.uid() = host_id
        or exists (
            select 1
            from public.party_members pm
            where pm.party_id = id
                and pm.user_id = auth.uid()
        )
    );
create policy "watch_parties_insert_host" on public.watch_parties for
insert with check (auth.uid() = host_id);
create policy "watch_parties_update_host" on public.watch_parties for
update using (auth.uid() = host_id);
create policy "party_members_select_participant" on public.party_members for
select using (
        exists (
            select 1
            from public.party_members me
            where me.party_id = party_id
                and me.user_id = auth.uid()
        )
    );
create policy "party_members_insert_self" on public.party_members for
insert with check (auth.uid() = user_id);
create policy "party_members_update_self" on public.party_members for
update using (auth.uid() = user_id);
create policy "clips_select_all" on public.clips for
select using (auth.role() = 'authenticated');
create policy "clips_insert_own" on public.clips for
insert with check (auth.uid() = user_id);
create policy "user_taste_dna_select_own" on public.user_taste_dna for
select using (auth.uid() = user_id);
-- Realtime: broadcast party state changes to subscribed React Native clients
alter publication supabase_realtime
add table public.watch_parties;
alter publication supabase_realtime
add table public.party_members;