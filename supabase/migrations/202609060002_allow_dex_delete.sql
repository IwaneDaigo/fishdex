grant delete on public.user_fish_dex to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_fish_dex'
      and policyname = 'dex_delete_own'
  ) then
    create policy "dex_delete_own"
    on public.user_fish_dex for delete
    to authenticated
    using (auth.uid() = user_id);
  end if;
end;
$$;
