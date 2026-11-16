/**
 * Genera supabase/migrations/20261116000003_seed_products.sql a partir de seed-data.ts.
 * Uso: node scripts/build-seed.ts
 */
import { writeFileSync } from 'node:fs';
import { isKcalIncoherent } from '../src/domain/nutrition.ts';
import { SEED } from './seed-data.ts';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const problems: string[] = [];
const ids = new Set<string>();

const rows = SEED.map(([id, name, cat, unit, kcal, p, c, sug, f, sat, fib, salt, portions]) => {
  if (ids.has(id)) problems.push(`id duplicado: ${id}`);
  ids.add(id);
  if (sug > c + 0.5) problems.push(`${id}: azúcares > carbohidratos`);
  if (sat > f + 0.5) problems.push(`${id}: saturadas > grasa`);
  const nutr = {
    energy_kcal: kcal,
    protein_g: p,
    carbs_g: c,
    sugars_g: sug,
    fat_g: f,
    saturated_fat_g: sat,
    fiber_g: fib,
    salt_g: salt,
  };
  const alcohol = ['cerveza', 'vino-tinto'].includes(id);
  if (!alcohol && isKcalIncoherent(nutr, 0.25))
    console.warn(`aviso: kcal poco coherentes en ${id}`);
  const por = JSON.stringify(portions.map(([n, a]) => ({ name: n, amount: a })));
  return `(${q(`seed:${id}`)},${q(name)},${q(cat)},'${unit}',${kcal},${p},${c},${sug},${f},${sat},${fib},${salt},${q(por)}::jsonb,'usda-sr-legacy')`;
});

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const sql = `-- 0003_seed_products: catálogo de partida (${SEED.length} alimentos). Generado por scripts/build-seed.ts; no editar a mano.
-- Valores aproximados por 100 g/ml basados en USDA FoodData Central (SR Legacy, CC0).

insert into public.seed_products
  (id, name, category, base_unit, energy_kcal, protein_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g, portions, origin)
values
${rows.join(',\n')}
on conflict (id) do update set
  name = excluded.name, category = excluded.category, base_unit = excluded.base_unit,
  energy_kcal = excluded.energy_kcal, protein_g = excluded.protein_g, carbs_g = excluded.carbs_g,
  sugars_g = excluded.sugars_g, fat_g = excluded.fat_g, saturated_fat_g = excluded.saturated_fat_g,
  fiber_g = excluded.fiber_g, salt_g = excluded.salt_g, portions = excluded.portions, origin = excluded.origin;

-- Copia el seed a un usuario (idempotente: solo los que aún no tiene).
create or replace function public.copy_seed_to(p_user uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with ins as (
    insert into products (user_id,name,category,base_unit,energy_kcal,protein_g,carbs_g,sugars_g,
                          fat_g,saturated_fat_g,fiber_g,salt_g,source,source_id)
    select p_user,s.name,s.category,s.base_unit,s.energy_kcal,s.protein_g,s.carbs_g,s.sugars_g,
           s.fat_g,s.saturated_fat_g,s.fiber_g,s.salt_g,'seed',s.id
    from seed_products s
    where not exists (select 1 from products p where p.user_id = p_user and p.source = 'seed' and p.source_id = s.id)
    returning id, source_id
  )
  insert into portions (user_id, product_id, name, amount)
  select p_user, ins.id, p->>'name', (p->>'amount')::numeric
  from ins join seed_products s on s.id = ins.source_id
  cross join lateral jsonb_array_elements(s.portions) p;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.copy_seed_to(uuid) from public, anon, authenticated;

-- El alta usa la misma función.
create or replace function public.bootstrap_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into meal_slots (user_id, name, position, start_time) values
    (new.id,'Desayuno',1,'00:00'),(new.id,'Comida',2,'11:00'),
    (new.id,'Merienda',3,'16:00'),(new.id,'Cena',4,'19:30'),(new.id,'Snacks',5,null);
  perform public.copy_seed_to(new.id);
  return new;
end $$;

-- Usuarios ya existentes.
select public.copy_seed_to(id) from auth.users;
`;

writeFileSync('supabase/migrations/20261116000003_seed_products.sql', sql);
console.log(`${SEED.length} alimentos`);
