-- 0005: aplicar la corrección de un producto a registros anteriores (TRD §7.4, Backend Schema §4.1).
-- Recalcula el snapshot (per100 y los 8 valores) de los registros de ese producto en el rango.
-- Con p_dry = true solo devuelve cuántos cambian y en cuántas kcal, sin guardar nada.
-- Los registros ya exportados a Salud quedan con export_dirty por el trigger diary_dirty.
create or replace function public.apply_product_correction(
  p_product uuid,
  p_from date default null,
  p_to date default null,
  p_dry boolean default false
) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  pr products%rowtype;
  v_rows int;
  v_delta numeric;
begin
  select * into pr from products where id = p_product;
  if not found then raise exception 'Producto no encontrado'; end if;

  with target as (
    select e.id, e.quantity, coalesce(e.energy_kcal, 0) as old_kcal,
           case when pr.energy_kcal is null then null else e.quantity * pr.energy_kcal / 100 end as new_kcal
    from diary_entries e
    where e.product_id = p_product
      and (p_from is null or e.day >= p_from)
      and (p_to is null or e.day <= p_to)
  )
  select count(*), coalesce(sum(coalesce(new_kcal, 0) - old_kcal), 0) into v_rows, v_delta from target;

  if not p_dry and v_rows > 0 then
    update diary_entries e set
      per100 = jsonb_build_object(
        'energy_kcal', pr.energy_kcal, 'protein_g', pr.protein_g, 'carbs_g', pr.carbs_g,
        'sugars_g', pr.sugars_g, 'fat_g', pr.fat_g, 'saturated_fat_g', pr.saturated_fat_g,
        'fiber_g', pr.fiber_g, 'salt_g', pr.salt_g),
      energy_kcal     = e.quantity * pr.energy_kcal / 100,
      protein_g       = e.quantity * pr.protein_g / 100,
      carbs_g         = e.quantity * pr.carbs_g / 100,
      sugars_g        = e.quantity * pr.sugars_g / 100,
      fat_g           = e.quantity * pr.fat_g / 100,
      saturated_fat_g = e.quantity * pr.saturated_fat_g / 100,
      fiber_g         = e.quantity * pr.fiber_g / 100,
      salt_g          = e.quantity * pr.salt_g / 100,
      product_name    = pr.name,
      product_brand   = pr.brand,
      snapshot_at     = now()
    where e.product_id = p_product
      and (p_from is null or e.day >= p_from)
      and (p_to is null or e.day <= p_to);
  end if;

  return jsonb_build_object('rows', v_rows, 'kcal_delta', round(v_delta, 1));
end $$;

grant execute on function public.apply_product_correction(uuid, date, date, boolean) to authenticated;
