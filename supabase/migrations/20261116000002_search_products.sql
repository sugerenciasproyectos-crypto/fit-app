-- 0002: búsqueda local de productos (Backend Schema §4.1). security invoker: RLS se aplica.
create or replace function public.search_products(
  q text,
  supermarket uuid default null,
  only_fav boolean default false,
  lim int default 30
) returns setof public.products
language sql stable security invoker set search_path = public, extensions as $$
  with term as (select public.f_norm(q) as t, regexp_replace(coalesce(q, ''), '\s', '', 'g') as raw)
  select p.*
  from public.products p, term
  where p.deleted_at is null
    and (not only_fav or p.favorite)
    and (supermarket is null or exists (
          select 1 from public.product_supermarkets ps
          where ps.product_id = p.id and ps.supermarket_id = supermarket))
    and (
      term.t = ''
      or p.barcode = term.raw
      or not exists (                              -- todas las palabras aparecen
           select 1 from unnest(string_to_array(term.t, ' ')) w
           where w <> '' and p.name_norm not like '%' || w || '%')
      or word_similarity(term.t, p.name_norm) >= 0.45 -- tolera erratas
    )
  order by
    (p.barcode is not null and p.barcode = term.raw) desc,
    case when term.t = '' then 0 else word_similarity(term.t, p.name_norm) end desc,
    p.favorite desc,
    p.last_used_at desc nulls last,
    p.name
  limit least(greatest(lim, 1), 200);
$$;

grant execute on function public.search_products(text, uuid, boolean, int) to authenticated;
