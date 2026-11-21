create extension if not exists btree_gist with schema extensions;

-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Emails that become admin on signup (no client access)
create table public.admin_emails (
  email text primary key
);
grant all on public.admin_emails to service_role;
alter table public.admin_emails enable row level security;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Read own profile or admin" on public.profiles
  for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "Insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;

  if new.email is not null and exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Services
create table public.services (
  id text primary key,
  name text not null,
  description text not null default '',
  duration_min integer not null,
  price_cents integer not null,
  active boolean not null default true,
  sort_order integer not null default 0
);
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "Anyone reads services" on public.services for select to anon, authenticated using (true);
create policy "Admin manages services" on public.services for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.services (id, name, description, duration_min, price_cents, sort_order) values
  ('corte', 'Corte', 'Degradê, social ou tesoura, com acabamento na navalha.', 30, 4500, 1),
  ('barba', 'Barba', 'Toalha quente, navalha e hidratação.', 30, 3500, 2),
  ('combo', 'Corte + Barba', 'O pacote completo para sair na régua.', 60, 7000, 3),
  ('sobrancelha', 'Sobrancelha', 'Alinhamento na navalha.', 30, 1500, 4);

-- Barbers
create table public.barbers (
  id text primary key,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0
);
grant select on public.barbers to anon, authenticated;
grant insert, update, delete on public.barbers to authenticated;
grant all on public.barbers to service_role;
alter table public.barbers enable row level security;
create policy "Anyone reads barbers" on public.barbers for select to anon, authenticated using (true);
create policy "Admin manages barbers" on public.barbers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.barbers (id, name, sort_order) values
  ('rafael', 'Rafael', 1),
  ('diego', 'Diego', 2);

-- Bookings
create type public.booking_status as enum ('confirmado', 'concluido', 'cancelado', 'faltou');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_name text not null,
  client_phone text,
  service_id text not null references public.services(id),
  service_name text not null default '',
  price_cents integer not null default 0,
  duration_min integer not null default 30,
  barber_id text not null references public.barbers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'confirmado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_no_overlap exclude using gist (
    barber_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('confirmado', 'concluido'))
);
create index bookings_user_idx on public.bookings (user_id, starts_at);
create index bookings_day_idx on public.bookings (starts_at);

grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;

create policy "Read own bookings or admin" on public.bookings
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Create own bookings" on public.bookings
  for insert to authenticated with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Update own bookings or admin" on public.bookings
  for update to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admin deletes bookings" on public.bookings
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Validation: fill service data, enforce business hours and future time
create or replace function public.bookings_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  svc public.services%rowtype;
  is_admin boolean := public.has_role(auth.uid(), 'admin');
  local_start timestamp;
  local_end timestamp;
  dow int;
begin
  if tg_op = 'UPDATE' then
    if not is_admin then
      -- clients can only cancel their own future bookings
      if new.status <> 'cancelado' or old.status <> 'confirmado'
         or new.starts_at <> old.starts_at or new.barber_id <> old.barber_id
         or new.service_id <> old.service_id or new.user_id <> old.user_id then
        raise exception 'Você só pode cancelar seus agendamentos confirmados.';
      end if;
      if old.starts_at <= now() then
        raise exception 'Este horário já passou e não pode ser cancelado.';
      end if;
      new.updated_at := now();
      return new;
    end if;
    if new.starts_at = old.starts_at and new.service_id = old.service_id and new.barber_id = old.barber_id then
      new.updated_at := now();
      return new;
    end if;
  end if;

  select * into svc from public.services where id = new.service_id and active;
  if not found then
    raise exception 'Serviço indisponível.';
  end if;
  if not exists (select 1 from public.barbers where id = new.barber_id and active) then
    raise exception 'Barbeiro indisponível.';
  end if;

  new.service_name := svc.name;
  new.price_cents := svc.price_cents;
  new.duration_min := svc.duration_min;
  new.ends_at := new.starts_at + make_interval(mins => svc.duration_min);

  if not is_admin then
    new.status := 'confirmado';
    if new.starts_at <= now() then
      raise exception 'Escolha um horário no futuro.';
    end if;
  end if;

  local_start := new.starts_at at time zone 'America/Sao_Paulo';
  local_end := new.ends_at at time zone 'America/Sao_Paulo';
  dow := extract(dow from local_start);
  if dow not in (2, 3, 4, 5, 6) then
    raise exception 'A barbearia atende de terça a sábado.';
  end if;
  if local_start::time < time '09:00' or local_end::time > time '19:00' or local_end::date <> local_start::date then
    raise exception 'Horário fora do expediente (9h às 19h).';
  end if;
  if extract(minute from local_start)::int % 30 <> 0 or extract(second from local_start) <> 0 then
    raise exception 'Horário inválido.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_before_write
  before insert or update on public.bookings
  for each row execute function public.bookings_before_write();

-- Busy slots visible to signed-in clients without exposing who booked
create or replace function public.get_busy_slots(_day date)
returns table (barber_id text, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.barber_id, b.starts_at, b.ends_at
  from public.bookings b
  where b.status in ('confirmado', 'concluido')
    and (b.starts_at at time zone 'America/Sao_Paulo')::date = _day
$$;
revoke execute on function public.get_busy_slots(date) from public, anon;
grant execute on function public.get_busy_slots(date) to authenticated;
