-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Create polls table
create table if not exists polls (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  options jsonb not null,
  creator_id uuid references auth.users(id) on delete cascade,
  is_public boolean default true,
  allows_multiple_votes boolean default false,
  expires_at timestamp with time zone,
  qr_code_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create votes table
create table if not exists votes (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references polls(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  option_ids integer[] not null,
  created_at timestamp with time zone default now(),
  unique(poll_id, user_id)
);

-- Create poll analytics table
create table if not exists poll_analytics (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references polls(id) on delete cascade,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table polls enable row level security;
alter table votes enable row level security;
alter table poll_analytics enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Anyone can view public polls" on polls;
drop policy if exists "Users can view their own polls" on polls;
drop policy if exists "Authenticated users can create polls" on polls;
drop policy if exists "Users can update their own polls" on polls;
drop policy if exists "Users can view votes for public polls" on votes;
drop policy if exists "Users can vote on public polls" on votes;
drop policy if exists "Poll creators can view analytics" on poll_analytics;
drop policy if exists "Anyone can insert analytics" on poll_analytics;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Polls policies
create policy "Anyone can view public polls" on polls
  for select using (is_public = true);

create policy "Users can view their own polls" on polls
  for select using (auth.uid() = creator_id);

create policy "Authenticated users can create polls" on polls
  for insert with check (auth.uid() = creator_id);

create policy "Users can update their own polls" on polls
  for update using (auth.uid() = creator_id);

-- Votes policies
create policy "Users can view votes for public polls" on votes
  for select using (
    exists (
      select 1 from polls
      where polls.id = votes.poll_id
      and polls.is_public = true
    )
  );

create policy "Users can vote on public polls" on votes
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from polls
      where polls.id = votes.poll_id
      and polls.is_public = true
      and (polls.expires_at is null or polls.expires_at > now())
    )
  );

-- Analytics policies
create policy "Poll creators can view analytics" on poll_analytics
  for select using (
    exists (
      select 1 from polls
      where polls.id = poll_analytics.poll_id
      and polls.creator_id = auth.uid()
    )
  );

create policy "Anyone can insert analytics" on poll_analytics
  for insert with check (true);
