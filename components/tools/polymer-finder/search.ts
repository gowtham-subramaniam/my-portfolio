/**
 * Polymer Finder — search engine.
 *
 * 1. Requirement parsing: plain-language queries are scanned for hard
 *    requirements (service temperature, transparency, sterilization method,
 *    chemicals, flame rating, food/medical, cost...). Each one becomes a
 *    toggleable chip and is checked against every material.
 * 2. Ranking: materials that pass are ranked by meaning using a Hugging Face
 *    sentence-embedding model (all-MiniLM-L6-v2) running in the visitor's
 *    browser through Transformers.js, blended with a keyword score so trade
 *    names (Delrin, Ultem, Viton...) always hit. If the model can't load, the
 *    keyword score is used on its own.
 */

import { CHEM_LABELS, POLYMERS, polymerDocText, polymerKeywordText, type ChemKey, type Polymer } from './polymers';
import { EMBEDDING_MODEL, PRECOMPUTED } from './embeddings';

/* ───────────────────────────── Requirements ───────────────────────────── */

export type ConstraintKind =
  | 'temp'
  | 'clear'
  | 'autoclave'
  | 'gamma'
  | 'eto'
  | 'chem'
  | 'flame'
  | 'food'
  | 'medical'
  | 'cost'
  | 'moisture'
  | 'injection'
  | 'print3d';

export interface Constraint {
  id: string;
  kind: ConstraintKind;
  label: string;
  tempC?: number;
  chem?: ChemKey;
}

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface Check {
  constraint: Constraint;
  status: CheckStatus;
  detail: string;
}

const CHEM_PATTERNS: { key: ChemKey; re: RegExp }[] = [
  { key: 'bleach', re: /\b(bleach|hypochlorite|naocl|peroxide|h2o2|oxidi[sz]er|oxidi[sz]ing|disinfect\w*|sanitiz\w*|cleaning wipes?)/i },
  { key: 'alcohols', re: /\b(ipa|isopropanol|isopropyl|alcohols?|ethanol|methanol|disinfect\w*|sanitiz\w*|cleaning wipes?)\b/i },
  { key: 'acids', re: /\b(acids?|acidic|hcl|sulfuric|sulphuric|nitric|acetic)\b/i },
  { key: 'bases', re: /\b(bases|alkali|alkaline|caustic|naoh|koh|sodium hydroxide|ammonia)\b/i },
  { key: 'oils', re: /\b(oils?|fuels?|grease|lubricants?|gasoline|petrol|diesel|hydraulic fluid|hydrocarbons?)\b/i },
  { key: 'ketones', re: /\b(acetone|ketones?|mek|esters?|ethyl acetate)\b/i },
  { key: 'aromatics', re: /\b(aromatics?|toluene|xylene|benzene|chlorinated|dichloromethane|chloroform|solvents?)\b/i },
];

const SIMPLE_PATTERNS: { kind: ConstraintKind; re: RegExp; label: string }[] = [
  { kind: 'clear', re: /\b(transparent|clear|see[- ]through|optical(ly)?|lens(es)?|window|light[- ]?(guide|pipe))\b/i, label: 'Transparent' },
  { kind: 'autoclave', re: /\b(autoclav\w*|steam[- ]?steril\w*|steam)\b/i, label: 'Autoclavable' },
  { kind: 'gamma', re: /\b(gamma|e-?beam|electron beam|irradiat\w*|radiation[- ]steril\w*)\b/i, label: 'Gamma / e-beam stable' },
  { kind: 'eto', re: /\b(eto|ethylene oxide)\b/i, label: 'EtO compatible' },
  { kind: 'flame', re: /\b(flame[- ]?(retardant|rated|resistant)?|fire|ul ?94|v-?0)\b/i, label: 'Flame retardant (UL94 V-0)' },
  { kind: 'food', re: /\b(food|fda|potable|drinking water|nsf)\b/i, label: 'Food-contact grades' },
  { kind: 'medical', re: /\b(medical|biocompat\w*|usp class vi|iso ?10993|implant\w*|patient[- ]contact|surgical)\b/i, label: 'Medical grades' },
  { kind: 'cost', re: /\b(cheap|low[- ]cost|inexpensive|budget|economical|commodity)\b/i, label: 'Low cost' },
  { kind: 'moisture', re: /\b(low (moisture|water)( absorption| uptake)?|humid\w*|dimensional(ly)? stab\w*|moisture)\b/i, label: 'Low moisture uptake' },
  { kind: 'injection', re: /\b(injection[- ]?mold\w*|molded|moulded|injection)\b/i, label: 'Injection moldable' },
  { kind: 'print3d', re: /\b(3d[- ]?print\w*|fdm|sls|mjf|additive)\b/i, label: '3D printable' },
];

/** Extract hard requirements from a free-text query. */
export function parseConstraints(query: string): Constraint[] {
  const out: Constraint[] = [];
  const q = query.toLowerCase();

  // Temperature: take the highest positive figure ≥ 40 °C ("150C", "300 °F", "200 deg c").
  const tempRe = /(-?\d{2,3}(?:\.\d+)?)\s*(?:°|º|deg(?:rees?)?\.?)?\s*(c|f|celsius|fahrenheit)\b/gi;
  let maxC: number | null = null;
  for (const m of q.matchAll(tempRe)) {
    const v = parseFloat(m[1]);
    const unit = m[2][0];
    const c = unit === 'f' ? ((v - 32) * 5) / 9 : v;
    if (c >= 40 && (maxC === null || c > maxC)) maxC = c;
  }
  if (maxC !== null) {
    const t = Math.round(maxC);
    out.push({ id: `temp-${t}`, kind: 'temp', label: `Continuous use ≥ ${t} °C`, tempC: t });
  }

  for (const p of SIMPLE_PATTERNS) {
    if (p.re.test(q)) out.push({ id: p.kind, kind: p.kind, label: p.label });
  }

  for (const c of CHEM_PATTERNS) {
    if (c.re.test(q)) {
      out.push({ id: `chem-${c.key}`, kind: 'chem', label: `Resists ${CHEM_LABELS[c.key][0].toLowerCase()}${CHEM_LABELS[c.key].slice(1)}`, chem: c.key });
    }
  }
  return out;
}

const compatStatus = (v: 'yes' | 'limited' | 'no'): CheckStatus =>
  v === 'yes' ? 'pass' : v === 'limited' ? 'warn' : 'fail';

/** Check a polymer against one requirement. */
export function checkConstraint(p: Polymer, c: Constraint): Check {
  const r = (status: CheckStatus, detail: string): Check => ({ constraint: c, status, detail });
  switch (c.kind) {
    case 'temp': {
      const t = c.tempC ?? 0;
      if (p.contUseC >= t) return r('pass', `Rated ~${p.contUseC} °C continuous`);
      if (p.contUseC >= t - 15) return r('warn', `Marginal: ~${p.contUseC} °C continuous`);
      return r('fail', `Only ~${p.contUseC} °C continuous`);
    }
    case 'clear':
      return p.transparency === 'clear'
        ? r('pass', 'Transparent grades available')
        : p.transparency === 'translucent'
          ? r('warn', 'Translucent, not optically clear')
          : r('fail', 'Opaque');
    case 'autoclave': {
      const s = compatStatus(p.sterilization.autoclave);
      return r(s, s === 'pass' ? 'Withstands steam autoclave' : s === 'warn' ? 'Limited cycles / grade-dependent' : 'Not autoclavable');
    }
    case 'gamma': {
      const s = compatStatus(p.sterilization.gamma);
      return r(s, s === 'pass' ? 'Gamma / e-beam stable' : s === 'warn' ? 'Discolors or embrittles; use stabilized grade' : 'Degrades under radiation');
    }
    case 'eto': {
      const s = compatStatus(p.sterilization.eto);
      return r(s, s === 'pass' ? 'EtO compatible' : s === 'warn' ? 'Limited EtO compatibility' : 'Not EtO compatible');
    }
    case 'chem': {
      const k = c.chem as ChemKey;
      const v = p.chem[k];
      const name = CHEM_LABELS[k][0].toLowerCase() + CHEM_LABELS[k].slice(1);
      if (v === 'E' || v === 'G') return r('pass', `${v === 'E' ? 'Excellent' : 'Good'} vs ${name}`);
      if (v === 'F') return r('warn', `Fair vs ${name}; test under stress`);
      return r('fail', `Poor vs ${name}`);
    }
    case 'flame':
      if (p.ul94 === 'V-0') return r('pass', 'Inherently UL94 V-0');
      return r('warn', `Base grade ${p.ul94}; check for FR grades`);
    case 'food':
      return p.food ? r('pass', 'Food-contact grades available') : r('fail', 'Food-contact grades uncommon');
    case 'medical':
      return p.medical ? r('pass', 'Medical / biocompatible grades available') : r('fail', 'Medical grades uncommon');
    case 'cost':
      return p.costTier <= 2
        ? r('pass', `Cost ${'$'.repeat(p.costTier)}`)
        : p.costTier === 3
          ? r('warn', 'Mid-range cost ($$$)')
          : r('fail', `Expensive (${'$'.repeat(p.costTier)})`);
    case 'moisture':
      if (p.waterAbsPct <= 0.3) return r('pass', `${p.waterAbsPct}% water absorption`);
      if (p.waterAbsPct <= 1) return r('warn', `${p.waterAbsPct}% water absorption`);
      return r('fail', `High water absorption (${p.waterAbsPct}%)`);
    case 'injection':
      return p.processes.some((x) => /injection/i.test(x))
        ? r('pass', 'Injection moldable')
        : r('fail', 'Not conventionally injection moldable');
    case 'print3d':
      return p.processes.some((x) => /3d printing|sls|mjf/i.test(x))
        ? r('pass', 'Printable filament / powder exists')
        : r('fail', 'Not commonly 3D printed');
  }
}

/* ───────────────────────────── Keyword scoring ───────────────────────────── */

const STOP = new Set(
  'a an and are as at be but by for from has have i in is it its me my need needs of on or our part parts that the this to under use used want we with should must can material materials plastic plastics polymer resin something good best low high very'.split(
    ' ',
  ),
);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9/+\- ]+/g, ' ')
    .split(/[\s/]+/)
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));
}

const DOC_TOKENS: Set<string>[] = POLYMERS.map((p) => new Set(tokenize(polymerKeywordText(p))));
const IDF = (() => {
  const df = new Map<string, number>();
  for (const set of DOC_TOKENS) for (const t of set) df.set(t, (df.get(t) ?? 0) + 1);
  const n = DOC_TOKENS.length;
  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log(1 + n / d));
  return idf;
})();
const NAME_TOKENS: Set<string>[] = POLYMERS.map(
  (p) => new Set(tokenize([p.abbr, p.name, ...p.aka].join(' '))),
);

/** Keyword relevance, normalized so the best match = 1. */
export function keywordScores(query: string): number[] {
  const qt = [...new Set(tokenize(query))];
  const raw = POLYMERS.map((_, i) => {
    let s = 0;
    for (const t of qt) {
      if (DOC_TOKENS[i].has(t)) s += IDF.get(t) ?? 0;
      if (NAME_TOKENS[i].has(t)) s += 4; // direct name / trade-name hit
    }
    return s;
  });
  const max = Math.max(...raw);
  return raw.map((s) => (max > 0 ? s / max : 0));
}

/* ───────────────────────────── Hugging Face embeddings ───────────────────────────── */

export const MODEL_ID = EMBEDDING_MODEL;
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1';

export interface LoadProgress {
  /** 0–100 when known */
  pct: number | null;
  file?: string;
}

type Extractor = (texts: string[], opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ tolist(): number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;
let docEmbeddingsPromise: Promise<number[][]> | null = null;

/**
 * Load the embedding model once per page session. Transformers.js is loaded
 * from a CDN at runtime (not bundled) and caches model files in the browser,
 * so repeat visits load instantly.
 */
export function loadEmbedder(onProgress?: (p: LoadProgress) => void): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const url: string = TRANSFORMERS_URL;
      const tf = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
      tf.env.allowLocalModels = false;
      const fileProgress: Record<string, number> = {};
      const extractor = await tf.pipeline('feature-extraction', MODEL_ID, {
        dtype: 'q8',
        progress_callback: (info: { status: string; progress?: number; file?: string }) => {
          if (!onProgress) return;
          if (info.status === 'progress_total' && typeof info.progress === 'number') {
            onProgress({ pct: info.progress });
          } else if (info.status === 'progress' && info.file && typeof info.progress === 'number') {
            fileProgress[info.file] = info.progress;
            // The .onnx weights dominate the download; report that file.
            const onnx = Object.keys(fileProgress).find((f) => f.endsWith('.onnx'));
            onProgress({ pct: onnx ? fileProgress[onnx] : null, file: info.file });
          }
        },
      });
      return extractor as Extractor;
    })();
    extractorPromise.catch(() => {
      extractorPromise = null; // allow retry
    });
  }
  return extractorPromise;
}

async function embed(texts: string[]): Promise<number[][]> {
  const extractor = await loadEmbedder();
  const out: number[][] = [];
  const BATCH = 8;
  for (let i = 0; i < texts.length; i += BATCH) {
    const t = await extractor(texts.slice(i, i + BATCH), { pooling: 'mean', normalize: true });
    out.push(...t.tolist());
    await new Promise((res) => setTimeout(res, 0)); // keep the UI responsive
  }
  return out;
}

/** FNV-1a 32-bit hash, hex. Must match scripts/embed-polymers.mjs. */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function decodeVector(b64: string): number[] {
  const bin = atob(b64);
  const v = new Array<number>(bin.length);
  let norm = 0;
  for (let i = 0; i < bin.length; i++) {
    const byte = bin.charCodeAt(i);
    v[i] = byte > 127 ? byte - 256 : byte; // int8
    norm += v[i] * v[i];
  }
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => x / norm);
}

/**
 * Embeddings for every polymer description. Uses the precomputed vectors in
 * embeddings.ts; any polymer whose text changed since they were generated
 * (hash mismatch) or that has none is embedded live.
 */
export function getDocEmbeddings(): Promise<number[][]> {
  if (!docEmbeddingsPromise) {
    docEmbeddingsPromise = (async () => {
      const out: (number[] | null)[] = POLYMERS.map((p) => {
        const pre = PRECOMPUTED[p.abbr];
        return pre && pre[0] === fnv1a(polymerDocText(p)) ? decodeVector(pre[1]) : null;
      });
      const stale = out.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (stale.length) {
        const fresh = await embed(stale.map((i) => polymerDocText(POLYMERS[i])));
        stale.forEach((i, k) => (out[i] = fresh[k]));
      }
      return out as number[][];
    })();
    docEmbeddingsPromise.catch(() => {
      docEmbeddingsPromise = null;
    });
  }
  return docEmbeddingsPromise;
}

const dot = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

/** Cosine similarity of the query to every polymer (vectors are pre-normalized). */
export async function semanticScores(query: string): Promise<number[]> {
  const [docs, [q]] = await Promise.all([getDocEmbeddings(), embed([query])]);
  return docs.map((d) => dot(q, d));
}

/* ───────────────────────────── Ranking ───────────────────────────── */

export interface Result {
  polymer: Polymer;
  score: number; // blended score used for ranking
  relevance: number; // 0–1 relative to the best hit, for display
  checks: Check[];
  warnings: number;
}

export interface Ranking {
  matches: Result[];
  excluded: Result[];
}

// Marginal requirements cost rank. Keyword scores span 0–1, cosine
// similarities span a narrower band, so the penalty is scaled per mode.
const WARN_PENALTY = { semantic: 0.06, keyword: 0.2 };
const KEYWORD_WEIGHT = 0.15;

export function rank(
  constraints: Constraint[],
  kw: number[],
  sem: number[] | null,
): Ranking {
  const scored: Result[] = POLYMERS.map((p, i) => {
    const base = sem ? sem[i] + KEYWORD_WEIGHT * kw[i] : kw[i];
    const checks = constraints.map((c) => checkConstraint(p, c));
    const warnings = checks.filter((c) => c.status === 'warn').length;
    return { polymer: p, score: base - (sem ? WARN_PENALTY.semantic : WARN_PENALTY.keyword) * warnings, relevance: 0, checks, warnings };
  });

  const matches = scored.filter((r) => !r.checks.some((c) => c.status === 'fail'));
  const excluded = scored.filter((r) => r.checks.some((c) => c.status === 'fail'));
  matches.sort((a, b) => b.score - a.score);
  excluded.sort((a, b) => b.score - a.score);

  // Relevance bar: scale scores into 0–1 against the best and worst match.
  const all = [...matches, ...excluded];
  const hi = Math.max(...all.map((r) => r.score));
  const lo = Math.min(...all.map((r) => r.score));
  for (const r of all) r.relevance = hi > lo ? (r.score - lo) / (hi - lo) : 1;

  return { matches, excluded };
}
