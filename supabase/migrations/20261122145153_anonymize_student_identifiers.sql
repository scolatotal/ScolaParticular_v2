-- Remove student birth dates and retain surnames only as initials.
update public.students as student
set last_name = (
  select string_agg(upper(left(token, 1)) || '.', ' ' order by position)
  from regexp_split_to_table(trim(student.last_name), E'\\s+')
    with ordinality as surname_parts(token, position)
)
where trim(student.last_name) <> '';

alter table public.students
  drop column birth_date;

alter table public.students
  add constraint students_last_name_initials_check
  check (last_name ~ '^[^ .][.]( [^ .][.])*$');

comment on column public.students.last_name is
  'Initials only; full student surnames must not be stored.';
