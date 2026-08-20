create or replace function public.register_fish_encounter(
  p_user_id uuid,
  p_photo_path text,
  p_japanese_name text,
  p_scientific_name text,
  p_location_name text,
  p_depth_m numeric,
  p_water_temperature_c numeric,
  p_encountered_at timestamptz,
  p_memo text,
  p_ai_confidence numeric,
  p_ai_raw_result jsonb
)
returns table (
  species_id uuid,
  encounter_id uuid,
  japanese_name text,
  scientific_name text,
  encounter_count integer,
  is_new_species boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_species_id uuid;
  v_encounter_id uuid;
  v_existing_count integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'ログインユーザーの記録だけ登録できます。';
  end if;

  if length(trim(p_japanese_name)) = 0 then
    raise exception '魚の和名を入力してください。';
  end if;

  if p_scientific_name is not null and length(trim(p_scientific_name)) > 0 then
    select f.id into v_species_id
    from public.fish_species as f
    where lower(f.scientific_name) = lower(trim(p_scientific_name))
    limit 1;
  end if;

  if v_species_id is null then
    insert into public.fish_species (japanese_name, scientific_name)
    values (trim(p_japanese_name), nullif(trim(p_scientific_name), ''))
    on conflict do nothing
    returning id into v_species_id;
  end if;

  if v_species_id is null and p_scientific_name is not null then
    select f.id into v_species_id
    from public.fish_species as f
    where lower(f.scientific_name) = lower(trim(p_scientific_name))
    limit 1;
  end if;

  insert into public.encounters (
    user_id,
    fish_species_id,
    photo_path,
    location_name,
    depth_m,
    water_temperature_c,
    encountered_at,
    memo,
    ai_confidence,
    ai_raw_result
  )
  values (
    p_user_id,
    v_species_id,
    p_photo_path,
    nullif(trim(p_location_name), ''),
    p_depth_m,
    p_water_temperature_c,
    p_encountered_at,
    nullif(trim(p_memo), ''),
    p_ai_confidence,
    p_ai_raw_result
  )
  returning id into v_encounter_id;

  select d.encounter_count into v_existing_count
  from public.user_fish_dex as d
  where d.user_id = p_user_id and d.fish_species_id = v_species_id
  for update;

  if v_existing_count is null then
    insert into public.user_fish_dex (user_id, fish_species_id, first_encounter_id, encounter_count)
    values (p_user_id, v_species_id, v_encounter_id, 1);
    encounter_count := 1;
    is_new_species := true;
  else
    update public.user_fish_dex as d
    set encounter_count = d.encounter_count + 1,
        updated_at = now()
    where d.user_id = p_user_id and d.fish_species_id = v_species_id
    returning d.encounter_count into encounter_count;
    is_new_species := false;
  end if;

  species_id := v_species_id;
  encounter_id := v_encounter_id;
  japanese_name := trim(p_japanese_name);
  scientific_name := nullif(trim(p_scientific_name), '');
  return next;
end;
$$;
