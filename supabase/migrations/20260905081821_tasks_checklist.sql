create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  title text not null check (char_length(title) <= 500) check (length(trim(title)) > 0),
  due_date date,
  notes text check (notes is null or char_length(notes) <= 20000),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
create trigger touch_updated_at before update on public.tasks
  for each row execute function private.touch_updated_at();

revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;

create index tasks_owner_status_due_idx
  on public.tasks(user_id, completed, due_date);

create policy own_select on public.tasks
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy own_insert on public.tasks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy own_update on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.tasks
  for delete to authenticated
  using ((select auth.uid()) = user_id);
