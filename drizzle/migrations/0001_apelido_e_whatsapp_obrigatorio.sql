ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_nickname text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, phone, nickname)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'phone', ''), '\D', '', 'g'), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'nickname', '')), '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;

  if new.email is not null and exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.bookings_before_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  svc public.services%rowtype;
  is_admin boolean := public.has_role(auth.uid(), 'admin');
  local_start timestamp;
  local_end timestamp;
  dow int;
  phone_digits text;
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

  if tg_op = 'INSERT' then
    phone_digits := regexp_replace(coalesce(new.client_phone, ''), '\D', '', 'g');
    if phone_digits = '' then
      new.client_phone := null;
    else
      new.client_phone := phone_digits;
    end if;
    if not is_admin and length(phone_digits) not between 10 and 11 then
      raise exception 'Informe um WhatsApp válido com DDD.';
    end if;
    new.client_nickname := nullif(btrim(coalesce(new.client_nickname, '')), '');
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
$function$;
