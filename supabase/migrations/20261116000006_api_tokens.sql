-- 0006: token personal del atajo de Salud (Backend Schema §4.1). Solo se guarda el sha256.
create or replace function public.create_api_token()
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  token text;
begin
  if uid is null then raise exception 'Sin sesión'; end if;
  update api_tokens set revoked_at = now() where user_id = uid and revoked_at is null;
  token := 'cal_' || encode(gen_random_bytes(32), 'hex');
  insert into api_tokens (user_id, token_hash) values (uid, encode(digest(token, 'sha256'), 'hex'));
  return token; -- se muestra una sola vez
end $$;

create or replace function public.revoke_api_token()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  update api_tokens set revoked_at = now() where user_id = auth.uid() and revoked_at is null;
end $$;

revoke execute on function public.create_api_token() from public, anon;
revoke execute on function public.revoke_api_token() from public, anon;
grant execute on function public.create_api_token() to authenticated;
grant execute on function public.revoke_api_token() to authenticated;
