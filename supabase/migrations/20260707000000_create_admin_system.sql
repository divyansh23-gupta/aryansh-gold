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
-- AUTOMATIC TIMESTAMPS SETUP (RENAMED TRIGGERS)
-- =========================================================================

-- Define the update timestamp function explicitly to ensure self-contained migrations
create or replace function public.set_current_timestamp_updated_at()
returns trigger security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger admin_users_set_updated_at before update on public.admin_users for each row execute procedure public.set_current_timestamp_updated_at();
create trigger admin_invites_set_updated_at before update on public.admin_invites for each row execute procedure public.set_current_timestamp_updated_at();

-- =========================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =========================================================================
create index idx_admin_users_role on public.admin_users(role);
create index idx_admin_invites_email on public.admin_invites(email);
create index idx_admin_invites_status on public.admin_invites(status);

-- =========================================================================
-- HELPER FUNCTIONS FOR SECURITY CHECKS (WITH SEARCH_PATH CONSTRAINTS)
-- =========================================================================

-- Check if user is any admin
create or replace function public.is_admin(user_id uuid)
returns boolean security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.admin_users 
    where admin_users.user_id = $1
  );
end;
$$ language plpgsql;

-- Check if user is a super_admin
create or replace function public.is_super_admin(user_id uuid)
returns boolean security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.admin_users 
    where admin_users.user_id = $1 
      and admin_users.role = 'super_admin'::public.admin_role
  );
end;
$$ language plpgsql;

-- =========================================================================
-- EXPLICIT FUNCTION EXECUTE GRANTS
-- =========================================================================
grant execute on function public.is_admin(uuid) to authenticated, anon;
grant execute on function public.is_super_admin(uuid) to authenticated, anon;

-- =========================================================================
-- ADMINISTRATIVE HARDENING PROTECTION TRIGGERS (MILESTONE 5 PATCh)
-- =========================================================================

-- Prevents deletion/demotion of last super_admin or the bootstrap email record
create or replace function public.protect_super_admin_roles()
returns trigger security definer set search_path = public as $$
declare
  super_admin_count integer;
  target_email text;
begin
  -- Fetch targeted email from auth.users using Security Definer privileges
  select email into target_email 
  from auth.users 
  where id = old.user_id;

  -- 1. Prevent demotion or deletion of the bootstrap email
  if target_email = 'divyanshgupta231@gmail.com' then
    if (tg_op = 'DELETE') or (tg_op = 'UPDATE' and new.role != 'super_admin'::public.admin_role) then
      raise exception 'Operation Prohibited: The predefined bootstrap super_admin account cannot be demoted or deleted.';
    end if;
  end if;

  -- 2. Prevent removing the last super admin from admin_users
  if (tg_op = 'DELETE' and old.role = 'super_admin'::public.admin_role) or 
     (tg_op = 'UPDATE' and old.role = 'super_admin'::public.admin_role and new.role != 'super_admin'::public.admin_role) then
    
    select count(*) into super_admin_count 
    from public.admin_users 
    where role = 'super_admin'::public.admin_role;

    if super_admin_count <= 1 then
      raise exception 'Operation Prohibited: Cannot delete or demote the last remaining super_admin. At least one super_admin must exist.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql;

-- Bind safety checks trigger to public.admin_users
drop trigger if exists enforce_super_admin_protection on public.admin_users;
create trigger enforce_super_admin_protection
  before delete or update on public.admin_users
  for each row execute procedure public.protect_super_admin_roles();

-- =========================================================================
-- BOOTSTRAPPING & INVITATION SYSTEM ON SIGN-UP
-- =========================================================================

-- Promotes bootstrap email or matching pending invites on sign-up automatically
create or replace function public.handle_user_signup_bootstrap()
returns trigger security definer set search_path = public as $$
declare
  invite_record record;
begin
  -- 1. Predefined Bootstrap Super Admin Check
  if new.email = 'divyanshgupta231@gmail.com' then
    insert into public.admin_users (user_id, role)
    values (new.id, 'super_admin'::public.admin_role)
    on conflict (user_id) do nothing;
  end if;

  -- 2. Process Pending Admin Invitations (Case-insensitive email check)
  select * into invite_record 
  from public.admin_invites
  where lower(email) = lower(new.email)
    and status = 'pending'::public.invite_status 
    and expires_at > now()
  order by created_at desc
  limit 1;

  if invite_record.id is not null then
    -- Promote the newly registered user
    insert into public.admin_users (user_id, role, invited_by)
    values (new.id, invite_record.role, invite_record.invited_by)
    on conflict (user_id) do nothing;

    -- Update invite status
    update public.admin_invites
    set status = 'accepted'::public.invite_status,
        accepted_at = now(),
        updated_at = now()
    where id = invite_record.id;
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
-- ROW LEVEL SECURITY (RLS) POLICIES (WITH WITH CHECK CLAUSES)
-- =========================================================================

alter table public.admin_users enable row level security;
alter table public.admin_invites enable row level security;

-- Policies for admin_users
create policy "Super Admins manage all admin roles" on public.admin_users
  for all 
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

create policy "Admins can view other admin user roles" on public.admin_users
  for select 
  using (public.is_admin(auth.uid()));

-- Policies for admin_invites
create policy "Super Admins manage all invitations" on public.admin_invites
  for all 
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- =========================================================================
-- MILESTONE 7: INVENTORY MANAGEMENT HARDENING CONSTRAINT
-- =========================================================================
alter table public.product_variants 
  drop constraint if exists chk_variants_stock_quantity;
alter table public.product_variants 
  add constraint chk_variants_stock_quantity check (stock_quantity >= 0);

-- =========================================================================
-- ADMINISTRATIVE CATALOG MANAGEMENT RLS POLICIES
-- =========================================================================

-- Enable RLS on target tables (keeps tables locked for write/read overrides)
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_collections enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;

-- Drop and recreate custom admin write policies (keeps public read policies unaffected)
drop policy if exists "Admins edit products" on public.products;
create policy "Admins edit products" on public.products
  for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins edit variants" on public.product_variants;
create policy "Admins edit variants" on public.product_variants
  for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins edit product images" on public.product_images;
create policy "Admins edit product images" on public.product_images
  for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins edit product collections" on public.product_collections;
create policy "Admins edit product collections" on public.product_collections
  for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins edit categories" on public.categories;
create policy "Admins edit categories" on public.categories
  for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins edit collections" on public.collections;
create policy "Admins edit collections" on public.collections
  for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- =========================================================================
-- ADMINISTRATIVE STORAGE BUCKETS & RLS POLICIES
-- =========================================================================

-- Create bucket catalog if not exists
insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do nothing;

-- Create policies for storage.objects
drop policy if exists "Allow public access to catalog bucket" on storage.objects;
create policy "Allow public access to catalog bucket" on storage.objects
  for select using (bucket_id = 'catalog');

drop policy if exists "Allow authenticated uploads to catalog bucket" on storage.objects;
create policy "Allow authenticated uploads to catalog bucket" on storage.objects
  for insert with check (bucket_id = 'catalog' and auth.role() = 'authenticated');

drop policy if exists "Allow authenticated updates to catalog bucket" on storage.objects;
create policy "Allow authenticated updates to catalog bucket" on storage.objects
  for update using (bucket_id = 'catalog' and auth.role() = 'authenticated');

drop policy if exists "Allow authenticated deletes to catalog bucket" on storage.objects;
create policy "Allow authenticated deletes to catalog bucket" on storage.objects
  for delete using (bucket_id = 'catalog' and auth.role() = 'authenticated');

-- =========================================================================
-- SECURITY DEFINER AUDIT HELPER FUNCTIONS
-- =========================================================================
create or replace function public.run_audit_query()
returns json security definer set search_path = public as $$
declare
  result json;
begin
  select json_agg(t) into result
  from (
    select policyname, cmd
    from pg_policies
    where schemaname='storage'
    and tablename='objects'
  ) t;
  return result;
end;
$$ language plpgsql;

grant execute on function public.run_audit_query() to authenticated, anon;
