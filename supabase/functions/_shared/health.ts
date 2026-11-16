/** Lógica pura de health-sync (TRD §6.4, Backend Schema §6). Se prueba con Vitest. */
export type SampleType = 'weight' | 'steps' | 'active_kcal';

export interface Sample {
  type: SampleType;
  value: number;
  unit?: string;
  start: string;
  end?: string | null;
  source?: string | null;
}

export interface ValidSample extends Sample {
  external_id: string;
  day: string;
}

export function madridDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const TYPES: SampleType[] = ['weight', 'steps', 'active_kcal'];

/** Valida y normaliza las muestras. Devuelve las válidas y los errores por índice. */
export async function validateSamples(
  raw: unknown,
): Promise<{ ok: ValidSample[]; errors: string[] }> {
  const ok: ValidSample[] = [];
  const errors: string[] = [];
  if (!Array.isArray(raw)) return { ok, errors: ['samples debe ser una lista'] };
  if (raw.length > 5000) return { ok, errors: ['Máximo 5000 muestras por envío'] };
  for (const [i, s] of raw.entries()) {
    const x = s as Partial<Sample>;
    const value = typeof x.value === 'string' ? Number(String(x.value).replace(',', '.')) : x.value;
    if (!x || !TYPES.includes(x.type as SampleType)) {
      errors.push(`samples[${i}].type no válido`);
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      errors.push(`samples[${i}].value no válido`);
      continue;
    }
    if (!x.start || Number.isNaN(Date.parse(x.start))) {
      errors.push(`samples[${i}].start no válido`);
      continue;
    }
    if (x.type === 'weight' && (value < 30 || value > 300)) {
      errors.push(`samples[${i}]: peso fuera de 30–300 kg`);
      continue;
    }
    const end = x.end && !Number.isNaN(Date.parse(x.end)) ? x.end : null;
    const source = x.source?.toString().slice(0, 100) ?? null;
    const external_id = await sha256(`${x.type}|${x.start}|${end ?? ''}|${value}|${source ?? ''}`);
    ok.push({
      type: x.type as SampleType,
      value,
      unit: x.unit,
      start: x.start,
      end,
      source,
      external_id,
      day: madridDay(x.start),
    });
  }
  return { ok, errors };
}

/** Peso del día: la muestra más temprana de cada día. */
export function earliestWeightPerDay(samples: ValidSample[]): Map<string, ValidSample> {
  const out = new Map<string, ValidSample>();
  for (const s of samples) {
    if (s.type !== 'weight') continue;
    const cur = out.get(s.day);
    if (!cur || Date.parse(s.start) < Date.parse(cur.start)) out.set(s.day, s);
  }
  return out;
}

/**
 * Pasos o energía activa por día: suma por fuente y día, y se queda el máximo entre fuentes
 * (para no contar dos veces lo que reportan el reloj y el iPhone).
 */
export function dailyMaxAcrossSources(
  samples: Pick<ValidSample, 'type' | 'day' | 'source' | 'value'>[],
  type: 'steps' | 'active_kcal',
): Map<string, number> {
  const bySource = new Map<string, number>();
  for (const s of samples) {
    if (s.type !== type) continue;
    const k = `${s.day}|${s.source ?? ''}`;
    bySource.set(k, (bySource.get(k) ?? 0) + s.value);
  }
  const out = new Map<string, number>();
  for (const [k, v] of bySource) {
    const day = k.split('|')[0]!;
    out.set(day, Math.max(out.get(day) ?? 0, v));
  }
  return out;
}

/** Decide si una muestra de Salud reemplaza el peso existente del día. */
export function shouldReplaceWeight(
  existing: { source: 'manual' | 'health'; measured_at: string } | null,
  candidateStart: string,
): boolean {
  if (!existing) return true;
  if (existing.source === 'manual') return false;
  return Date.parse(candidateStart) < Date.parse(existing.measured_at);
}
