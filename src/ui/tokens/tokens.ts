/** Paleta "Ticket de supermercado". Fuente única: index.css debe coincidir (lo comprueba un test). */
export const palette = {
  light: {
    paper: '#fbfaf6',
    'paper-2': '#f2f0e9',
    ink: '#1b1a17',
    'ink-2': '#5f5b52',
    rule: '#c9c4b7',
    alert: '#b3261e',
    action: '#1f3f9a',
    'action-ink': '#ffffff',
    sel: '#dfe5f7',
  },
  dark: {
    paper: '#1f1e1b',
    'paper-2': '#292825',
    ink: '#eeeae0',
    'ink-2': '#aaa496',
    rule: '#4a4740',
    alert: '#ff8a80',
    action: '#9db4ff',
    'action-ink': '#10182f',
    sel: '#2e3a5e',
  },
} as const;

export type Mode = keyof typeof palette;
export type Token = keyof (typeof palette)['light'];

/** Pares texto/fondo que deben alcanzar 4.5:1 (WCAG AA texto normal). */
export const contrastPairs: ReadonlyArray<readonly [Token, Token]> = [
  ['ink', 'paper'],
  ['ink', 'paper-2'],
  ['ink-2', 'paper'],
  ['ink-2', 'paper-2'],
  ['alert', 'paper'],
  ['action', 'paper'],
  ['action-ink', 'action'],
  ['ink', 'sel'],
];

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`Color no válido: ${hex}`);
  const n = parseInt(m[1], 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
