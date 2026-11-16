import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrast, contrastPairs, luminance, palette, type Mode } from './tokens';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

describe('tokens de color', () => {
  for (const mode of Object.keys(palette) as Mode[]) {
    for (const [fg, bg] of contrastPairs) {
      it(`${mode}: ${fg} sobre ${bg} ≥ 4.5:1`, () => {
        expect(contrast(palette[mode][fg], palette[mode][bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
    it(`${mode}: index.css coincide con tokens.ts`, () => {
      for (const [name, hex] of Object.entries(palette[mode])) {
        expect(css).toContain(`--${name}: ${hex};`);
      }
    });
  }

  it('contrast calcula el máximo y rechaza colores mal formados', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(() => luminance('red')).toThrow();
  });
});
