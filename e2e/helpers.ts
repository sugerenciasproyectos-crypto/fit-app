import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { env } from '../tests/db/env';

export async function login(page: Page, tag: 'A' | 'B' = 'A') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(env(`TEST_${tag}_EMAIL`));
  await page.getByLabel('Contraseña').fill(env(`TEST_${tag}_PASSWORD`));
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/login/);
}

/** 0 violaciones serias o críticas (Implementation Plan §1). */
export async function expectAccessible(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
}

/** Borra los registros del diario del usuario de prueba (E2E repetibles). */
export async function resetDiary(tag: 'A' | 'B' = 'A') {
  const { signIn } = await import('../tests/db/client');
  const { db, id } = await signIn(tag);
  await db.from('diary_entries').delete().eq('user_id', id);
}
