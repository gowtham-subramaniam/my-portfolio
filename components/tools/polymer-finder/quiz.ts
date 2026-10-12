/**
 * Knowledge check: short quizzes generated only from values verified against
 * the material's reference datasheet (refs.ts), so every answer can be traced
 * to the linked document. Questions are skipped when the datasheet doesn't
 * give the value or when the answer wouldn't be unambiguous.
 */

import { POLYMERS, type Polymer } from "./polymers";
import { REFS } from "./refs";
import { isVerified, valueText, type VKey } from "./verified";

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
}

/** Small deterministic PRNG so the option order is stable between renders and server/client. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

function shuffle<T>(items: T[], seed: string): T[] {
  const rnd = seeded(seed);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Distractors from other materials' verified values: at least `gap` (relative) apart from the answer and each other. */
function distractors(p: Polymer, key: VKey, rel: number, n: number): number[] | null {
  const value = (p as unknown as Record<string, number>)[key];
  const pool = POLYMERS.filter((o) => o.id !== p.id && isVerified(o, key) && !(o.verified?.[key] ?? "").includes("–")).map(
    (o) => (o as unknown as Record<string, number>)[key],
  );
  const far = (a: number, b: number) => Math.abs(a - b) >= rel * Math.max(Math.abs(a), Math.abs(b));
  const uniq = [...new Set(pool)].filter((v) => far(v, value)).sort((a, b) => Math.abs(a - value) - Math.abs(b - value));
  const out: number[] = [];
  for (const v of uniq) {
    if (out.every((o) => far(o, v))) out.push(v);
    if (out.length === n) return out;
  }
  return null;
}

function numberQuestion(p: Polymer, key: VKey, unit: string, prompt: string, rel: number): QuizQuestion | null {
  const text = p.verified?.[key];
  if (!text || text.includes("–") || text.startsWith(">")) return null; // only single, exact published values
  const wrong = distractors(p, key, rel, 3);
  if (!wrong) return null;
  const r = REFS[p.id];
  const correct = valueText(p, key, unit);
  const fmt = (v: number) => `${v}${unit === "%" ? " %" : ` ${unit}`}`;
  const options = shuffle([correct, ...wrong.map(fmt)], `${p.id}-${key}`);
  return {
    id: `${p.id}-${key}`,
    prompt,
    options,
    answer: options.indexOf(correct),
    explanation: `${correct}, from ${r.src.label} (${r.grade}). The other options are published values for other materials.`,
  };
}

export function quizFor(p: Polymer): QuizQuestion[] {
  const qs: QuizQuestion[] = [];
  const r = REFS[p.id];
  if (!r) return qs;
  const g = r.kind === "stock" ? `${p.abbr} (stock shapes)` : r.grade;
  const push = (q: QuizQuestion | null) => q && qs.push(q);

  push(numberQuestion(p, "hdtC", "°C", `What is the heat deflection temperature (1.8 MPa) of ${g}?`, 0.15));
  push(numberQuestion(p, "tensileMPa", "MPa", `What tensile ${r.tensile?.what === "yield" ? "yield stress" : r.tensile?.what === "break" ? "stress at break" : "strength"} is published for ${g}?`, 0.2));
  push(numberQuestion(p, "elongationPct", "%", `How far does ${g} stretch before breaking (elongation at break)?`, 0.4));
  push(numberQuestion(p, isVerified(p, "tmC") ? "tmC" : "tgC", "°C", `What is the ${isVerified(p, "tmC") ? "melting temperature (Tm)" : "glass transition temperature (Tg)"} of ${g}?`, 0.1));

  if (isVerified(p, "density")) {
    const floats = p.density < 1;
    const options = ["Yes", "No"];
    qs.push({
      id: `${p.id}-float`,
      prompt: `Does ${g} float in water?`,
      options,
      answer: floats ? 0 : 1,
      explanation: `${floats ? "Yes" : "No"}: its published density is ${valueText(p, "density", "g/cm³")}, ${floats ? "below" : "above"} water's 1.0 g/cm³ (${r.src.label}).`,
    });
  }
  if (isVerified(p, "tmC") && p.structure === "Semi-crystalline") {
    qs.push({
      id: `${p.id}-struct`,
      prompt: `${g} has a melting temperature of ${valueText(p, "tmC", "°C")}. Is it amorphous or semi-crystalline?`,
      options: ["Amorphous", "Semi-crystalline"],
      answer: 1,
      explanation: "Semi-crystalline: only polymers with crystalline regions have a melting temperature. Amorphous polymers soften above Tg instead.",
    });
  }
  return qs;
}
