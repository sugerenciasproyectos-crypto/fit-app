// Crea (o reutiliza) usuarios de prueba en calorias-dev y guarda sus credenciales en .env.test.local.
// Uso: node scripts/dev-test-users.mjs   (requiere SUPABASE_SECRET_KEY en el entorno)
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const url = 'https://jgugebrqcfdrxprswlyd.supabase.co';
const secret = process.env.SUPABASE_SECRET_KEY;
if (!secret) throw new Error('Falta SUPABASE_SECRET_KEY');
const file = '.env.test.local';
const env = existsSync(file)
  ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)))
  : {};

async function ensure(tag) {
  const email = env[`TEST_${tag}_EMAIL`] ?? `test-${tag.toLowerCase()}@calorias.test`;
  const password = env[`TEST_${tag}_PASSWORD`] ?? randomBytes(18).toString('base64url');
  const r = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!r.ok && r.status !== 422) throw new Error(`${tag}: ${r.status} ${await r.text()}`);
  env[`TEST_${tag}_EMAIL`] = email;
  env[`TEST_${tag}_PASSWORD`] = password;
  console.log(`${tag}: ${r.ok ? 'creado' : 'ya existía'}`);
}

await ensure('A');
await ensure('B');
env.SUPABASE_SECRET_KEY = secret;
writeFileSync(file, Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
