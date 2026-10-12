create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_id text not null unique,
  name text not null,
  role text not null default 'customer' check (role in ('customer', 'support', 'administrator'))
);
alter table public.profiles enable row level security;
create policy "Read own profile" on public.profiles for select to authenticated using (id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, customer_id, name, role)
  values (new.id, new.id::text, coalesce(nullif(left(new.raw_user_meta_data->>'name', 80), ''), 'New customer'), 'customer');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create table public.bank_world (
  id integer primary key check (id = 1),
  revision bigint not null default 1,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.bank_world enable row level security;
revoke all on public.bank_world from anon, authenticated;
grant all on public.bank_world to service_role;

create table public.bank_revisions(id integer primary key check (id = 1), revision bigint not null default 1);
insert into public.bank_revisions(id) values (1);
alter table public.bank_revisions enable row level security;
create policy "Authenticated realtime signals" on public.bank_revisions for select to authenticated using (true);
revoke all on public.bank_revisions from anon, authenticated;
grant select on public.bank_revisions to authenticated;
grant all on public.bank_revisions to service_role;
alter publication supabase_realtime add table public.bank_revisions;

create function public.commit_bank_world(expected_revision bigint, next_data jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.bank_world set data = next_data, revision = revision + 1, updated_at = now()
  where id = 1 and revision = expected_revision;
  if not found then return false; end if;
  update public.bank_revisions set revision = revision + 1 where id = 1;
  return true;
end; $$;
revoke execute on function public.commit_bank_world(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.commit_bank_world(bigint,jsonb) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('bank-files', 'bank-files', false, 5242880, array['image/png','image/jpeg','application/pdf']);
create policy "Upload own files" on storage.objects for insert to authenticated
with check (bucket_id = 'bank-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Read own files or support attachments" on storage.objects for select to authenticated
using (bucket_id = 'bank-files' and ((storage.foldername(name))[1] = auth.uid()::text or exists (select 1 from public.profiles where id = auth.uid() and role in ('support','administrator'))));
create policy "Delete own files" on storage.objects for delete to authenticated
using (bucket_id = 'bank-files' and (storage.foldername(name))[1] = auth.uid()::text);