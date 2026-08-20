create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fish_species (
  id uuid primary key default gen_random_uuid(),
  japanese_name text not null,
  scientific_name text,
  family text,
  genus text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index fish_species_scientific_name_unique
  on public.fish_species (lower(scientific_name))
  where scientific_name is not null and length(trim(scientific_name)) > 0;

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fish_species_id uuid not null references public.fish_species(id) on delete restrict,
  photo_path text not null,
  location_name text,
  depth_m numeric,
  water_temperature_c numeric,
  encountered_at timestamptz,
  memo text,
  ai_confidence numeric,
  ai_raw_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_fish_dex (
  user_id uuid not null references auth.users(id) on delete cascade,
  fish_species_id uuid not null references public.fish_species(id) on delete restrict,
  first_encounter_id uuid not null references public.encounters(id) on delete restrict,
  encounter_count integer not null default 1 check (encounter_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, fish_species_id)
);

create index encounters_user_created_idx on public.encounters(user_id, created_at desc);
create index encounters_species_user_idx on public.encounters(fish_species_id, user_id);
create index user_fish_dex_user_created_idx on public.user_fish_dex(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger fish_species_set_updated_at
before update on public.fish_species
for each row execute function public.set_updated_at();

create trigger encounters_set_updated_at
before update on public.encounters
for each row execute function public.set_updated_at();

create trigger user_fish_dex_set_updated_at
before update on public.user_fish_dex
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.fish_species enable row level security;
alter table public.encounters enable row level security;
alter table public.user_fish_dex enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "species_select_authenticated"
on public.fish_species for select
to authenticated
using (true);

create policy "encounters_select_own"
on public.encounters for select
to authenticated
using (auth.uid() = user_id);

create policy "encounters_insert_own"
on public.encounters for insert
to authenticated
with check (auth.uid() = user_id);

create policy "encounters_update_own"
on public.encounters for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "encounters_delete_own"
on public.encounters for delete
to authenticated
using (auth.uid() = user_id);

create policy "dex_select_own"
on public.user_fish_dex for select
to authenticated
using (auth.uid() = user_id);

create policy "dex_insert_own"
on public.user_fish_dex for insert
to authenticated
with check (auth.uid() = user_id);

create policy "dex_update_own"
on public.user_fish_dex for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'encounter-photos',
  'encounter-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "encounter_photos_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'encounter-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "encounter_photos_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'encounter-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "encounter_photos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'encounter-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'encounter-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "encounter_photos_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'encounter-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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
    select id into v_species_id
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
    select id into v_species_id
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
  from public.user_fish_dex d
  where d.user_id = p_user_id and d.fish_species_id = v_species_id
  for update;

  if v_existing_count is null then
    insert into public.user_fish_dex (user_id, fish_species_id, first_encounter_id, encounter_count)
    values (p_user_id, v_species_id, v_encounter_id, 1);
    encounter_count := 1;
    is_new_species := true;
  else
    update public.user_fish_dex
    set encounter_count = encounter_count + 1,
        updated_at = now()
    where user_id = p_user_id and fish_species_id = v_species_id
    returning user_fish_dex.encounter_count into encounter_count;
    is_new_species := false;
  end if;

  species_id := v_species_id;
  encounter_id := v_encounter_id;
  japanese_name := trim(p_japanese_name);
  scientific_name := nullif(trim(p_scientific_name), '');
  return next;
end;
$$;
