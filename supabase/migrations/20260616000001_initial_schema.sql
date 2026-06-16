-- Extensions
create extension if not exists "uuid-ossp";

-- Trips table
create table public.trips (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  destination text,
  start_date  date,
  end_date    date,
  is_active   boolean default false,
  cover_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Only one trip active at a time per user (partial unique index)
create unique index trips_one_active_per_user on public.trips (user_id) where is_active = true;

-- Activities table
create table public.activities (
  id            uuid primary key default uuid_generate_v4(),
  trip_id       uuid references public.trips(id) on delete cascade not null,
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  description   text,
  activity_type text default 'other' check (activity_type in ('food', 'culture', 'transport', 'hotel', 'nature', 'other')),
  scheduled_at  timestamptz not null,
  location_name text,
  location_lat  double precision,
  location_lng  double precision,
  photos        text[] default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.handle_updated_at();

create trigger activities_updated_at
  before update on public.activities
  for each row execute function public.handle_updated_at();

-- Row Level Security
alter table public.trips enable row level security;
alter table public.activities enable row level security;

-- Trips policies
create policy "Users can view their own trips"
  on public.trips for select using (auth.uid() = user_id);

create policy "Users can create their own trips"
  on public.trips for insert with check (auth.uid() = user_id);

create policy "Users can update their own trips"
  on public.trips for update using (auth.uid() = user_id);

create policy "Users can delete their own trips"
  on public.trips for delete using (auth.uid() = user_id);

-- Activities policies
create policy "Users can view their own activities"
  on public.activities for select using (auth.uid() = user_id);

create policy "Users can create their own activities"
  on public.activities for insert with check (auth.uid() = user_id);

create policy "Users can update their own activities"
  on public.activities for update using (auth.uid() = user_id);

create policy "Users can delete their own activities"
  on public.activities for delete using (auth.uid() = user_id);
