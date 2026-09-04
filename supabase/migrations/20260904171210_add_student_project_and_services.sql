-- Unknown values stay explicit until a roster or a teacher supplies them.
alter table public.students
  add column competency_project text not null default 'Sen indicar'
    check (competency_project in ('Si', 'Non', 'Sen indicar')),
  add column school_transport text not null default 'Sen indicar'
    check (school_transport in ('Si', 'Non', 'Sen indicar')),
  add column school_meals text not null default 'Sen indicar'
    check (school_meals in ('Si', 'Non', 'Sen indicar'));
