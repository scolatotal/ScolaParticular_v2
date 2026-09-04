alter table public.teacher_schedules add column show_without_group boolean not null default false;
comment on column public.teacher_schedules.show_without_group is 'Keep an assigned break or reading session visible even when it has no pupil group.';
