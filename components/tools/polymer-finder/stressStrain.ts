/**
 * Idealized tensile stress–strain curves built from three datasheet values:
 * tensile modulus, tensile strength and elongation at break.
 *
 * These are NOT measured curves. They show where each material starts (slope =
 * modulus), how strong it gets (tensile strength) and how far it stretches
 * before breaking (elongation), which is what the datasheet actually tells you.
 * Yield drops, necking and strain hardening of real curves are not modeled.
 */

import type { Polymer } from "./polymers";

export type CurveKind = "ductile" | "brittle" | "linear" | "elastomer";

export interface CurveModel {
  kind: CurveKind;
  /** Tensile strength, MPa (end point of the curve) */
  sigma: number;
  /** Strain at break as a fraction (0.05 = 5%) */
  epsB: number;
  /** Modulus in MPa (thermoplastics only) */
  E: number | null;
  /** Shape constant for the saturating curve, strain fraction */
  c: number;
}

/**
 * Thermoplastics: sigma(eps) = E·c·(1 − exp(−eps/c)), with c chosen so the
 * curve starts at slope E and passes exactly through (elongation, tensile
 * strength). Ductile materials saturate early and draw a plateau to break;
 * brittle ones break while still rising.
 *
 * Elastomers (no modulus in the data): a typical rubber S-shape that ends at
 * (elongation, tensile strength). The shape is schematic.
 */
export function curveModel(p: Polymer): CurveModel {
  const sigma = p.tensileMPa;
  const epsB = p.elongationPct / 100;
  if (p.modulusGPa === null) return { kind: "elastomer", sigma, epsB, E: null, c: 0 };

  const E = p.modulusGPa * 1000;
  // A straight line from the origin to break is the best we can do when the
  // data leave no room for curvature (strength ≥ modulus × strain).
  if (sigma >= 0.98 * E * epsB) return { kind: "linear", sigma, epsB, E, c: 0 };

  // g(c) = E·c·(1 − e^(−epsB/c)) rises monotonically from 0 toward E·epsB.
  const g = (c: number) => E * c * (1 - Math.exp(-epsB / c)) - sigma;
  let lo = 1e-9;
  let hi = epsB * 1e4;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (g(mid) > 0) hi = mid;
    else lo = mid;
  }
  const c = (lo + hi) / 2;
  // Saturated well before break (> 95% of strength reached by ~1/3 of the strain) = ductile plateau.
  const kind: CurveKind = 1 - Math.exp(-epsB / 3 / c) > 0.95 ? "ductile" : "brittle";
  return { kind, sigma, epsB, E, c };
}

const RUBBER_A = 0.45;
const RUBBER_B = 0.15;
const rubberNorm = RUBBER_A * (1 - Math.exp(-1 / RUBBER_B)) + (1 - RUBBER_A);

/** Stress (MPa) at strain eps (fraction); null beyond break. */
export function stressAt(m: CurveModel, eps: number): number | null {
  if (eps < 0 || eps > m.epsB * (1 + 1e-9)) return null;
  switch (m.kind) {
    case "linear":
      return (m.sigma * eps) / m.epsB;
    case "elastomer": {
      const x = eps / m.epsB;
      return (m.sigma * (RUBBER_A * (1 - Math.exp(-x / RUBBER_B)) + (1 - RUBBER_A) * x ** 3)) / rubberNorm;
    }
    default:
      return (m.E as number) * m.c * (1 - Math.exp(-eps / m.c));
  }
}

/** Sample points along the curve; denser near the origin where the slope changes fastest. */
export function sampleCurve(m: CurveModel, from: number, n = 160): [number, number][] {
  const pts: [number, number][] = [];
  const start = Math.max(0, Math.min(from, m.epsB));
  if (start > 0) {
    // Log spacing from `start` (for log strain axes)
    const a = Math.log(start);
    const b = Math.log(m.epsB);
    for (let i = 0; i <= n; i++) {
      const e = Math.exp(a + ((b - a) * i) / n);
      pts.push([e, stressAt(m, e) as number]);
    }
  } else {
    for (let i = 0; i <= n; i++) {
      const e = m.epsB * (i / n) ** 2;
      pts.push([e, stressAt(m, e) as number]);
    }
  }
  return pts;
}

export const KIND_TEXT: Record<CurveKind, string> = {
  ductile: "Yields and draws to break (plateau at tensile strength)",
  brittle: "Breaks before yielding",
  linear: "Near-linear to break",
  elastomer: "Rubber-like (schematic shape)",
};
