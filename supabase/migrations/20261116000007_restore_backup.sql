-- 0007: restaurar la copia de seguridad (formato de intercambio v1 ampliado, Backend Schema §8).
-- Upsert por id, tabla a tabla y en orden de dependencias, todo en una transacción.
-- Devuelve el resumen por tabla. Las filas siempre se guardan con user_id = auth.uid().
create or replace function public.restore_backup(payload jsonb)
returns jsonb
language plpgsql security invoker set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  x jsonb; y jsonb; n jsonb; pid uuid; smid uuid;
  c jsonb := '{}'::jsonb;
  k int;
begin
  if uid is null then raise exception 'Sin sesión'; end if;
  if coalesce((payload->>'schema_version')::int, 0) <> 1 then raise exception 'schema_version debe ser 1'; end if;

  -- perfil
  if payload ? 'profile' and jsonb_typeof(payload->'profile') = 'object' then
    x := payload->'profile';
    insert into profiles (user_id, sex, birth_date, height_cm, activity, goal, kcal_adjust, protein_g_per_kg,
      fat_pct, body_fat_pct, use_katch, tdee_initial, tdee_current, tracking_start, theme, last_backup_at)
    values (uid, (x->>'sex')::sex, (x->>'birth_date')::date, (x->>'height_cm')::numeric,
      (x->>'activity')::activity_level, (x->>'goal')::goal_type, (x->>'kcal_adjust')::int,
      (x->>'protein_g_per_kg')::numeric, (x->>'fat_pct')::numeric, (x->>'body_fat_pct')::numeric,
      coalesce((x->>'use_katch')::boolean, false), (x->>'tdee_initial')::numeric, (x->>'tdee_current')::numeric,
      (x->>'tracking_start')::date, coalesce(x->>'theme', 'system'), (x->>'last_backup_at')::timestamptz)
    on conflict (user_id) do update set
      sex = excluded.sex, birth_date = excluded.birth_date, height_cm = excluded.height_cm,
      activity = excluded.activity, goal = excluded.goal, kcal_adjust = excluded.kcal_adjust,
      protein_g_per_kg = excluded.protein_g_per_kg, fat_pct = excluded.fat_pct,
      body_fat_pct = excluded.body_fat_pct, use_katch = excluded.use_katch,
      tdee_initial = excluded.tdee_initial, tdee_current = excluded.tdee_current,
      tracking_start = excluded.tracking_start, theme = excluded.theme, last_backup_at = excluded.last_backup_at;
    c := c || jsonb_build_object('profile', 1);
  end if;

  -- comidas del día (las de la copia sustituyen a las que tengan la misma posición)
  k := 0;
  for x in select * from jsonb_array_elements(coalesce(payload->'meal_slots', '[]')) loop
    delete from meal_slots where user_id = uid and position = (x->>'position')::smallint and id <> (x->>'id')::uuid
      and not exists (select 1 from diary_entries d where d.meal_slot_id = meal_slots.id);
    insert into meal_slots (id, user_id, name, position, start_time, archived)
    values ((x->>'id')::uuid, uid, x->>'name', (x->>'position')::smallint, (x->>'start_time')::time,
      coalesce((x->>'archived')::boolean, false))
    on conflict (id) do update set name = excluded.name, position = excluded.position,
      start_time = excluded.start_time, archived = excluded.archived;
    k := k + 1;
  end loop;
  c := c || jsonb_build_object('meal_slots', k);

  -- supermercados
  k := 0;
  for x in select * from jsonb_array_elements(coalesce(payload->'supermarkets', '[]')) loop
    if x ? 'id' then
      delete from supermarkets where user_id = uid and f_norm(name) = f_norm(x->>'name') and id <> (x->>'id')::uuid;
      insert into supermarkets (id, user_id, name) values ((x->>'id')::uuid, uid, x->>'name')
      on conflict (id) do update set name = excluded.name;
    elsif not exists (select 1 from supermarkets where user_id = uid and f_norm(name) = f_norm(x->>'name')) then
      insert into supermarkets (user_id, name) values (uid, x->>'name');
    end if;
    k := k + 1;
  end loop;
  c := c || jsonb_build_object('supermarkets', k);

  -- productos, porciones y precios
  k := 0;
  for x in select * from jsonb_array_elements(coalesce(payload->'products', '[]')) loop
    n := x->'nutrients_per_100';
    insert into products (id, user_id, name, brand, barcode, category, base_unit, package_size,
      energy_kcal, protein_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g,
      source, source_id, confidence, warnings, needs_review, manually_edited, favorite, created_at, deleted_at)
    values (coalesce((x->>'id')::uuid, gen_random_uuid()), uid, x->>'name', x->>'brand', x->>'barcode', x->>'category',
      (x->>'base_unit')::base_unit, (x->>'package_size')::numeric,
      (n->>'energy_kcal')::numeric, (n->>'protein_g')::numeric, (n->>'carbs_g')::numeric, (n->>'sugars_g')::numeric,
      (n->>'fat_g')::numeric, (n->>'saturated_fat_g')::numeric, (n->>'fiber_g')::numeric, (n->>'salt_g')::numeric,
      (x->>'source')::product_source, x->>'source_id', (x->>'confidence')::confidence_lvl,
      coalesce(array(select jsonb_array_elements_text(x->'warnings')), '{}'),
      coalesce((x->>'needs_review')::boolean, false), coalesce((x->>'manually_edited')::boolean, false),
      coalesce((x->>'favorite')::boolean, false), coalesce((x->>'created_at')::timestamptz, now()),
      (x->>'deleted_at')::timestamptz)
    on conflict (id) do update set
      name = excluded.name, brand = excluded.brand, barcode = excluded.barcode, category = excluded.category,
      base_unit = excluded.base_unit, package_size = excluded.package_size, energy_kcal = excluded.energy_kcal,
      protein_g = excluded.protein_g, carbs_g = excluded.carbs_g, sugars_g = excluded.sugars_g,
      fat_g = excluded.fat_g, saturated_fat_g = excluded.saturated_fat_g, fiber_g = excluded.fiber_g,
      salt_g = excluded.salt_g, source = excluded.source, source_id = excluded.source_id,
      confidence = excluded.confidence, warnings = excluded.warnings, needs_review = excluded.needs_review,
      manually_edited = excluded.manually_edited, favorite = excluded.favorite, deleted_at = excluded.deleted_at
    returning id into pid;

    delete from portions where product_id = pid;
    insert into portions (user_id, product_id, name, amount, is_estimated)
    select uid, pid, p->>'name', (p->>'amount')::numeric, coalesce((p->>'estimated')::boolean, false)
    from jsonb_array_elements(coalesce(x->'portions', '[]')) p;

    delete from product_supermarkets where product_id = pid;
    for y in select * from jsonb_array_elements(
      coalesce(x->'supermarket_prices',
        (select jsonb_agg(jsonb_build_object('name', s, 'price', null)) from jsonb_array_elements_text(coalesce(x->'supermarkets', '[]')) s),
        '[]')) loop
      select id into smid from supermarkets where user_id = uid and f_norm(name) = f_norm(y->>'name');
      if smid is null then
        insert into supermarkets (user_id, name) values (uid, y->>'name') returning id into smid;
      end if;
      insert into product_supermarkets (product_id, supermarket_id, user_id, price_eur)
      values (pid, smid, uid, (y->>'price')::numeric) on conflict do nothing;
    end loop;
    k := k + 1;
  end loop;
  c := c || jsonb_build_object('products', k);

  -- recetas
  k := 0;
  for x in select * from jsonb_array_elements(coalesce(payload->'recipes', '[]')) loop
    insert into recipes (id, user_id, product_id, servings, cooked_weight_g, notes)
    values ((x->>'id')::uuid, uid, (x->>'product_id')::uuid, (x->>'servings')::numeric,
      (x->>'cooked_weight_g')::numeric, x->>'notes')
    on conflict (id) do update set servings = excluded.servings, cooked_weight_g = excluded.cooked_weight_g, notes = excluded.notes;
    delete from recipe_ingredients where recipe_id = (x->>'id')::uuid;
    insert into recipe_ingredients (user_id, recipe_id, product_id, quantity, position)
    select uid, (x->>'id')::uuid, (i->>'product_id')::uuid, (i->>'quantity')::numeric, coalesce((i->>'position')::smallint, 0)
    from jsonb_array_elements(coalesce(x->'ingredients', '[]')) i;
    k := k + 1;
  end loop;
  c := c || jsonb_build_object('recipes', k);

  -- comidas guardadas
  k := 0;
  for x in select * from jsonb_array_elements(coalesce(payload->'saved_meals', '[]')) loop
    insert into saved_meals (id, user_id, name, favorite)
    values ((x->>'id')::uuid, uid, x->>'name', coalesce((x->>'favorite')::boolean, false))
    on conflict (id) do update set name = excluded.name, favorite = excluded.favorite;
    delete from saved_meal_items where saved_meal_id = (x->>'id')::uuid;
    insert into saved_meal_items (user_id, saved_meal_id, product_id, quantity, portion_count, position)
    select uid, (x->>'id')::uuid, (i->>'product_id')::uuid, (i->>'quantity')::numeric,
      (i->>'portion_count')::numeric, coalesce((i->>'position')::smallint, 0)
    from jsonb_array_elements(coalesce(x->'items', '[]')) i;
    k := k + 1;
  end loop;
  c := c || jsonb_build_object('saved_meals', k);

  -- diario
  k := 0;
  for x in select * from jsonb_array_elements(coalesce(payload->'diary', '[]')) loop
    n := coalesce(x->'nutrients', '{}');
    insert into diary_entries (id, user_id, day, logged_at, meal_slot_id, product_id, quantity, unit,
      portion_name, portion_count, product_name, product_brand, per100,
      energy_kcal, protein_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g, exported_at)
    values ((x->>'id')::uuid, uid, (x->>'day')::date, (x->>'logged_at')::timestamptz, (x->>'meal_slot_id')::uuid,
      (x->>'product_id')::uuid, (x->>'quantity')::numeric, (x->>'unit')::base_unit,
      x->>'portion_name', (x->>'portion_count')::numeric, x->>'product_name', x->>'product_brand',
      coalesce(x->'per100', '{}'),
      (n->>'energy_kcal')::numeric, (n->>'protein_g')::numeric, (n->>'carbs_g')::numeric, (n->>'sugars_g')::numeric,
      (n->>'fat_g')::numeric, (n->>'saturated_fat_g')::numeric, (n->>'fiber_g')::numeric, (n->>'salt_g')::numeric,
      (x->>'exported_at')::timestamptz)
    on conflict (id) do update set day = excluded.day, logged_at = excluded.logged_at,
      meal_slot_id = excluded.meal_slot_id, product_id = excluded.product_id, quantity = excluded.quantity,
      unit = excluded.unit, portion_name = excluded.portion_name, portion_count = excluded.portion_count,
      product_name = excluded.product_name, product_brand = excluded.product_brand, per100 = excluded.per100,
      energy_kcal = excluded.energy_kcal, protein_g = excluded.protein_g, carbs_g = excluded.carbs_g,
      sugars_g = excluded.sugars_g, fat_g = excluded.fat_g, saturated_fat_g = excluded.saturated_fat_g,
      fiber_g = excluded.fiber_g, salt_g = excluded.salt_g, exported_at = excluded.exported_at;
    k := k + 1;
  end loop;
  c := c || jsonb_build_object('diary', k);

  -- marcas de día, pesos, actividad e historial del TDEE
  insert into day_flags (user_id, day, incomplete)
  select uid, (j->>'day')::date, coalesce((j->>'incomplete')::boolean, true)
  from jsonb_array_elements(coalesce(payload->'day_flags', '[]')) j
  on conflict (user_id, day) do update set incomplete = excluded.incomplete;
  c := c || jsonb_build_object('day_flags', jsonb_array_length(coalesce(payload->'day_flags', '[]')));

  insert into weights (id, user_id, day, weight_kg, source, measured_at)
  select (j->>'id')::uuid, uid, (j->>'day')::date, (j->>'weight_kg')::numeric, (j->>'source')::weight_source,
    (j->>'measured_at')::timestamptz
  from jsonb_array_elements(coalesce(payload->'weights', '[]')) j
  on conflict (user_id, day) do update set weight_kg = excluded.weight_kg, source = excluded.source,
    measured_at = excluded.measured_at;
  c := c || jsonb_build_object('weights', jsonb_array_length(coalesce(payload->'weights', '[]')));

  insert into daily_activity (user_id, day, steps, active_kcal)
  select uid, (j->>'day')::date, (j->>'steps')::int, (j->>'active_kcal')::numeric
  from jsonb_array_elements(coalesce(payload->'daily_activity', '[]')) j
  on conflict (user_id, day) do update set steps = excluded.steps, active_kcal = excluded.active_kcal;
  c := c || jsonb_build_object('daily_activity', jsonb_array_length(coalesce(payload->'daily_activity', '[]')));

  insert into tdee_proposals (id, user_id, week_start, status, skip_reason, days_logged, kcal_avg,
    trend_start_kg, trend_end_kg, trend_delta_kg, tdee_obs, tdee_before, tdee_proposed, clamped,
    target_kcal_proposed, decided_at, created_at)
  select (j->>'id')::uuid, uid, (j->>'week_start')::date, (j->>'status')::proposal_status, j->>'skip_reason',
    (j->>'days_logged')::smallint, (j->>'kcal_avg')::numeric, (j->>'trend_start_kg')::numeric,
    (j->>'trend_end_kg')::numeric, (j->>'trend_delta_kg')::numeric, (j->>'tdee_obs')::numeric,
    (j->>'tdee_before')::numeric, (j->>'tdee_proposed')::numeric, coalesce((j->>'clamped')::boolean, false),
    (j->>'target_kcal_proposed')::numeric, (j->>'decided_at')::timestamptz,
    coalesce((j->>'created_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(payload->'tdee_history', '[]')) j
  on conflict (user_id, week_start) do update set status = excluded.status, skip_reason = excluded.skip_reason,
    days_logged = excluded.days_logged, kcal_avg = excluded.kcal_avg, tdee_obs = excluded.tdee_obs,
    tdee_before = excluded.tdee_before, tdee_proposed = excluded.tdee_proposed, clamped = excluded.clamped,
    target_kcal_proposed = excluded.target_kcal_proposed, decided_at = excluded.decided_at;
  c := c || jsonb_build_object('tdee_history', jsonb_array_length(coalesce(payload->'tdee_history', '[]')));

  return c;
end $$;

grant execute on function public.restore_backup(jsonb) to authenticated;
