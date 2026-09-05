grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.fish_species to authenticated;
grant select, insert, update, delete on public.encounters to authenticated;
grant select, insert, update on public.user_fish_dex to authenticated;

grant execute on function public.register_fish_encounter(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  timestamptz,
  text,
  numeric,
  jsonb
) to authenticated;
