-- =========================================================================
-- MILESTONE 1: DATABASE FOUNDATION - ADMIN SYSTEM
-- =========================================================================

-- 1. Create role and invite status enums
create type public.admin_role as enum ('super_admin', 'admin');
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'revoked');

-- 2. Create admin_users Table
create table public.admin_users (
  user_id uuid references auth.users(id) on delete cascade primary key,
  role public.admin_role default 'admin'::public.admin_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create admin_invites Table (email is not unique to support multiple invite trials)
create table public.admin_invites (
  id uuid default gen_random_uuid() not null primary key,
  email text not null,
  role public.admin_role default 'admin'::public.admin_role not null,
  token text not null unique,
  status public.invite_status default 'pending'::public.invite_status not null,
  invited_by uuid references auth.users(id) on delete cascade not null,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- AUTOMATIC TIMESTAMPS SETUP
-- =========================================================================
create trigger set_updated_at before update on public.admin_users for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.admin_invites for each row execute procedure public.set_current_timestamp_updated_at();

-- =========================================================================
-- HELPER FUNCTIONS FOR SECURITY CHECKS
-- =========================================================================

-- Check if user is any admin
create or replace function public.is_admin(user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.admin_users 
    where admin_users.user_id = $1
  );
end;
$$ language plpgsql;

-- Check if user is a super_admin
create or replace function public.is_super_admin(user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.admin_users 
    where admin_users.user_id = $1 
      and admin_users.role = 'super_admin'::public.admin_role
  );
end;
$$ language plpgsql;

-- =========================================================================
-- BOOTSTRAPPING FOR FIRST SUPER_ADMIN
-- =========================================================================

-- Promotes divyanshgupta231@gmail.com on sign-up, standard users default to normal
create or replace function public.handle_user_signup_bootstrap()
returns trigger security definer as $$
begin
  if new.email = 'divyanshgupta231@gmail.com' then
    insert into public.admin_users (user_id, role)
    values (new.id, 'super_admin'::public.admin_role)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

-- Bind bootstrap trigger to auth.users
drop trigger if exists on_auth_user_created_bootstrap on auth.users;
create trigger on_auth_user_created_bootstrap
  after insert on auth.users
  for each row execute procedure public.handle_user_signup_bootstrap();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.admin_users enable row level security;
alter table public.admin_invites enable row level security;

-- Policies for admin_users
create policy "Super Admins manage all admin roles" on public.admin_users
  for all using (public.is_super_admin(auth.uid()));

create policy "Admins can view other admin user roles" on public.admin_users
  for select using (public.is_admin(auth.uid()));

-- Policies for admin_invites
create policy "Super Admins manage all invitations" on public.admin_invites
  for all using (public.is_super_admin(auth.uid()));
