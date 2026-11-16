import { existsSync, readFileSync } from 'node:fs';

function read(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
}

const all = { ...read('.env.local'), ...read('.env.test.local'), ...process.env } as Record<
  string,
  string | undefined
>;

function req(k: string): string {
  const v = all[k];
  if (!v) throw new Error(`Falta ${k} (ver .env.local / .env.test.local)`);
  return v;
}

export const env = new Proxy({} as Record<string, string>, { get: (_t, k: string) => req(k) });
