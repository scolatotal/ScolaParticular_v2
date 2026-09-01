-- Scola: isolated private teacher records. No service-role credentials in the app.
begin;
create schema if not exists private;
create or replace function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  code text check (code is null or char_length(code) <= 500),
  school_type text not null default 'CEIP' check (school_type is null or char_length(school_type) <= 500) check (length(trim(school_type)) > 0) check (school_type in ('CEIP','CEP','EEI','CRA','CPI','IES','CIFP','Outro')),
  address text check (address is null or char_length(address) <= 500),
  locality text check (locality is null or char_length(locality) <= 500),
  municipality text check (municipality is null or char_length(municipality) <= 500),
  province text check (province is null or char_length(province) <= 500),
  postal_code text check (postal_code is null or char_length(postal_code) <= 500),
  phone text check (phone is null or char_length(phone) <= 500),
  email text check (email is null or char_length(email) <= 500),
  website text check (website is null or char_length(website) <= 500),
  director text check (director is null or char_length(director) <= 500),
  head_of_studies text check (head_of_studies is null or char_length(head_of_studies) <= 500),
  secretary text check (secretary is null or char_length(secretary) <= 500),
  notes text check (notes is null or char_length(notes) <= 20000),
  logo_path text check (logo_path is null or char_length(logo_path) <= 500),
  photo_path text check (photo_path is null or char_length(photo_path) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.schools enable row level security;
create trigger touch_updated_at before update on public.schools for each row execute function private.touch_updated_at();
revoke all on public.schools from anon;
grant select, insert, update, delete on public.schools to authenticated;
create index schools_owner_idx on public.schools(user_id);
create policy own_select on public.schools for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.schools for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.schools for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.schools for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  first_name text not null check (first_name is null or char_length(first_name) <= 500) check (length(trim(first_name)) > 0),
  last_name text check (last_name is null or char_length(last_name) <= 500),
  display_name text not null check (display_name is null or char_length(display_name) <= 500) check (length(trim(display_name)) > 0),
  phone text check (phone is null or char_length(phone) <= 500),
  school_id uuid,
  academic_year text not null default '2026/27' check (academic_year is null or char_length(academic_year) <= 500) check (length(trim(academic_year)) > 0),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id = user_id),
  unique(user_id)
);
alter table public.profiles enable row level security;
create trigger touch_updated_at before update on public.profiles for each row execute function private.touch_updated_at();
revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;
create index profiles_owner_idx on public.profiles(user_id);
create policy own_select on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  stage text not null default 'Primaria' check (stage is null or char_length(stage) <= 500) check (length(trim(stage)) > 0) check (stage in ('Infantil','Primaria','ESO','Bacharelato','FP','Outra')),
  grade text check (grade is null or char_length(grade) <= 500),
  letter text check (letter is null or char_length(letter) <= 500),
  academic_year text not null default '2026/27' check (academic_year is null or char_length(academic_year) <= 500) check (length(trim(academic_year)) > 0),
  color text default '#0070c0' check (color is null or char_length(color) <= 500),
  notes text check (notes is null or char_length(notes) <= 20000),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.groups enable row level security;
create trigger touch_updated_at before update on public.groups for each row execute function private.touch_updated_at();
revoke all on public.groups from anon;
grant select, insert, update, delete on public.groups to authenticated;
create index groups_owner_idx on public.groups(user_id);
create policy own_select on public.groups for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.groups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.groups for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.groups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  color text default '#0070c0' check (color is null or char_length(color) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subjects enable row level security;
create trigger touch_updated_at before update on public.subjects for each row execute function private.touch_updated_at();
revoke all on public.subjects from anon;
grant select, insert, update, delete on public.subjects to authenticated;
create index subjects_owner_idx on public.subjects(user_id);
create policy own_select on public.subjects for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.subjects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.subjects for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.subjects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  first_name text not null check (first_name is null or char_length(first_name) <= 500) check (length(trim(first_name)) > 0),
  last_name text not null check (last_name is null or char_length(last_name) <= 500) check (length(trim(last_name)) > 0),
  group_id uuid not null,
  birth_date date,
  phone text check (phone is null or char_length(phone) <= 500),
  emergency_phone text check (emergency_phone is null or char_length(emergency_phone) <= 500),
  notes text check (notes is null or char_length(notes) <= 20000),
  relevant_info text check (relevant_info is null or char_length(relevant_info) <= 20000),
  photo_path text check (photo_path is null or char_length(photo_path) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (birth_date is null or birth_date <= current_date)
);
alter table public.students enable row level security;
create trigger touch_updated_at before update on public.students for each row execute function private.touch_updated_at();
revoke all on public.students from anon;
grant select, insert, update, delete on public.students to authenticated;
create index students_owner_idx on public.students(user_id);
create policy own_select on public.students for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.students for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.students for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.students for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.student_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  student_id uuid not null,
  relationship text not null default 'Nai' check (relationship is null or char_length(relationship) <= 500) check (length(trim(relationship)) > 0) check (relationship in ('Nai','Pai','Outro contacto')),
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  phone text check (phone is null or char_length(phone) <= 500),
  email text check (email is null or char_length(email) <= 500),
  other_relationship text check (other_relationship is null or char_length(other_relationship) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.student_contacts enable row level security;
create trigger touch_updated_at before update on public.student_contacts for each row execute function private.touch_updated_at();
revoke all on public.student_contacts from anon;
grant select, insert, update, delete on public.student_contacts to authenticated;
create index student_contacts_owner_idx on public.student_contacts(user_id);
create policy own_select on public.student_contacts for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.student_contacts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.student_contacts for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.student_contacts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.student_health_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  student_id uuid not null,
  type text not null default 'Alimentaria' check (type is null or char_length(type) <= 500) check (length(trim(type)) > 0) check (type in ('Alimentaria','Medicamento','Ambiental','Outra')),
  description text not null check (description is null or char_length(description) <= 20000) check (length(trim(description)) > 0),
  severity text not null default 'Media' check (severity is null or char_length(severity) <= 500) check (length(trim(severity)) > 0) check (severity in ('Baixa','Media','Alta')),
  action text check (action is null or char_length(action) <= 20000),
  notes text check (notes is null or char_length(notes) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.student_health_alerts enable row level security;
create trigger touch_updated_at before update on public.student_health_alerts for each row execute function private.touch_updated_at();
revoke all on public.student_health_alerts from anon;
grant select, insert, update, delete on public.student_health_alerts to authenticated;
create index student_health_alerts_owner_idx on public.student_health_alerts(user_id);
create policy own_select on public.student_health_alerts for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.student_health_alerts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.student_health_alerts for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.student_health_alerts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.teacher_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  weekday smallint not null default 1 check (weekday between 1 and 5),
  start_time time not null,
  end_time time not null,
  subject_id uuid not null,
  group_id uuid not null,
  room text check (room is null or char_length(room) <= 500),
  notes text check (notes is null or char_length(notes) <= 20000),
  academic_year text not null default '2026/27' check (academic_year is null or char_length(academic_year) <= 500) check (length(trim(academic_year)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);
alter table public.teacher_schedules enable row level security;
create trigger touch_updated_at before update on public.teacher_schedules for each row execute function private.touch_updated_at();
revoke all on public.teacher_schedules from anon;
grant select, insert, update, delete on public.teacher_schedules to authenticated;
create index teacher_schedules_owner_idx on public.teacher_schedules(user_id);
create policy own_select on public.teacher_schedules for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.teacher_schedules for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.teacher_schedules for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.teacher_schedules for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.group_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  weekday smallint not null default 1 check (weekday between 1 and 5),
  start_time time not null,
  end_time time not null,
  subject_id uuid not null,
  group_id uuid not null,
  teacher text check (teacher is null or char_length(teacher) <= 500),
  room text check (room is null or char_length(room) <= 500),
  notes text check (notes is null or char_length(notes) <= 20000),
  academic_year text not null default '2026/27' check (academic_year is null or char_length(academic_year) <= 500) check (length(trim(academic_year)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);
alter table public.group_schedules enable row level security;
create trigger touch_updated_at before update on public.group_schedules for each row execute function private.touch_updated_at();
revoke all on public.group_schedules from anon;
grant select, insert, update, delete on public.group_schedules to authenticated;
create index group_schedules_owner_idx on public.group_schedules(user_id);
create policy own_select on public.group_schedules for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.group_schedules for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.group_schedules for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.group_schedules for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  student_id uuid not null,
  date date not null,
  status text not null default 'Presente' check (status is null or char_length(status) <= 500) check (length(trim(status)) > 0) check (status in ('Presente','Falta','Retraso','Xustificada')),
  notes text check (notes is null or char_length(notes) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, student_id, date)
);
alter table public.attendance enable row level security;
create trigger touch_updated_at before update on public.attendance for each row execute function private.touch_updated_at();
revoke all on public.attendance from anon;
grant select, insert, update, delete on public.attendance to authenticated;
create index attendance_owner_idx on public.attendance(user_id);
create policy own_select on public.attendance for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.attendance for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.attendance for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.attendance for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  title text not null check (title is null or char_length(title) <= 500) check (length(trim(title)) > 0),
  description text check (description is null or char_length(description) <= 20000),
  starts_on date not null,
  ends_on date not null,
  start_time time,
  end_time time,
  all_day boolean default true,
  type text not null default 'Recordatorio' check (type is null or char_length(type) <= 500) check (length(trim(type)) > 0) check (type in ('Clase','Reunión','Titoría','Avaliación','Exame','Actividade','Recordatorio','Conmemoración','Festivo','Non lectivo','Evento persoal')),
  group_id uuid,
  student_id uuid,
  location text check (location is null or char_length(location) <= 500),
  notes text check (notes is null or char_length(notes) <= 20000),
  recurrence text not null default 'Non se repite' check (recurrence is null or char_length(recurrence) <= 500) check (length(trim(recurrence)) > 0) check (recurrence in ('Non se repite','Diaria','Semanal','Mensual')),
  repeat_until date,
  reminder text not null default 'Sen aviso' check (reminder is null or char_length(reminder) <= 500) check (length(trim(reminder)) > 0) check (reminder in ('Sen aviso','Ao comezar','15 minutos antes','1 día antes')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (end_time is null or start_time is null or end_time > start_time),
  check (recurrence = 'Non se repite' or (repeat_until is not null and repeat_until >= starts_on)),
  check (all_day or (start_time is not null and end_time is not null))
);
alter table public.calendar_events enable row level security;
create trigger touch_updated_at before update on public.calendar_events for each row execute function private.touch_updated_at();
revoke all on public.calendar_events from anon;
grant select, insert, update, delete on public.calendar_events to authenticated;
create index calendar_events_owner_idx on public.calendar_events(user_id);
create policy own_select on public.calendar_events for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.calendar_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.calendar_events for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.calendar_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.school_calendar_events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  starts_on date not null,
  ends_on date not null,
  is_non_teaching boolean not null default false,
  description text check (description is null or char_length(description) <= 20000),
  academic_year text not null default '2026/27' check (academic_year is null or char_length(academic_year) <= 500) check (length(trim(academic_year)) > 0),
  source_url text check (source_url is null or char_length(source_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
alter table public.school_calendar_events enable row level security;
create trigger touch_updated_at before update on public.school_calendar_events for each row execute function private.touch_updated_at();
grant select on public.school_calendar_events to authenticated;
revoke all on public.school_calendar_events from anon;
create policy read_reference on public.school_calendar_events for select to authenticated using (true);

create table public.school_commemorations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  starts_on date not null,
  ends_on date not null,
  description text check (description is null or char_length(description) <= 20000),
  academic_year text not null default '2026/27' check (academic_year is null or char_length(academic_year) <= 500) check (length(trim(academic_year)) > 0),
  source_url text check (source_url is null or char_length(source_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
alter table public.school_commemorations enable row level security;
create trigger touch_updated_at before update on public.school_commemorations for each row execute function private.touch_updated_at();
grant select on public.school_commemorations to authenticated;
revoke all on public.school_commemorations from anon;
create policy read_reference on public.school_commemorations for select to authenticated using (true);

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  title text not null check (title is null or char_length(title) <= 500) check (length(trim(title)) > 0),
  date date not null,
  time time,
  type text not null default 'Nota' check (type is null or char_length(type) <= 500) check (length(trim(type)) > 0) check (type in ('Nota','Exercicio','Actividade','Sesión','Avaliación','Reunión','Incidencia','Recordatorio','Idea','Outro')),
  group_id uuid,
  subject_id uuid,
  student_id uuid,
  content text check (content is null or char_length(content) <= 20000),
  evaluation text not null default 'Non procede' check (evaluation is null or char_length(evaluation) <= 500) check (length(trim(evaluation)) > 0) check (evaluation in ('Non procede','Inicial','1ª','2ª','Final','Outra')),
  attendees text check (attendees is null or char_length(attendees) <= 20000),
  agreements text check (agreements is null or char_length(agreements) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.diary_entries enable row level security;
create trigger touch_updated_at before update on public.diary_entries for each row execute function private.touch_updated_at();
revoke all on public.diary_entries from anon;
grant select, insert, update, delete on public.diary_entries to authenticated;
create index diary_entries_owner_idx on public.diary_entries(user_id);
create policy own_select on public.diary_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.diary_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.diary_entries for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.diary_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.diary_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.diary_tags enable row level security;
create trigger touch_updated_at before update on public.diary_tags for each row execute function private.touch_updated_at();
revoke all on public.diary_tags from anon;
grant select, insert, update, delete on public.diary_tags to authenticated;
create index diary_tags_owner_idx on public.diary_tags(user_id);
create policy own_select on public.diary_tags for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.diary_tags for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.diary_tags for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.diary_tags for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.diary_entry_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  entry_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_id, tag_id)
);
alter table public.diary_entry_tags enable row level security;
create trigger touch_updated_at before update on public.diary_entry_tags for each row execute function private.touch_updated_at();
revoke all on public.diary_entry_tags from anon;
grant select, insert, update, delete on public.diary_entry_tags to authenticated;
create index diary_entry_tags_owner_idx on public.diary_entry_tags(user_id);
create policy own_select on public.diary_entry_tags for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.diary_entry_tags for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.diary_entry_tags for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.diary_entry_tags for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.evaluation_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  entry_id uuid not null,
  student_id uuid not null,
  content text not null check (content is null or char_length(content) <= 20000) check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.evaluation_observations enable row level security;
create trigger touch_updated_at before update on public.evaluation_observations for each row execute function private.touch_updated_at();
revoke all on public.evaluation_observations from anon;
grant select, insert, update, delete on public.evaluation_observations to authenticated;
create index evaluation_observations_owner_idx on public.evaluation_observations(user_id);
create policy own_select on public.evaluation_observations for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.evaluation_observations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.evaluation_observations for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.evaluation_observations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.diary_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  entry_id uuid not null,
  name text not null check (name is null or char_length(name) <= 500) check (length(trim(name)) > 0),
  path text not null check (path is null or char_length(path) <= 500) check (length(trim(path)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.diary_attachments enable row level security;
create trigger touch_updated_at before update on public.diary_attachments for each row execute function private.touch_updated_at();
revoke all on public.diary_attachments from anon;
grant select, insert, update, delete on public.diary_attachments to authenticated;
create index diary_attachments_owner_idx on public.diary_attachments(user_id);
create policy own_select on public.diary_attachments for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.diary_attachments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.diary_attachments for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.diary_attachments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.tutoring_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  student_id uuid not null,
  group_id uuid,
  date date not null,
  start_time time,
  end_time time,
  attendees text check (attendees is null or char_length(attendees) <= 20000),
  type text not null default 'Presencial' check (type is null or char_length(type) <= 500) check (length(trim(type)) > 0) check (type in ('Presencial','Telefónica','Videoconferencia','Outra')),
  reason text not null check (reason is null or char_length(reason) <= 500) check (length(trim(reason)) > 0),
  topics text check (topics is null or char_length(topics) <= 20000),
  agreements text check (agreements is null or char_length(agreements) <= 20000),
  follow_up text check (follow_up is null or char_length(follow_up) <= 20000),
  next_meeting date,
  private_notes text check (private_notes is null or char_length(private_notes) <= 20000),
  status text not null default 'Programada' check (status is null or char_length(status) <= 500) check (length(trim(status)) > 0) check (status in ('Programada','Realizada','Cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);
alter table public.tutoring_sessions enable row level security;
create trigger touch_updated_at before update on public.tutoring_sessions for each row execute function private.touch_updated_at();
revoke all on public.tutoring_sessions from anon;
grant select, insert, update, delete on public.tutoring_sessions to authenticated;
create index tutoring_sessions_owner_idx on public.tutoring_sessions(user_id);
create policy own_select on public.tutoring_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.tutoring_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.tutoring_sessions for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.tutoring_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unique (id, user_id),
  title text not null check (title is null or char_length(title) <= 500) check (length(trim(title)) > 0),
  type text not null default 'Claustro' check (type is null or char_length(type) <= 500) check (length(trim(type)) > 0) check (type in ('Claustro','CCP','Equipo docente','Ciclo','Departamento','Coordinación','Avaliación','Familias','Formación','Outra')),
  date date not null,
  start_time time,
  end_time time,
  location text check (location is null or char_length(location) <= 500),
  participants text check (participants is null or char_length(participants) <= 20000),
  agenda text check (agenda is null or char_length(agenda) <= 20000),
  notes text check (notes is null or char_length(notes) <= 20000),
  agreements text check (agreements is null or char_length(agreements) <= 20000),
  tasks text check (tasks is null or char_length(tasks) <= 20000),
  status text not null default 'Programada' check (status is null or char_length(status) <= 500) check (length(trim(status)) > 0) check (status in ('Programada','Realizada','Cancelada')),
  show_in_agenda boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);
alter table public.meetings enable row level security;
create trigger touch_updated_at before update on public.meetings for each row execute function private.touch_updated_at();
revoke all on public.meetings from anon;
grant select, insert, update, delete on public.meetings to authenticated;
create index meetings_owner_idx on public.meetings(user_id);
create policy own_select on public.meetings for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.meetings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_delete on public.meetings for delete to authenticated using ((select auth.uid()) = user_id);
create policy own_update on public.meetings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter table public.profiles add constraint profiles_school_id_owner_fk foreign key (school_id,user_id) references public.schools(id,user_id) on delete restrict;
create index profiles_school_id_idx on public.profiles(user_id,school_id);
alter table public.students add constraint students_group_id_owner_fk foreign key (group_id,user_id) references public.groups(id,user_id) on delete restrict;
create index students_group_id_idx on public.students(user_id,group_id);
alter table public.student_contacts add constraint student_contacts_student_id_owner_fk foreign key (student_id,user_id) references public.students(id,user_id) on delete cascade;
create index student_contacts_student_id_idx on public.student_contacts(user_id,student_id);
alter table public.student_health_alerts add constraint student_health_alerts_student_id_owner_fk foreign key (student_id,user_id) references public.students(id,user_id) on delete cascade;
create index student_health_alerts_student_id_idx on public.student_health_alerts(user_id,student_id);
alter table public.teacher_schedules add constraint teacher_schedules_subject_id_owner_fk foreign key (subject_id,user_id) references public.subjects(id,user_id) on delete restrict;
create index teacher_schedules_subject_id_idx on public.teacher_schedules(user_id,subject_id);
alter table public.teacher_schedules add constraint teacher_schedules_group_id_owner_fk foreign key (group_id,user_id) references public.groups(id,user_id) on delete restrict;
create index teacher_schedules_group_id_idx on public.teacher_schedules(user_id,group_id);
alter table public.group_schedules add constraint group_schedules_subject_id_owner_fk foreign key (subject_id,user_id) references public.subjects(id,user_id) on delete restrict;
create index group_schedules_subject_id_idx on public.group_schedules(user_id,subject_id);
alter table public.group_schedules add constraint group_schedules_group_id_owner_fk foreign key (group_id,user_id) references public.groups(id,user_id) on delete restrict;
create index group_schedules_group_id_idx on public.group_schedules(user_id,group_id);
alter table public.attendance add constraint attendance_student_id_owner_fk foreign key (student_id,user_id) references public.students(id,user_id) on delete restrict;
create index attendance_student_id_idx on public.attendance(user_id,student_id);
alter table public.calendar_events add constraint calendar_events_group_id_owner_fk foreign key (group_id,user_id) references public.groups(id,user_id) on delete restrict;
create index calendar_events_group_id_idx on public.calendar_events(user_id,group_id);
alter table public.calendar_events add constraint calendar_events_student_id_owner_fk foreign key (student_id,user_id) references public.students(id,user_id) on delete restrict;
create index calendar_events_student_id_idx on public.calendar_events(user_id,student_id);
alter table public.diary_entries add constraint diary_entries_group_id_owner_fk foreign key (group_id,user_id) references public.groups(id,user_id) on delete restrict;
create index diary_entries_group_id_idx on public.diary_entries(user_id,group_id);
alter table public.diary_entries add constraint diary_entries_subject_id_owner_fk foreign key (subject_id,user_id) references public.subjects(id,user_id) on delete restrict;
create index diary_entries_subject_id_idx on public.diary_entries(user_id,subject_id);
alter table public.diary_entries add constraint diary_entries_student_id_owner_fk foreign key (student_id,user_id) references public.students(id,user_id) on delete restrict;
create index diary_entries_student_id_idx on public.diary_entries(user_id,student_id);
alter table public.diary_entry_tags add constraint diary_entry_tags_entry_id_owner_fk foreign key (entry_id,user_id) references public.diary_entries(id,user_id) on delete cascade;
create index diary_entry_tags_entry_id_idx on public.diary_entry_tags(user_id,entry_id);
alter table public.diary_entry_tags add constraint diary_entry_tags_tag_id_owner_fk foreign key (tag_id,user_id) references public.diary_tags(id,user_id) on delete cascade;
create index diary_entry_tags_tag_id_idx on public.diary_entry_tags(user_id,tag_id);
alter table public.evaluation_observations add constraint evaluation_observations_entry_id_owner_fk foreign key (entry_id,user_id) references public.diary_entries(id,user_id) on delete cascade;
create index evaluation_observations_entry_id_idx on public.evaluation_observations(user_id,entry_id);
alter table public.evaluation_observations add constraint evaluation_observations_student_id_owner_fk foreign key (student_id,user_id) references public.students(id,user_id) on delete cascade;
create index evaluation_observations_student_id_idx on public.evaluation_observations(user_id,student_id);
alter table public.diary_attachments add constraint diary_attachments_entry_id_owner_fk foreign key (entry_id,user_id) references public.diary_entries(id,user_id) on delete cascade;
create index diary_attachments_entry_id_idx on public.diary_attachments(user_id,entry_id);
alter table public.tutoring_sessions add constraint tutoring_sessions_student_id_owner_fk foreign key (student_id,user_id) references public.students(id,user_id) on delete restrict;
create index tutoring_sessions_student_id_idx on public.tutoring_sessions(user_id,student_id);
alter table public.tutoring_sessions add constraint tutoring_sessions_group_id_owner_fk foreign key (group_id,user_id) references public.groups(id,user_id) on delete restrict;
create index tutoring_sessions_group_id_idx on public.tutoring_sessions(user_id,group_id);

create index attendance_date_idx on public.attendance(user_id,date);
create index calendar_dates_idx on public.calendar_events(user_id,starts_on,ends_on);
create index diary_date_idx on public.diary_entries(user_id,date);
create index tutoring_date_idx on public.tutoring_sessions(user_id,date);
create index meetings_date_idx on public.meetings(user_id,date);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']),
('student-photos','student-photos',false,5242880,array['image/jpeg','image/png','image/webp']),
('school-files','school-files',false,5242880,array['image/jpeg','image/png','image/webp']),
('diary-attachments','diary-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/plain'])
on conflict(id) do nothing;
create policy scola_storage_select on storage.objects for select to authenticated using (bucket_id in ('avatars','student-photos','school-files','diary-attachments') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy scola_storage_insert on storage.objects for insert to authenticated with check (bucket_id in ('avatars','student-photos','school-files','diary-attachments') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy scola_storage_delete on storage.objects for delete to authenticated using (bucket_id in ('avatars','student-photos','school-files','diary-attachments') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy scola_storage_update on storage.objects for update to authenticated using (bucket_id in ('avatars','student-photos','school-files','diary-attachments') and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id in ('avatars','student-photos','school-files','diary-attachments') and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
