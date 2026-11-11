begin;

create table public.workspaces (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.categories (
  id text not null,
  workspace_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (user_id, workspace_id, id),
  foreign key (user_id, workspace_id) references public.workspaces(user_id, id) on delete cascade
);

create table public.payment_methods (
  id uuid not null,
  workspace_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (user_id, workspace_id, id),
  foreign key (user_id, workspace_id) references public.workspaces(user_id, id) on delete cascade
);

create table public.bill_items (
  id uuid not null,
  workspace_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id text not null,
  payment_method_id uuid,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (user_id, workspace_id, id),
  foreign key (user_id, workspace_id) references public.workspaces(user_id, id) on delete cascade,
  foreign key (user_id, workspace_id, category_id) references public.categories(user_id, workspace_id, id),
  foreign key (user_id, workspace_id, payment_method_id) references public.payment_methods(user_id, workspace_id, id)
);

create table public.bill_records (
  id uuid not null,
  workspace_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bill_item_id uuid not null,
  payment_method_id uuid,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  foreign key (user_id, workspace_id) references public.workspaces(user_id, id) on delete cascade,
  foreign key (user_id, workspace_id, bill_item_id) references public.bill_items(user_id, workspace_id, id) on delete cascade,
  foreign key (user_id, workspace_id, payment_method_id) references public.payment_methods(user_id, workspace_id, id)
);

create table public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  active_workspace_id uuid,
  updated_at timestamptz not null default now(),
  foreign key (user_id, active_workspace_id) references public.workspaces(user_id, id)
);

create function public.bill_management_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['workspaces', 'categories', 'payment_methods', 'bill_items', 'bill_records', 'user_preferences'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.bill_management_touch_updated_at()', table_name);
  end loop;
end;
$$;

create index bill_records_item_idx on public.bill_records(user_id, workspace_id, bill_item_id);
create index bill_records_payment_idx on public.bill_records(user_id, workspace_id, payment_method_id);
create index bill_items_category_idx on public.bill_items(user_id, workspace_id, category_id);
create index bill_items_payment_idx on public.bill_items(user_id, workspace_id, payment_method_id);

commit;
