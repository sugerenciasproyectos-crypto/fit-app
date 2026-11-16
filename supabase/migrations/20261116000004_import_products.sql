-- 0004: importación de productos desde IA (TRD §8.2, Backend Schema §4.1). Todo en una transacción:
-- si algo falla, la función aborta y no se guarda nada.
--
-- payload   = { products: [producto v1 validado + needs_review], new_supermarkets: [nombres] }
-- decisions = [{ index, action: 'update'|'merge'|'new'|'skip', target: uuid|null }]
create or replace function public.import_products(payload jsonb, decisions jsonb)
returns jsonb
language plpgsql security invoker set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  p jsonb; d jsonb; n jsonb;
  i int; total int;
  act text; target uuid; pid uuid; bc text;
  sm text; smid uuid;
  c_new int := 0; c_upd int := 0; c_merge int := 0; c_skip int := 0;
begin
  if uid is null then raise exception 'Sin sesión'; end if;
  total := coalesce(jsonb_array_length(payload->'products'), 0);
  if total > 2000 then raise exception 'Máximo 2000 productos'; end if;

  -- supermercados nuevos confirmados en la vista previa
  for sm in select jsonb_array_elements_text(coalesce(payload->'new_supermarkets', '[]'::jsonb)) loop
    if not exists (select 1 from supermarkets s where s.user_id = uid and f_norm(s.name) = f_norm(sm)) then
      insert into supermarkets (user_id, name) values (uid, trim(sm));
    end if;
  end loop;

  for i in 0 .. total - 1 loop
    p := payload->'products'->i;
    n := p->'nutrients_per_100';
    select x into d from jsonb_array_elements(decisions) x where (x->>'index')::int = i limit 1;
    act := coalesce(d->>'action', 'new');
    target := nullif(d->>'target', '')::uuid;
    bc := nullif(p->>'barcode', '');

    if act = 'skip' then
      c_skip := c_skip + 1;
      continue;
    end if;

    if act in ('update', 'merge') and target is null then
      raise exception 'Producto %: falta el producto existente para %', i, act;
    end if;

    if act = 'new' or target is null then
      -- "Crear nuevo" con un código ya usado: el nuevo se guarda sin código.
      if bc is not null and exists (select 1 from products where user_id = uid and barcode = bc and deleted_at is null) then
        bc := null;
      end if;
      insert into products (user_id, name, brand, barcode, category, base_unit, package_size,
        energy_kcal, protein_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g,
        source, confidence, warnings, needs_review)
      values (uid, p->>'name', nullif(p->>'brand', ''), bc, nullif(p->>'category', ''),
        (p->>'base_unit')::base_unit, (p->>'package_size')::numeric,
        (n->>'energy_kcal')::numeric, (n->>'protein_g')::numeric, (n->>'carbs_g')::numeric,
        (n->>'sugars_g')::numeric, (n->>'fat_g')::numeric, (n->>'saturated_fat_g')::numeric,
        (n->>'fiber_g')::numeric, (n->>'salt_g')::numeric,
        (p->>'source')::product_source, nullif(p->>'confidence', '')::confidence_lvl,
        coalesce(array(select jsonb_array_elements_text(p->'warnings')), '{}'),
        coalesce((p->>'needs_review')::boolean, false))
      returning id into pid;
      c_new := c_new + 1;

    elsif act = 'update' then
      update products set
        name = p->>'name', brand = nullif(p->>'brand', ''),
        barcode = coalesce(bc, barcode), category = nullif(p->>'category', ''),
        base_unit = (p->>'base_unit')::base_unit, package_size = (p->>'package_size')::numeric,
        energy_kcal = (n->>'energy_kcal')::numeric, protein_g = (n->>'protein_g')::numeric,
        carbs_g = (n->>'carbs_g')::numeric, sugars_g = (n->>'sugars_g')::numeric,
        fat_g = (n->>'fat_g')::numeric, saturated_fat_g = (n->>'saturated_fat_g')::numeric,
        fiber_g = (n->>'fiber_g')::numeric, salt_g = (n->>'salt_g')::numeric,
        source = (p->>'source')::product_source, confidence = nullif(p->>'confidence', '')::confidence_lvl,
        warnings = coalesce(array(select jsonb_array_elements_text(p->'warnings')), '{}'),
        needs_review = coalesce((p->>'needs_review')::boolean, false)
      where id = target and user_id = uid
      returning id into pid;
      if pid is null then raise exception 'Producto % no encontrado', target; end if;
      c_upd := c_upd + 1;

    else -- merge: solo rellena lo que está a null
      update products set
        brand = coalesce(brand, nullif(p->>'brand', '')),
        barcode = coalesce(barcode, bc),
        category = coalesce(category, nullif(p->>'category', '')),
        package_size = coalesce(package_size, (p->>'package_size')::numeric),
        energy_kcal = coalesce(energy_kcal, (n->>'energy_kcal')::numeric),
        protein_g = coalesce(protein_g, (n->>'protein_g')::numeric),
        carbs_g = coalesce(carbs_g, (n->>'carbs_g')::numeric),
        sugars_g = coalesce(sugars_g, (n->>'sugars_g')::numeric),
        fat_g = coalesce(fat_g, (n->>'fat_g')::numeric),
        saturated_fat_g = coalesce(saturated_fat_g, (n->>'saturated_fat_g')::numeric),
        fiber_g = coalesce(fiber_g, (n->>'fiber_g')::numeric),
        salt_g = coalesce(salt_g, (n->>'salt_g')::numeric),
        confidence = coalesce(confidence, nullif(p->>'confidence', '')::confidence_lvl),
        warnings = array(select distinct unnest(warnings || coalesce(array(select jsonb_array_elements_text(p->'warnings')), '{}')))
      where id = target and user_id = uid
      returning id into pid;
      if pid is null then raise exception 'Producto % no encontrado', target; end if;
      c_merge := c_merge + 1;
    end if;

    -- porciones: actualizar reemplaza la cantidad; fusionar solo añade las que faltan
    insert into portions (user_id, product_id, name, amount, is_estimated)
    select uid, pid, x->>'name', (x->>'amount')::numeric, coalesce((x->>'estimated')::boolean, false)
    from jsonb_array_elements(coalesce(p->'portions', '[]'::jsonb)) x
    on conflict (product_id, name) do update
      set amount = case when act = 'update' then excluded.amount else portions.amount end,
          is_estimated = case when act = 'update' then excluded.is_estimated else portions.is_estimated end;

    -- supermercados (deben existir: los nuevos se confirman en la vista previa)
    for sm in select jsonb_array_elements_text(coalesce(p->'supermarkets', '[]'::jsonb)) loop
      select id into smid from supermarkets where user_id = uid and f_norm(name) = f_norm(sm);
      if smid is null then raise exception 'Supermercado no confirmado: %', sm; end if;
      insert into product_supermarkets (product_id, supermarket_id, user_id)
      values (pid, smid, uid) on conflict do nothing;
    end loop;
  end loop;

  return jsonb_build_object('new', c_new, 'updated', c_upd, 'merged', c_merge, 'skipped', c_skip);
end $$;

grant execute on function public.import_products(jsonb, jsonb) to authenticated;
