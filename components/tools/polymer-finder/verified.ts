/**
 * Applies the reference-grade datasheet values (refs.ts) to the material
 * cards and records which card values are verified.
 *
 * Ranges (from stock-shape sheets) are shown as published; for searching and
 * requirement checks the lower end is used, which is the conservative choice.
 */

import type { Polymer } from "./polymers";
import { REFS, fmtVal, lo, type Field } from "./refs";

export type VKey = "density" | "tensileMPa" | "modulusGPa" | "elongationPct" | "hdtC" | "tgC" | "tmC" | "waterAbsPct" | "contUseC" | "ul94" | "hardness";

export function applyRefs(list: Polymer[]) {
  for (const p of list) {
    const r = REFS[p.id];
    if (!r) continue;
    const t: Partial<Record<VKey, string>> = {};
    const num = (key: VKey, f: Field | undefined, unit: string, scale = 1) => {
      if (!f) return;
      const r4 = (x: number) => (scale === 1 ? x : Number((x * scale).toPrecision(4)));
      (p as unknown as Record<string, number>)[key] = r4(lo(f.v));
      const shown = Array.isArray(f.v) ? ([r4(f.v[0]), r4(f.v[1])] as [number, number]) : r4(f.v);
      t[key] = fmtVal(shown, unit, f.atLeast);
    };
    num("density", r.density, "g/cm³");
    num("tensileMPa", r.tensile, "MPa");
    if (p.modulusGPa !== null) num("modulusGPa", r.modulus, "GPa", 0.001);
    num("elongationPct", r.elongation, "%");
    num("hdtC", r.hdt, "°C");
    num("tgC", r.tg, "°C");
    num("tmC", r.tm, "°C");
    num("waterAbsPct", r.water24h, "%");
    num("contUseC", r.contUse, "°C");
    if (r.ul94) {
      p.ul94 = r.ul94.v;
      t.ul94 = r.ul94.v;
    }
    if (r.hardness) {
      p.hardness = r.hardness.v;
      t.hardness = r.hardness.v;
    }
    p.verified = t;
  }
}

export function isVerified(p: Polymer, key: VKey) {
  return Boolean(p.verified?.[key]);
}

/** Display text for a card value; verified values use the datasheet's own form (ranges, "> x"). */
export function valueText(p: Polymer, key: VKey, unit: string): string {
  const t = p.verified?.[key];
  if (t) return t;
  const raw = (p as unknown as Record<string, unknown>)[key];
  if (raw === null || raw === undefined) return "—";
  return unit ? `${raw}${unit === "%" ? " %" : ` ${unit}`}` : String(raw);
}

export function verifiedCount(p: Polymer) {
  return Object.keys(p.verified ?? {}).length;
}
