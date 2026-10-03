create table public.evaluation_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  student_id uuid not null,
  academic_year text not null default '2026/27' check (char_length(academic_year) <= 20) check (length(trim(academic_year)) > 0),
  period text not null check (period in ('Avaliación Inicial', '1º Trimestre', '2º Trimestre', '3º Trimestre')),
  subject text check (subject is null or char_length(subject) <= 500),
  topic text not null check (char_length(topic) <= 500) check (length(trim(topic)) > 0),
  assessment_date date not null default current_date,
  grade text check (grade is null or char_length(grade) <= 100),
  notes text check (notes is null or char_length(notes) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (student_id, user_id) references public.students(id, user_id) on delete cascade
);

alter table public.evaluation_entries enable row level security;
create trigger touch_updated_at before update on public.evaluation_entries for each row execute function private.touch_updated_at();
revoke all on table public.evaluation_entries from anon, authenticated;
grant select, insert, update, delete on table public.evaluation_entries to authenticated;
create index evaluation_entries_owner_student_period_idx on public.evaluation_entries(user_id, student_id, academic_year, period);
create policy own_select on public.evaluation_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.evaluation_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.evaluation_entries for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.evaluation_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.evaluation_rubrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  student_id uuid not null,
  academic_year text not null default '2026/27' check (char_length(academic_year) <= 20) check (length(trim(academic_year)) > 0),
  period text not null check (period in ('Avaliación Inicial', '1º Trimestre', '2º Trimestre', '3º Trimestre')),
  title text not null check (char_length(title) <= 500) check (length(trim(title)) > 0),
  topic text not null check (char_length(topic) <= 500) check (length(trim(topic)) > 0),
  criteria text not null check (char_length(criteria) <= 20000) check (length(trim(criteria)) > 0),
  performance_levels text not null default E'Excelente\nAcadado\nEn proceso\nPrecisa apoio' check (char_length(performance_levels) <= 5000) check (length(trim(performance_levels)) > 0),
  assessment text check (assessment is null or char_length(assessment) <= 20000),
  notes text check (notes is null or char_length(notes) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (student_id, user_id) references public.students(id, user_id) on delete cascade
);

alter table public.evaluation_rubrics enable row level security;
create trigger touch_updated_at before update on public.evaluation_rubrics for each row execute function private.touch_updated_at();
revoke all on table public.evaluation_rubrics from anon, authenticated;
grant select, insert, update, delete on table public.evaluation_rubrics to authenticated;
create index evaluation_rubrics_owner_student_period_idx on public.evaluation_rubrics(user_id, student_id, academic_year, period);
create policy own_select on public.evaluation_rubrics for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.evaluation_rubrics for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.evaluation_rubrics for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.evaluation_rubrics for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
