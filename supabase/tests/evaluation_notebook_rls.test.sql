begin;

select plan(8);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.evaluation_entries'::regclass),
  'evaluation_entries has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.evaluation_rubrics'::regclass),
  'evaluation_rubrics has RLS enabled'
);

select ok(
  not has_table_privilege('anon', 'public.evaluation_entries', 'select,insert,update,delete'),
  'anon has no CRUD grant on evaluation_entries'
);

select ok(
  not has_table_privilege('anon', 'public.evaluation_rubrics', 'select,insert,update,delete'),
  'anon has no CRUD grant on evaluation_rubrics'
);

select ok(
  has_table_privilege('authenticated', 'public.evaluation_entries', 'select,insert,update,delete'),
  'authenticated has CRUD grant on evaluation_entries'
);

select ok(
  has_table_privilege('authenticated', 'public.evaluation_rubrics', 'select,insert,update,delete'),
  'authenticated has CRUD grant on evaluation_rubrics'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'evaluation_entries'),
  4,
  'evaluation_entries has one policy per CRUD operation'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'evaluation_rubrics'),
  4,
  'evaluation_rubrics has one policy per CRUD operation'
);

select * from finish();
rollback;
