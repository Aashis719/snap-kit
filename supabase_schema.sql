-- ============================================
-- SnapKit Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Extends Supabase Auth with user preferences and free tier tracking
create table profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  
  -- Plan and Credits
  plan_tier text default 'free' check (plan_tier in ('free', 'pro', 'team', 'enterprise')),
  credits_remaining integer default 10, -- Legacy field, kept for backward compatibility
  
  -- Free Tier Tracking (V2)
  free_generations_used integer default 0 not null,
  free_generations_limit integer default 3 not null,
  free_tier_exhausted_at timestamp with time zone,
  
  -- Personalization Fields
  preferences jsonb default '{}'::jsonb, -- Store UI theme, default language, etc.
  brand_settings jsonb default '{}'::jsonb, -- Store Brand Voice, Default Tone, Whitelisted Hashtags
  
  -- User's Own API Key (Optional - for unlimited use)
  gemini_api_key text, -- User's Gemini API key, stored securely
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table profiles enable row level security;

create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. ADMIN API KEYS TABLE (V2 - NEW)
-- ============================================
-- Stores multiple admin Gemini API keys for rotation
create table admin_api_keys (
  id uuid default uuid_generate_v4() primary key,
  
  -- API Key (encrypted recommended, but stored as text for simplicity)
  api_key text not null unique,
  key_name text, -- Optional friendly name like "Admin Key 1"
  
  -- Status and Usage Tracking
  is_active boolean default true not null,
  usage_count integer default 0 not null,
  last_used_at timestamp with time zone,
  
  -- Rate Limiting (optional)
  daily_limit integer default 1000, -- Max uses per day
  daily_usage integer default 0,
  last_reset_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null,
  notes text -- Admin notes about this key
);

-- RLS for admin_api_keys - Only accessible via Edge Functions
alter table admin_api_keys enable row level security;

-- No public policies - only server-side access via service role
create policy "Admin keys are not publicly accessible" 
  on admin_api_keys for all 
  using (false);

-- Index for faster key selection
create index idx_admin_api_keys_active_usage 
  on admin_api_keys(is_active, usage_count) 
  where is_active = true;

-- ============================================
-- 3. IMAGES TABLE
-- ============================================
-- Stores metadata about uploaded images in Cloudinary
create table images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  
  cloudinary_public_id text not null,
  cloudinary_url text not null,
  
  width integer,
  height integer,
  format text,
  file_size integer,
  
  scene_summary text, -- AI generated summary for search
  primary_color text, -- For UI theming
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for images
alter table images enable row level security;

create policy "Users can view own images" 
  on images for select 
  using (auth.uid() = user_id);

create policy "Users can insert own images" 
  on images for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own images" 
  on images for delete 
  using (auth.uid() = user_id);

-- ============================================
-- 4. FOLDERS / COLLECTIONS
-- ============================================
-- Organize generations into projects or campaigns
create table folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table folders enable row level security;

create policy "Users can view own folders" 
  on folders for select 
  using (auth.uid() = user_id);

create policy "Users can manage own folders" 
  on folders for all 
  using (auth.uid() = user_id);

-- ============================================
-- 5. TEMPLATES (Saved Configurations)
-- ============================================
-- Allow users to save their settings (Tone, Platforms, etc.)
create table templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade, -- null for system templates
  name text not null,
  description text,
  config jsonb not null, -- Stores the SocialKitConfig object
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table templates enable row level security;

create policy "Users can view own and system templates" 
  on templates for select 
  using (auth.uid() = user_id or user_id is null);

create policy "Users can manage own templates" 
  on templates for all 
  using (auth.uid() = user_id);

-- ============================================
-- 6. GENERATIONS TABLE (V2 - UPDATED)
-- ============================================
-- Stores generation results with API key source tracking
create table generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  image_id uuid references images(id) on delete set null,
  folder_id uuid references folders(id) on delete set null,
  
  status text default 'completed' check (status in ('queued', 'processing', 'completed', 'failed')),
  
  -- Inputs used
  inputs jsonb not null, 
  
  -- The Output (Captions, Hashtags, Scripts)
  results jsonb not null,
  
  -- V2: API Key Source Tracking
  api_key_source text not null check (api_key_source in ('admin', 'user')),
  admin_key_id uuid references admin_api_keys(id) on delete set null, -- Which admin key was used (if admin)
  
  -- Meta for Management
  is_favorite boolean default false,
  rating integer check (rating >= 1 and rating <= 5), -- User feedback
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for generations
alter table generations enable row level security;

create policy "Users can view own generations" 
  on generations for select 
  using (auth.uid() = user_id);

create policy "Users can insert own generations" 
  on generations for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own generations" 
  on generations for update 
  using (auth.uid() = user_id);

create policy "Users can delete own generations" 
  on generations for delete 
  using (auth.uid() = user_id);

-- Indexes for performance
create index idx_generations_user_created 
  on generations(user_id, created_at desc);

create index idx_generations_api_source 
  on generations(api_key_source, created_at desc);

-- ============================================
-- 7. USAGE LOGS (Billing & Limits)
-- ============================================
create table usage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  generation_id uuid references generations(id) on delete set null,
  
  credits_used integer not null,
  api_key_source text check (api_key_source in ('admin', 'user')),
  description text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table usage_logs enable row level security;

create policy "Users can view own usage" 
  on usage_logs for select 
  using (auth.uid() = user_id);

-- ============================================
-- 8. HELPER FUNCTIONS (V2)
-- ============================================

-- Function to check if user can use free tier
create or replace function can_use_free_tier(user_id_param uuid)
returns boolean as $$
declare
  profile_record record;
begin
  select free_generations_used, free_generations_limit, gemini_api_key
  into profile_record
  from profiles
  where id = user_id_param;
  
  -- If user has their own API key, they don't need free tier
  if profile_record.gemini_api_key is not null and profile_record.gemini_api_key != '' then
    return false;
  end if;
  
  -- Check if free generations remaining
  return profile_record.free_generations_used < profile_record.free_generations_limit;
end;
$$ language plpgsql security definer;

-- Function to increment free generation count
create or replace function increment_free_generation(user_id_param uuid)
returns void as $$
declare
  new_count integer;
  gen_limit integer;
begin
  update profiles
  set 
    free_generations_used = free_generations_used + 1,
    updated_at = now()
  where id = user_id_param
  returning free_generations_used, free_generations_limit into new_count, gen_limit;
  
  -- If just hit the limit, record the timestamp
  if new_count = gen_limit then
    update profiles
    set free_tier_exhausted_at = now()
    where id = user_id_param;
  end if;
end;
$$ language plpgsql security definer;

-- Function to get user's remaining free generations
create or replace function get_free_generations_remaining(user_id_param uuid)
returns integer as $$
declare
  profile_record record;
begin
  select free_generations_used, free_generations_limit
  into profile_record
  from profiles
  where id = user_id_param;
  
  return greatest(0, profile_record.free_generations_limit - profile_record.free_generations_used);
end;
$$ language plpgsql security definer;

-- ============================================
-- 9. ADMIN KEY ROTATION FUNCTION
-- ============================================
-- This function should be called from Edge Function (server-side only)
-- Returns the next available admin API key using round-robin

create or replace function get_next_admin_key()
returns table(key_id uuid, api_key text) as $$
declare
  selected_key record;
begin
  -- Select the least-used active key
  select id, admin_api_keys.api_key
  into selected_key
  from admin_api_keys
  where is_active = true
    and (daily_limit is null or daily_usage < daily_limit)
  order by usage_count asc, last_used_at asc nulls first
  limit 1;
  
  if selected_key.id is null then
    raise exception 'No active admin API keys available';
  end if;
  
  -- Update usage stats
  update admin_api_keys
  set 
    usage_count = usage_count + 1,
    daily_usage = daily_usage + 1,
    last_used_at = now()
  where id = selected_key.id;
  
  -- Return the key
  return query select selected_key.id, selected_key.api_key;
end;
$$ language plpgsql security definer;

-- Function to reset daily usage (run via cron job daily)
create or replace function reset_daily_admin_key_usage()
returns void as $$
begin
  update admin_api_keys
  set 
    daily_usage = 0,
    last_reset_at = now()
  where last_reset_at < current_date;
end;
$$ language plpgsql security definer;

-- ============================================
-- 10. VIEWS FOR ANALYTICS (Optional)
-- ============================================

-- View: User generation statistics
create or replace view user_generation_stats as
select 
  p.id as user_id,
  p.email,
  p.free_generations_used,
  p.free_generations_limit,
  (p.free_generations_limit - p.free_generations_used) as free_remaining,
  count(g.id) filter (where g.api_key_source = 'admin') as admin_generations,
  count(g.id) filter (where g.api_key_source = 'user') as user_key_generations,
  count(g.id) as total_generations,
  max(g.created_at) as last_generation_at
from profiles p
left join generations g on g.user_id = p.id
group by p.id, p.email, p.free_generations_used, p.free_generations_limit;

-- RLS for view
alter view user_generation_stats set (security_invoker = true);

