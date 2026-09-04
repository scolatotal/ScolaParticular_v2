-- Duties and breaks in the personal timetable need no pupil group.
-- Keep ownership, RLS, and the existing group foreign key unchanged.
alter table public.teacher_schedules alter column group_id drop not null;
