/**
 * Polymer Finder — search engine.
 *
 * Search is deliberately layered so results are predictable and explainable:
 *
 * 1. Spelling: unknown words are corrected against the dataset vocabulary
 *    ("autofluoresense" → "autofluorescence", "acetel" → "acetal").
 * 2. Understanding (shown to the user as chips they can switch off):
 *    - Requirements: hard pass/fail checks (temperature, sterilization,
 *      chemicals, transparency, flame rating, numeric property limits such as
 *      "tensile > 100 MPa" ...). Materials that fail are excluded.
 *    - Applications: what the part is ("gears", "O-ring", "catheter",
 *      "microfluidic cartridge"...), matched against each material's uses.
 *    - Preferences: soft property wishes ("stiff", "lightweight", "tough",
 *      "low friction"...), scored from the actual property data.
 * 3. Ranking: applications + preferences + keyword matches decide the order.
 *    The Hugging Face sentence-embedding model (all-MiniLM-L6-v2, running in
 *    the browser via Transformers.js) only adds a small tie-breaking boost,
 *    and takes over ranking only when nothing else in the query is understood.
 */

import { CHEM_LABELS, POLYMERS, polymerDocText, polymerKeywordText, type ChemKey, type Polymer } from './polymers';
import { EMBEDDING_MODEL, PRECOMPUTED } from './embeddings';

/* ───────────────────────────── Shared helpers ───────────────────────────── */

const lc = (s: string) => s.toLowerCase();
const lowerFirst = (s: string) => s[0].toLowerCase() + s.slice(1);

/** Rank-based percentile (0–1) of each value; nulls get null. */
function percentiles(values: (number | null)[]): (number | null)[] {
  const present = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (present.length < 2) return values.map((v) => (v === null ? null : 0.5));
  return values.map((v) => {
    if (v === null) return null;
    let lo = 0;
    let hi = 0;
    for (const x of present) {
      if (x < v) lo++;
      if (x <= v) hi++;
    }
    return ((lo + hi - 1) / 2) / (present.length - 1);
  });
}

/* ───────────────────────────── Requirements (hard filters) ───────────────────────────── */

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
  | 'print3d'
  | 'uv'
  | 'prop';

export type NumericProp = 'tensileMPa' | 'modulusGPa' | 'density' | 'elongationPct' | 'hdtC' | 'waterAbsPct';

const PROP_META: Record<NumericProp, { label: string; unit: string }> = {
  tensileMPa: { label: 'Tensile strength', unit: 'MPa' },
  modulusGPa: { label: 'Modulus', unit: 'GPa' },
  density: { label: 'Density', unit: 'g/cm³' },
  elongationPct: { label: 'Elongation', unit: '%' },
  hdtC: { label: 'HDT', unit: '°C' },
  waterAbsPct: { label: 'Water absorption', unit: '%' },
};

export interface Constraint {
  id: string;
  kind: ConstraintKind;
  label: string;
  tempC?: number;
  chem?: ChemKey;
  prop?: NumericProp;
  op?: '>=' | '<=';
  value?: number;
}

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface Check {
  constraint: Constraint;
  status: CheckStatus;
  detail: string;
  /** How well it passes: 1 = excellent, lower = merely good (used to order materials that all pass) */
  grade?: number;
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
  { kind: 'clear', re: /\b(transparent|clear|see[- ]through|optically clear)\b/i, label: 'Transparent' },
  { kind: 'autoclave', re: /\b(autoclav\w*|steam[- ]?steril\w*|steam)\b/i, label: 'Autoclavable' },
  { kind: 'gamma', re: /\b(gamma|e-?beam|electron beam|irradiat\w*|radiation)\b/i, label: 'Gamma / e-beam stable' },
  { kind: 'uv', re: /\b(uv|ultra[- ]?violet|sun ?light|sun|outdoors?|weather\w*|ozone)\b/i, label: 'UV / outdoor resistant' },
  { kind: 'eto', re: /\b(eto|ethylene oxide)\b/i, label: 'EtO compatible' },
  { kind: 'flame', re: /\b(flame[- ]?(retardant|rated|resistant)|fire[- ]?(retardant|resistant|rated)|ul ?94|v-?0)\b/i, label: 'Flame retardant (UL94 V-0)' },
  { kind: 'food', re: /\b(food|fda|potable|drinking water|nsf)\b/i, label: 'Food-contact grades' },
  { kind: 'medical', re: /\b(medical|biocompat\w*|usp class vi|iso ?10993|patient[- ]contact)\b/i, label: 'Medical grades' },
  { kind: 'cost', re: /\b(cheap|low[- ]cost|inexpensive|budget|economical|commodity)\b/i, label: 'Low cost' },
  { kind: 'moisture', re: /\b(low (moisture|water)( absorption| uptake)?|humid\w*|moisture)\b/i, label: 'Low moisture uptake' },
  { kind: 'injection', re: /\b(injection[- ]?mold\w*|injection[- ]?mould\w*|molded|moulded)\b/i, label: 'Injection moldable' },
  { kind: 'print3d', re: /\b(3d[- ]?print\w*|fdm|sls|mjf|additive)\b/i, label: '3D printable' },
];

/* Numeric property limits: "tensile > 100 MPa", "modulus above 3 GPa", "density under 1", "elongation at least 200%" */
const PROP_WORDS: { prop: NumericProp; re: string }[] = [
  { prop: 'tensileMPa', re: 'tensile(?: strength)?|strength|uts' },
  { prop: 'modulusGPa', re: "modulus|stiffness|young'?s modulus|e-modulus" },
  { prop: 'density', re: 'density|specific gravity|sg' },
  { prop: 'elongationPct', re: 'elongation(?: at break)?|strain at break' },
  { prop: 'hdtC', re: 'hdt|heat deflection(?: temperature)?|heat distortion(?: temperature)?' },
  { prop: 'waterAbsPct', re: 'water absorption|moisture absorption|water uptake' },
];
const GE = '(?:>=|≥|>|above|over|greater than|more than|at least|min(?:imum)?|exceed(?:s|ing)?|higher than)';
const LE = '(?:<=|≤|<|below|under|less than|at most|max(?:imum)?|up to|lower than|no more than)';
const NUM = '(\\d+(?:\\.\\d+)?)\\s*(k?psi|msi|mpa|gpa|g/cm3|g/cm³|g/cc|%|°c|c\\b)?';

function convert(prop: NumericProp, v: number, unit: string | undefined): number {
  const u = (unit ?? '').toLowerCase();
  if (prop === 'tensileMPa') {
    if (u === 'psi') return v * 0.006895;
    if (u === 'kpsi') return v * 6.895;
    if (u === 'gpa') return v * 1000;
  }
  if (prop === 'modulusGPa') {
    if (u === 'mpa') return v / 1000;
    if (u === 'kpsi') return v * 0.006895;
    if (u === 'msi') return v * 6.895;
    if (u === 'psi') return v * 0.000006895;
  }
  return v;
}

function parsePropLimits(q: string): Constraint[] {
  const out: Constraint[] = [];
  for (const { prop, re } of PROP_WORDS) {
    const patterns: [RegExp, '>=' | '<='][] = [
      [new RegExp(`\\b(?:${re})\\b[^\\d<>≤≥]{0,20}?${GE}\\s*${NUM}`, 'gi'), '>='],
      [new RegExp(`\\b(?:${re})\\b[^\\d<>≤≥]{0,20}?${LE}\\s*${NUM}`, 'gi'), '<='],
      [new RegExp(`${GE}\\s*${NUM}\\s*(?:of\\s+)?(?:${re})\\b`, 'gi'), '>='],
      [new RegExp(`${LE}\\s*${NUM}\\s*(?:of\\s+)?(?:${re})\\b`, 'gi'), '<='],
    ];
    for (const [rx, op] of patterns) {
      for (const m of q.matchAll(rx)) {
        const value = Math.round(convert(prop, parseFloat(m[1]), m[2]) * 100) / 100;
        const meta = PROP_META[prop];
        const id = `prop-${prop}-${op}`;
        if (out.some((c) => c.id === id)) continue;
        out.push({ id, kind: 'prop', prop, op, value, label: `${meta.label} ${op === '>=' ? '≥' : '≤'} ${value} ${meta.unit}` });
      }
    }
  }
  return out;
}

function parseConstraints(q: string): Constraint[] {
  const out: Constraint[] = [];

  // Service temperature: the highest figure ≥ 40 °C that isn't part of an HDT limit.
  const tempRe = /(-?\d{2,3}(?:\.\d+)?)\s*(?:°|º|deg(?:rees?)?\.?)?\s*(c|f|celsius|fahrenheit)\b/gi;
  const hdtSpan = /\b(hdt|heat deflection|heat distortion)\b[^.;,]{0,30}/i.exec(q);
  let maxC: number | null = null;
  for (const m of q.matchAll(tempRe)) {
    if (hdtSpan && m.index !== undefined && m.index >= hdtSpan.index && m.index <= hdtSpan.index + hdtSpan[0].length) continue;
    const v = parseFloat(m[1]);
    const c = m[2][0].toLowerCase() === 'f' ? ((v - 32) * 5) / 9 : v;
    if (c >= 40 && (maxC === null || c > maxC)) maxC = c;
  }
  if (maxC !== null) {
    const t = Math.round(maxC);
    out.push({ id: `temp-${t}`, kind: 'temp', label: `Continuous use ≥ ${t} °C`, tempC: t });
  }

  for (const p of SIMPLE_PATTERNS) if (p.re.test(q)) out.push({ id: p.kind, kind: p.kind, label: p.label });
  for (const c of CHEM_PATTERNS) {
    if (c.re.test(q)) out.push({ id: `chem-${c.key}`, kind: 'chem', label: `Resists ${lowerFirst(CHEM_LABELS[c.key])}`, chem: c.key });
  }
  out.push(...parsePropLimits(q));
  return out;
}

const compatStatus = (v: 'yes' | 'limited' | 'no'): CheckStatus => (v === 'yes' ? 'pass' : v === 'limited' ? 'warn' : 'fail');

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
      const name = lowerFirst(CHEM_LABELS[k]);
      if (v === 'E' || v === 'G') return { ...r('pass', `${v === 'E' ? 'Excellent' : 'Good'} vs ${name}`), grade: v === 'E' ? 1 : 0.7 };
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
      return p.processes.some((x) => /injection/i.test(x)) ? r('pass', 'Injection moldable') : r('fail', 'Not conventionally injection moldable');
    case 'print3d':
      return p.processes.some((x) => /3d printing|sls|mjf/i.test(x)) ? r('pass', 'Printable filament / powder exists') : r('fail', 'Not commonly 3D printed');
    case 'uv':
      if (p.uv === 'E' || p.uv === 'G') return { ...r('pass', `${p.uv === 'E' ? 'Excellent' : 'Good'} UV / weathering resistance`), grade: p.uv === 'E' ? 1 : 0.7 };
      if (p.uv === 'F') return r('warn', 'Fair UV resistance; use a UV-stabilized or black grade outdoors');
      return r('fail', 'Poor UV resistance unless UV-stabilized or carbon-black filled');
    case 'prop': {
      const prop = c.prop as NumericProp;
      const meta = PROP_META[prop];
      const v = p[prop];
      if (v === null || v === undefined) return r('fail', `No ${lc(meta.label)} data (${p.structure === 'Elastomer' ? 'elastomer' : 'n/a'})`);
      const limit = c.value ?? 0;
      const ok = c.op === '>=' ? v >= limit : v <= limit;
      const near = c.op === '>=' ? v >= limit * 0.9 : v <= limit * 1.1;
      const txt = `${meta.label} ${v} ${meta.unit}`;
      return ok ? r('pass', txt) : near ? r('warn', `Marginal: ${txt}`) : r('fail', txt);
    }
  }
}

/* ───────────────────────────── Applications ───────────────────────────── */

export interface Signal {
  id: string;
  kind: 'app' | 'pref';
  label: string;
}

interface AppDef {
  label: string;
  /** Words in the query that mean this application */
  q: RegExp;
  /** Text in a material's uses/summary/strengths that shows it is used this way */
  doc: RegExp;
}

const APPS: Record<string, AppDef> = {
  gear: { label: 'Gears & mechanisms', q: /\b(gears?|gearing|cogs?|sprockets?|cams?|mechanisms?|gearbox(es)?|worm wheels?)\b/, doc: /\bgears?\b|\bcams?\b|mechanism/ },
  bearing: {
    label: 'Bearings, bushings & wear parts',
    q: /\b(bearings?|bushings?|bushes|sliding|slides?|wear strips?|wear pads?|thrust washers?|low[- ]friction|self[- ]lubricat\w*)\b/,
    doc: /bearing|bushing|\bslides?\b|wear strip|thrust washer|low friction|lowest friction|self-lubricating/,
  },
  seal: { label: 'Seals, O-rings & gaskets', q: /\b(seals?|sealing|o[- ]?rings?|gaskets?|packings?|lip seals?|stoppers?|plungers?)\b/, doc: /seal|o-ring|gasket|stopper|plunger/ },
  tubing: { label: 'Tubing, hose & catheters', q: /\b(tub(e|es|ing)|hoses?|catheters?|fuel lines?|air lines?|balloons?)\b/, doc: /tubing|catheter|hose|\blines\b|balloon/ },
  housing: { label: 'Housings & enclosures', q: /\b(housings?|enclosures?|casings?|cases|covers?|shells?|bezels?|cabinets?)\b/, doc: /housing|enclosure|\bcovers?\b|bezel/ },
  snap: { label: 'Snap-fits, clips, springs & hinges', q: /\b(snap[- ]?fits?|snaps?|clips?|springs?|latch(es)?|living hinges?|hinges?)\b/, doc: /snap-fit|\bclips?\b|spring|hinge/ },
  optical: {
    label: 'Optics & clear parts',
    q: /\b(lens(es)?|optic\w*|light (guides?|pipes?)|windows?|cuvettes?|fluoresc\w*|autofluoresc\w*|imaging|transmission)\b/,
    doc: /\blens|optic|light guide|light pipe|\bwindows?\b(?! and door)|cuvette|autofluorescence|clarity/,
  },
  diagnostics: {
    label: 'Diagnostics & labware',
    q: /\b(microfluidic\w*|cartridges?|diagnostic\w*|assays?|pcr|labware|lab|pipettes?|microplates?|plates?|petri|cell culture|reagents?|vials?|syringes?|ivd)\b/,
    doc: /microfluidic|cartridge|diagnostic|assay|pcr|labware|pipette|microplate|petri|cell-culture|cell culture|reagent|\bvials?\b|syringe/,
  },
  electrical: {
    label: 'Electrical & connectors',
    q: /\b(connectors?|electrical|electronics?|insulat\w*|wires?|cables?|pcbs?|smt|reflow|dielectric|bobbins?|relays?)\b/,
    doc: /connector|electrical|insulation|\bwire\b|cable|dielectric|reflow|relay|bobbin/,
  },
  implant: { label: 'Implants & surgical', q: /\b(implants?|implantable|orthopa?edic|spinal|surgical|surgery|bone)\b/, doc: /implant|orthopedic|spinal|surgical|bone/ },
  fluid: {
    label: 'Pumps, valves & fluid handling',
    q: /\b(pumps?|valves?|impellers?|manifolds?|fittings?|pip(e|es|ing)|tanks?|fluid handling|flow)\b/,
    doc: /pump|valve|impeller|manifold|fitting|piping|\bpipe|tank|fluid/,
  },
  film: { label: 'Films, trays & packaging', q: /\b(films?|packaging|blisters?|trays?|bottles?|containers?|pouch(es)?|lidding)\b/, doc: /film|packaging|blister|tray|bottle|container|pouch|lidding/ },
  prototype: { label: 'Prototypes & fixtures', q: /\b(prototyp\w*|fixtures?|jigs?|mock[- ]?ups?)\b/, doc: /prototype|fixture/ },
  structural: {
    label: 'Structural brackets & frames',
    q: /\b(brackets?|frames?|structural|load[- ]bearing|metal replacement|chassis)\b/,
    doc: /bracket|frame|structural|metal replacement|metal-like/,
  },
  grip: { label: 'Grips & soft-touch', q: /\b(grips?|soft[- ]touch|handles?|overmold\w*|overmould\w*|wearables?|straps?)\b/, doc: /grip|soft-touch|overmold|wearable|strap|handle/ },
  membrane: { label: 'Membranes & filtration', q: /\b(membranes?|filters?|filtration|dialysis)\b/, doc: /membrane|filtration|dialysis/ },
  automotive: { label: 'Automotive & under-hood', q: /\b(automotive|under[- ]?hood|engine|coolant|car|vehicle)\b/, doc: /automotive|under-hood|under the hood|engine|coolant/ },
  aerospace: { label: 'Aerospace', q: /\b(aerospace|aircraft|space|satellite|avionics)\b/, doc: /aerospace|aircraft/ },
  semiconductor: { label: 'Semiconductor & high purity', q: /\b(semiconductor|wafers?|cleanroom|high[- ]purity|ultra[- ]?pure)\b/, doc: /semiconductor|wafer|high-purity|high purity|ultra-pure/ },
};

/** Per material, how strongly it fits each application: 1 = listed use, 0.6 = mentioned in summary/strengths. */
const APP_FIT: Record<string, number[]> = Object.fromEntries(
  Object.entries(APPS).map(([id, a]) => [
    id,
    POLYMERS.map((p) => {
      let fit = a.doc.test(lc(p.uses.join(' | '))) ? 1 : a.doc.test(lc([p.summary, ...p.strengths].join(' | '))) ? 0.6 : 0;
      // Optical parts must be see-through; seals are normally elastomers.
      if (id === 'optical' && p.transparency === 'opaque') fit = 0;
      if (id === 'optical' && p.transparency === 'translucent') fit *= 0.5;
      if (id === 'seal' && p.structure !== 'Elastomer') fit = Math.min(fit, 0.6);
      return fit;
    }),
  ]),
);

/* ───────────────────────────── Property preferences ───────────────────────────── */

interface PrefDef {
  label: string;
  q: RegExp;
  /** 0–1 per material */
  score: number[];
}

const pct = (get: (p: Polymer) => number | null, invert = false) =>
  percentiles(POLYMERS.map(get)).map((v) => (v === null ? 0 : invert ? 1 - v : v));
const textFlag = (re: RegExp) => POLYMERS.map((p) => (re.test(lc([p.summary, ...p.strengths].join(' '))) ? 1 : 0));
const meanChem = POLYMERS.map((p) => {
  const vals = Object.values(p.chem).map((r) => ({ E: 1, G: 0.7, F: 0.3, P: 0 })[r]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
});
const avgShrink = (p: Polymer) => (p.processing.shrinkPct ? (p.processing.shrinkPct[0] + p.processing.shrinkPct[1]) / 2 : null);
const P_ELONG = pct((p) => Math.log10(p.elongationPct));
const P_LOWSHRINK = pct(avgShrink, true);
const P_DRY = pct((p) => p.waterAbsPct, true);

// Strengths and uses only: summaries mix positives and negatives ("hydrolyzes in hot water").
const strengthsText = (p: Polymer) => lc([...p.strengths, ...p.uses].join(' | '));
const weakText = (p: Polymer) => lc([...p.limitations, ...p.watchOuts].join(' | '));
/** 1 if the material's strengths mention it, 0 if its limitations do, otherwise a neutral middle value. */
const textPref = (pos: RegExp, neg: RegExp | null, neutral = 0.35) =>
  POLYMERS.map((p) => (pos.test(strengthsText(p)) ? 1 : neg && neg.test(weakText(p)) ? 0 : neutral));

const PREFS: Record<string, PrefDef> = {
  stiff: { label: 'High stiffness', q: /\b(stiff\w*|rigid\w*|high[- ]modulus)\b/, score: pct((p) => p.modulusGPa) },
  strong: { label: 'High strength', q: /\b(strong|strength|high[- ]strength|load[- ]bearing)\b/, score: pct((p) => p.tensileMPa) },
  tough: {
    label: 'Tough / impact resistant',
    q: /\b(tough\w*|impact\w*|shatter\w*|unbreakable|ductile|drop[- ]?(test\w*|resist\w*)?)\b/,
    score: POLYMERS.map((p, i) => Math.max(P_ELONG[i], /impact|tough/.test(lc(p.strengths.join(' '))) ? 0.9 : 0)),
  },
  flexible: {
    label: 'Flexible / soft',
    q: /\b(flexib\w*|soft|bendable|compliant|elastic|rubbery|rubber|squeez\w*|elastomer\w*)\b/,
    score: POLYMERS.map((p) => (p.structure === 'Elastomer' ? 1 : p.modulusGPa === null ? 0.5 : p.modulusGPa <= 0.6 ? 0.85 : p.modulusGPa <= 1.6 ? 0.55 : p.modulusGPa <= 2.4 ? 0.2 : 0)),
  },
  light: { label: 'Lightweight', q: /\b(light[- ]?weight|lighter|low[- ]density|weight[- ]sav\w*)\b|\blight\b(?![- ]?(guide|pipe|transmission))/, score: pct((p) => p.density, true) },
  hot: {
    label: 'High temperature',
    q: /\b(high[- ]temp\w*|heat[- ]resist\w*|hot|elevated temp\w*|high heat|heat)\b/,
    score: pct((p) => p.contUseC),
  },
  friction: {
    label: 'Low friction / wear resistant',
    q: /\b(low[- ]friction|slippery|self[- ]lubricat\w*|wear[- ]resist\w*|abrasion[- ]resist\w*|wear|abrasion)\b/,
    score: textFlag(/friction|wear|abrasion|self-lubricating|slippery/),
  },
  creep: { label: 'Creep resistant', q: /\b(creep\w*|sustained load|long[- ]term load)\b/, score: pct((p) => p.hdtC ?? (p.structure === 'Elastomer' ? 0 : null)) },
  chemical: { label: 'Broad chemical resistance', q: /\b(chemical(ly)?[- ]resist\w*|chemicals?|inert|corrosive|harsh)\b/, score: meanChem },
  precise: {
    label: 'Precision / tight tolerances',
    q: /\b(tight tolerances?|precision|precise|dimensional(ly)?[- ]?(stab\w*|accura\w*)|tolerances?)\b/,
    score: POLYMERS.map((_, i) => (P_LOWSHRINK[i] + P_DRY[i]) / 2),
  },
  cheapPref: { label: 'Lower cost', q: /\b(cost[- ]effective|affordable|cheaper|lower cost)\b/, score: pct((p) => p.costTier, true) },
  // Set by parseQuery when two preferences combine into a ratio.
  stiffLight: { label: 'High stiffness-to-weight', q: /$^/, score: pct((p) => (p.modulusGPa === null ? null : p.modulusGPa / p.density)) },
  strongLight: { label: 'High strength-to-weight', q: /$^/, score: pct((p) => p.tensileMPa / p.density) },
  cold: {
    label: 'Low-temperature toughness',
    q: /\b(cold|low[- ]temp\w*|cryogenic\w*|freez\w*|sub[- ]zero|arctic|winter)\b/,
    score: POLYMERS.map((p) =>
      /low temperature|cryogenic|cold/.test(strengthsText(p)) ? 1 : /low temperature|in the cold|cold service|stiffens below|brittle at low|near 0 °c/.test(weakText(p)) ? 0 : p.structure === 'Elastomer' && (p.tgC ?? 0) < -40 ? 0.8 : 0.4,
    ),
  },
  fatigue: { label: 'Fatigue resistant', q: /\b(fatigue|cyclic load\w*|repeated load\w*|flex life|vibration)\b/, score: textPref(/fatigue|flex-fatigue/, null, 0.3) },
  insulating: {
    label: 'Electrical insulation',
    q: /\b(electrical(ly)? insulat\w*|insulat\w*|dielectric|non[- ]?conductive)\b/,
    score: POLYMERS.map((p) => (/conductive/.test(lc(p.limitations.join(' '))) ? 0 : /dielectric|electrical|insulation|connector/.test(strengthsText(p)) ? 1 : 0.5)),
  },
  conductive: {
    label: 'Electrically conductive / ESD',
    q: /\b(conductive|esd|anti[- ]?static|static[- ]dissipat\w*)\b/,
    score: POLYMERS.map((p) => (/(?<!non-)conductive/.test(lc([...p.strengths, ...p.limitations].join(' '))) ? 1 : 0)),
  },
  vacuum: { label: 'Low outgassing / high purity', q: /\b(outgass\w*|vacuum|clean ?room|purity|leachables?|extractables?)\b/, score: textPref(/outgassing|vacuum|purity|high-purity|ultra-pure/, null, 0.2) },
  bondable: {
    label: 'Easy to bond, paint or print',
    q: /\b(bond\w*|glu(e|ed|ing)|adhesives?|paint\w*|print(ing|able)? on|pad print\w*|decorat\w*|label\w*)\b/,
    score: textPref(/bonds well|paints|glues|plates well|printable|solvent-weldable|solvent bonding/, /hard to bond|difficult to bond|bonding requires|impossible to glue|needs chemical etching|surface treatment|barely stick|can't be glued|hard to glue/, 0.4),
  },
  hotWater: {
    label: 'Hot water / hydrolysis resistant',
    q: /\b(hot water|hydroly\w*|boiling|dishwasher|wet heat|damp heat|humid heat)\b/,
    score: textPref(/hot water|hydrolytic(ally)? stab|hydrolysis resist|steam/, /hydroly/, 0.4),
  },
  green: { label: 'Bio-based / recyclable', q: /\b(sustainab\w*|bio[- ]?based|recycl\w*|compostable|green|eco)\b/, score: textPref(/bio-based|compostable|recyclable/, null, 0.1) },
};

const PROP_PCT: Record<NumericProp, number[]> = {
  tensileMPa: pct((p) => p.tensileMPa),
  modulusGPa: pct((p) => p.modulusGPa),
  density: pct((p) => p.density),
  elongationPct: pct((p) => p.elongationPct),
  hdtC: pct((p) => p.hdtC),
  waterAbsPct: pct((p) => p.waterAbsPct),
};

/* ───────────────────────────── Spelling correction ───────────────────────────── */

const STOP = new Set(
  'a an and are as at be but by for from has have i in is it its me my need needs of on or our part parts that the this to under use used want we with should must can material materials plastic plastics polymer polymers resin something good best low high very which what where will would like make made also than then into over about'.split(
    ' ',
  ),
);

function tokenize(s: string): string[] {
  return lc(s)
    .replace(/[^a-z0-9/+\- ]+/g, ' ')
    .split(/[\s/]+/)
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t));
}

const EXTRA_VOCAB =
  'gear gears bearing bearings bushing bushings seal seals sealing gasket gaskets oring o-ring tubing catheter catheters housing housings enclosure enclosures snap clip clips spring springs hinge hinges lens lenses optical optics autofluorescence fluorescence microfluidic cartridge cartridges diagnostic diagnostics assay labware connector connectors electrical implant implants surgical pump pumps valve valves manifold fitting fittings film films packaging blister tray trays bottle bottles prototype prototypes fixture fixtures bracket brackets structural grip grips overmold overmolded membrane membranes filtration automotive aerospace semiconductor stiff stiffness rigid strong strength tough toughness impact flexible soft lightweight density temperature friction wear abrasion creep chemical chemicals precision tolerance tolerances transparent autoclave autoclavable sterilization sterilized gamma ethylene oxide bleach disinfectant disinfectants alcohol acetone solvent solvents flame retardant moisture injection molded molding machined machining printing tensile modulus elongation'.split(
    ' ',
  );

const VOCAB: string[] = (() => {
  const set = new Set<string>(EXTRA_VOCAB);
  for (const p of POLYMERS) {
    for (const w of lc([polymerKeywordText(p), p.name, p.abbr, ...p.aka].join(' ')).split(/[^a-z0-9-]+/)) if (w.length >= 4) set.add(w);
  }
  return [...set];
})();
const VOCAB_SET = new Set(VOCAB);

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Correct unknown words against the dataset vocabulary. */
function correctSpelling(query: string): { text: string; corrections: [string, string][] } {
  const corrections: [string, string][] = [];
  const text = query.replace(/[A-Za-z][A-Za-z-]{3,}/g, (word) => {
    const w = lc(word);
    if (VOCAB_SET.has(w) || STOP.has(w) || VOCAB_SET.has(w.replace(/s$/, ''))) return word;
    const max = w.length >= 9 ? 2 : w.length >= 5 ? 1 : 0;
    if (max === 0) return word;
    let best: string | null = null;
    let bestD = max + 1;
    for (const v of VOCAB) {
      const d = editDistance(w, v, max);
      if (d < bestD) {
        best = v;
        bestD = d;
        if (d === 1 && max === 1) break;
      }
    }
    if (best && bestD <= max) {
      corrections.push([word, best]);
      return best;
    }
    return word;
  });
  return { text, corrections };
}

/* ───────────────────────────── Keyword scoring ───────────────────────────── */

const DOC_TOKENS: Set<string>[] = POLYMERS.map((p) => new Set(tokenize(polymerKeywordText(p))));
const IDF = (() => {
  const df = new Map<string, number>();
  for (const set of DOC_TOKENS) for (const t of set) df.set(t, (df.get(t) ?? 0) + 1);
  const n = DOC_TOKENS.length;
  const idf = new Map<string, number>();
  // Words in most documents carry almost no signal.
  for (const [t, d] of df) idf.set(t, d > n * 0.4 ? 0 : Math.log(1 + n / d));
  return idf;
})();
const NAME_TOKENS: Set<string>[] = POLYMERS.map((p) => new Set(tokenize([p.abbr, p.name, ...p.aka].join(' '))));

/** Keyword relevance per material, normalized so the best match = 1 (all 0 when nothing matches). */
export function keywordScores(query: string): number[] {
  const qt = [...new Set(tokenize(query))];
  const raw = POLYMERS.map((_, i) => {
    let s = 0;
    for (const t of qt) {
      if (DOC_TOKENS[i].has(t)) s += IDF.get(t) ?? 0;
      if (NAME_TOKENS[i].has(t)) s += 6; // direct name / trade-name hit
    }
    return s;
  });
  const max = Math.max(...raw);
  return raw.map((s) => (max > 0 ? s / max : 0));
}

/* ───────────────────────────── Query understanding ───────────────────────────── */

export interface ParsedQuery {
  original: string;
  /** Query after spelling correction (what everything below was parsed from) */
  text: string;
  /** Text left for keyword matching once property and requirement words are removed (they are scored from data instead) */
  keywordText: string;
  corrections: [string, string][];
  constraints: Constraint[];
  signals: Signal[];
}

export function parseQuery(query: string): ParsedQuery {
  const { text, corrections } = correctSpelling(query.trim());
  const q = lc(text);
  const constraints = parseConstraints(q);
  const signals: Signal[] = [];
  for (const [id, a] of Object.entries(APPS)) if (a.q.test(q)) signals.push({ id: `app-${id}`, kind: 'app', label: a.label });
  for (const [id, p] of Object.entries(PREFS)) {
    // Don't double-count a numeric limit as a preference ("tensile > 100 MPa" is a requirement).
    if ((id === 'strong' && constraints.some((c) => c.prop === 'tensileMPa')) || (id === 'stiff' && constraints.some((c) => c.prop === 'modulusGPa'))) continue;
    if (id === 'hot' && constraints.some((c) => c.kind === 'temp')) continue;
    if (p.q.test(q)) signals.push({ id: `pref-${id}`, kind: 'pref', label: p.label });
  }
  // "stiff + lightweight" means specific stiffness, not the average of the two.
  const has = (id: string) => signals.some((x) => x.id === `pref-${id}`);
  for (const [a, combo] of [['stiff', 'stiffLight'], ['strong', 'strongLight']] as const) {
    if (has(a) && has('light')) {
      const keep = signals.filter((x) => x.id !== `pref-${a}` && x.id !== 'pref-light');
      signals.length = 0;
      signals.push(...keep, { id: `pref-${combo}`, kind: 'pref', label: PREFS[combo].label });
    }
  }
  let keywordText = q;
  const strip = (re: RegExp) => (keywordText = keywordText.replace(new RegExp(re.source, 'gi'), ' '));
  for (const [id, p] of Object.entries(PREFS)) if (signals.some((x) => x.id === `pref-${id}`) || id === 'stiff' || id === 'light' || id === 'strong') strip(p.q);
  for (const p of SIMPLE_PATTERNS) strip(p.re);
  for (const c of CHEM_PATTERNS) strip(c.re);
  keywordText = keywordText.replace(/\d+(\.\d+)?\s*(°|º)?\s*(c|f|mpa|gpa|psi|ksi|%|g\/cm3|g\/cc)?\b/gi, ' ').replace(/\s+/g, ' ').trim();
  return { original: query.trim(), text, keywordText, corrections, constraints, signals };
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
  score: number;
  relevance: number; // 0–1 relative to the best hit, for display
  checks: Check[];
  warnings: number;
  /** Short reasons this material ranked where it did */
  why: string[];
}

export interface Ranking {
  /** Strong matches for what was asked */
  best: Result[];
  /** Pass every requirement but match the description less well */
  others: Result[];
  /** Fail at least one requirement */
  excluded: Result[];
  /** How the order was decided */
  mode: 'understood' | 'semantic' | 'requirements';
}

const W = { app: 1.0, pref: 1.0, kw: 0.9, sem: 0.3, clean: 0.5, limit: 0.4, warn: 0.35 };

export function rank(
  parsed: ParsedQuery,
  disabled: Set<string>,
  kw: number[],
  sem: number[] | null,
): Ranking {
  const constraints = parsed.constraints.filter((c) => !disabled.has(c.id));
  const apps = parsed.signals.filter((s) => s.kind === 'app' && !disabled.has(s.id)).map((s) => s.id.slice(4));
  const prefs = parsed.signals.filter((s) => s.kind === 'pref' && !disabled.has(s.id)).map((s) => s.id.slice(5));
  const anyKw = kw.some((v) => v > 0);
  // Keyword hits alone count as "understood" only when there are no requirements;
  // otherwise words like "tensile" in "tensile > 100 MPa" would be double-counted.
  const understood = apps.length > 0 || prefs.length > 0 || (anyKw && constraints.length === 0);
  const propLimits = constraints.filter((c) => c.kind === 'prop');

  let semNorm: number[] | null = null;
  if (sem) {
    const lo = Math.min(...sem);
    const hi = Math.max(...sem);
    semNorm = sem.map((v) => (hi > lo ? (v - lo) / (hi - lo) : 0));
  }

  const scored: Result[] = POLYMERS.map((p, i) => {
    const why: string[] = [];
    const appScore = apps.length ? apps.reduce((a, id) => a + APP_FIT[id][i], 0) / apps.length : 0;
    for (const id of apps) if (APP_FIT[id][i] === 1) why.push(`Used for ${lc(APPS[id].label)}`);
    const prefScore = prefs.length ? prefs.reduce((a, id) => a + PREFS[id].score[i], 0) / prefs.length : 0;
    for (const id of prefs) if (PREFS[id].score[i] >= 0.75) why.push(PREFS[id].label);
    const checks = constraints.map((c) => checkConstraint(p, c));
    const warnings = checks.filter((c) => c.status === 'warn').length;
    const clean = checks.length ? checks.reduce((a, c) => a + (c.status === 'pass' ? (c.grade ?? 1) : 0), 0) / checks.length : 0;
    // Further past a numeric limit is better ("tensile > 100" → strongest first).
    const limitBonus = propLimits.length
      ? propLimits.reduce((a, c) => a + (c.op === '>=' ? PROP_PCT[c.prop!][i] : 1 - PROP_PCT[c.prop!][i]), 0) / propLimits.length
      : 0;
    const score =
      W.app * appScore +
      W.pref * prefScore +
      W.kw * kw[i] +
      W.clean * clean +
      W.limit * limitBonus +
      (semNorm ? (understood ? W.sem : 1) * semNorm[i] : 0) -
      W.warn * warnings;
    return { polymer: p, score, relevance: 0, checks, warnings, why };
  });

  const passing = scored.filter((r) => !r.checks.some((c) => c.status === 'fail')).sort((a, b) => b.score - a.score);
  const excluded = scored.filter((r) => r.checks.some((c) => c.status === 'fail')).sort((a, b) => b.score - a.score);

  const top = passing[0]?.score ?? 0;
  for (const r of [...passing, ...excluded]) r.relevance = top > 0 ? Math.max(0, Math.min(1, r.score / top)) : 0;

  let best: Result[];
  let mode: Ranking['mode'];
  if (understood) {
    mode = 'understood';
    best = passing.filter((r, i) => {
      const i0 = POLYMERS.indexOf(r.polymer);
      const hasSignal =
        apps.some((id) => APP_FIT[id][i0] > 0) ||
        prefs.some((id) => PREFS[id].score[i0] >= 0.5) ||
        kw[i0] > 0 ||
        (constraints.length > 0 && r.warnings === 0);
      return hasSignal && r.score >= top * 0.5 && i < 15;
    });
  } else if (semNorm) {
    mode = 'semantic';
    best = passing.slice(0, 8);
  } else {
    mode = 'requirements';
    best = constraints.length ? passing : [];
  }
  const bestSet = new Set(best);
  const others = passing.filter((r) => !bestSet.has(r));
  return { best, others, excluded, mode };
}
