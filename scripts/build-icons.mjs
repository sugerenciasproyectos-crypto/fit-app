// Genera los PNG de la PWA a partir de public/icon.svg. Uso: node scripts/build-icons.mjs
import { webkit } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icon.svg', 'utf8');
const browser = await webkit.launch();
const page = await browser.newPage();
for (const [name, size] of [['pwa-192.png', 192], ['pwa-512.png', 512], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: `public/${name}`, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log('ok');
