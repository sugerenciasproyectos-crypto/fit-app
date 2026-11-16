import { useQuery } from '@tanstack/react-query';
import type { RecipeResult } from '../../domain/nutrition';
import { supabase, type Tables } from '../../lib/supabase';
import type { Product } from '../products/api';

export type Recipe = Tables<'recipes'>;
export type RecipeFull = Recipe & {
  product: Product;
  ingredients: (Tables<'recipe_ingredients'> & { product: Product })[];
};

const SELECT =
  '*, product:products!recipes_product_id_fkey(*), ingredients:recipe_ingredients(*, product:products(*))';

export function useRecipeByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['recipe', productId],
    enabled: !!productId,
    queryFn: async (): Promise<RecipeFull> => {
      const { data, error } = await supabase
        .from('recipes')
        .select(SELECT)
        .eq('product_id', productId!)
        .single();
      if (error) throw error;
      const r = data as unknown as RecipeFull;
      return { ...r, ingredients: [...r.ingredients].sort((a, b) => a.position - b.position) };
    },
  });
}

export interface RecipeDraft {
  name: string;
  servings: number | null;
  cookedWeight: number | null;
  notes: string;
  ingredients: { product: Product; quantity: number }[];
}

/**
 * Guarda la receta como producto derivado (source = receta, base_unit = g) con su porción "ración"
 * (TRD §7.5) y sus ingredientes.
 */
export async function saveRecipe(
  userId: string,
  existing: RecipeFull | null,
  d: RecipeDraft,
  result: RecipeResult,
): Promise<string> {
  const productFields = {
    name: d.name.trim(),
    base_unit: 'g' as const,
    source: 'receta' as const,
    needs_review: result.needsReview,
    warnings: result.needsReview ? ['Mezcla g y ml: se trató 1 ml como 1 g'] : [],
    ...Object.fromEntries(
      Object.entries(result.per100).map(([k, v]) => [
        k,
        v === null ? null : Math.round(v * 100) / 100,
      ]),
    ),
  };
  let productId: string;
  let recipeId: string;
  if (existing) {
    productId = existing.product_id;
    recipeId = existing.id;
    const { error } = await supabase.from('products').update(productFields).eq('id', productId);
    if (error) throw error;
    const { error: e2 } = await supabase
      .from('recipes')
      .update({ servings: d.servings, cooked_weight_g: d.cookedWeight, notes: d.notes || null })
      .eq('id', recipeId);
    if (e2) throw e2;
    const { error: e3 } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);
    if (e3) throw e3;
  } else {
    const { data: p, error } = await supabase
      .from('products')
      .insert({ ...productFields, user_id: userId })
      .select('id')
      .single();
    if (error) throw error;
    productId = p.id;
    const { data: r, error: e2 } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        product_id: productId,
        servings: d.servings,
        cooked_weight_g: d.cookedWeight,
        notes: d.notes || null,
      })
      .select('id')
      .single();
    if (e2) throw e2;
    recipeId = r.id;
  }
  const { error: e4 } = await supabase.from('recipe_ingredients').insert(
    d.ingredients.map((i, position) => ({
      user_id: userId,
      recipe_id: recipeId,
      product_id: i.product.id,
      quantity: i.quantity,
      position,
    })),
  );
  if (e4) throw e4;

  // Porción "ración" = peso total / raciones.
  await supabase.from('portions').delete().eq('product_id', productId).eq('name', 'ración');
  if (result.servingAmount) {
    const { error } = await supabase.from('portions').insert({
      user_id: userId,
      product_id: productId,
      name: 'ración',
      amount: Math.round(result.servingAmount * 100) / 100,
    });
    if (error) throw error;
  }
  return productId;
}
