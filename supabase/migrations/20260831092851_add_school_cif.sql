-- Add the optional CIF field without removing existing school data.
alter table public.schools
  add column cif text constraint schools_cif_check
  check (cif is null or char_length(cif) <= 500);
