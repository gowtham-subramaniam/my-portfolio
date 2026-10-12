"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Polymer } from "./polymers";
import type { ChartLimit } from "./search";

/* ───────────────────────────── Axes ───────────────────────────── */

export type AxisKey = "contUseC" | "hdtC" | "tensileMPa" | "modulusGPa" | "density" | "elongationPct" | "waterAbsPct" | "costTier";

interface AxisDef {
  label: string;
  short: string;
  unit: string;
  log: boolean;
  get: (p: Polymer) => number | null;
}

const AXES: Record<AxisKey, AxisDef> = {
  contUseC: { label: "Max continuous use temperature", short: "Cont. use", unit: "°C", log: false, get: (p) => p.contUseC },
  hdtC: { label: "HDT @ 1.8 MPa", short: "HDT", unit: "°C", log: false, get: (p) => p.hdtC },
  tensileMPa: { label: "Tensile strength", short: "Tensile", unit: "MPa", log: true, get: (p) => p.tensileMPa },
  modulusGPa: { label: "Tensile modulus", short: "Modulus", unit: "GPa", log: true, get: (p) => p.modulusGPa },
  density: { label: "Density", short: "Density", unit: "g/cm³", log: false, get: (p) => p.density },
  elongationPct: { label: "Elongation at break", short: "Elongation", unit: "%", log: true, get: (p) => p.elongationPct },
  waterAbsPct: { label: "Water absorption (24 h)", short: "Water abs.", unit: "%", log: true, get: (p) => Math.max(p.waterAbsPct, 0.01) },
  costTier: { label: "Relative cost (1 = $, 5 = $$$$$)", short: "Cost", unit: "", log: false, get: (p) => p.costTier },
};

const AXIS_ORDER: AxisKey[] = ["contUseC", "hdtC", "tensileMPa", "modulusGPa", "density", "elongationPct", "waterAbsPct", "costTier"];

/* ───────────────────────────── Scales ───────────────────────────── */

function niceLinearTicks(min: number, max: number, count = 6): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) out.push(Number(v.toPrecision(10)));
  return out;
}

function logTicks(min: number, max: number): number[] {
  const out: number[] = [];
  const lo = Math.floor(Math.log10(min));
  const hi = Math.ceil(Math.log10(max));
  for (let e = lo; e <= hi; e++) for (const m of [1, 2, 5]) out.push(Number((m * Math.pow(10, e)).toPrecision(6)));
  const first = [...out].reverse().find((t) => t <= min) ?? out[0];
  const last = out.find((t) => t >= max) ?? out[out.length - 1];
  return out.filter((t) => t >= first && t <= last);
}

function makeScale(values: number[], log: boolean, r0: number, r1: number) {
  const vmin = Math.min(...values);
  const vmax = Math.max(...values);
  const ticks = log ? logTicks(vmin, vmax) : niceLinearTicks(vmin, vmax);
  const d0 = ticks[0];
  const d1 = ticks[ticks.length - 1];
  const f = log
    ? (v: number) => r0 + ((Math.log10(v) - Math.log10(d0)) / (Math.log10(d1) - Math.log10(d0) || 1)) * (r1 - r0)
    : (v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
  return { f, ticks };
}

function fmtTick(v: number) {
  if (v >= 1000) return `${v / 1000}k`;
  return String(v);
}

/* ───────────────────────────── Chart ───────────────────────────── */

export type PointStatus = "candidate" | "other" | "excluded" | "neutral";


const COLOR = {
  main: "#2563a8", // site accent: candidates / all materials
  compare: "#eb6834", // validated against #2563a8 (CVD ΔE 22, normal ΔE 34)
  excluded: "#b8b0a8",
  surface: "#f0ede8", // card background, used for the 2px ring
};

export default function PropertyChart({
  polymers,
  status,
  compareIds,
  labelIds,
  onSelect,
  initialX = "contUseC",
  initialY = "tensileMPa",
  limits = [],
}: {
  polymers: Polymer[];
  status: Record<string, PointStatus>;
  compareIds: string[];
  /** Points to label directly (in addition to compared ones) */
  labelIds: string[];
  onSelect: (id: string) => void;
  /** Axes to start on (the parent remounts the chart when the search focus changes) */
  initialX?: AxisKey;
  initialY?: AxisKey;
  /** Numeric requirements from the search, drawn as threshold lines */
  limits?: ChartLimit[];
}) {
  const [xKey, setXKey] = useState<AxisKey>(initialX);
  const [yKey, setYKey] = useState<AxisKey>(initialY);
  const [showExcluded, setShowExcluded] = useState(true);
  const [hover, setHover] = useState<{ id: string; left: number; top: number; flip: boolean } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Draw at the container's real pixel width so text stays 12px on phones.
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = W < 520;
  const H = narrow ? Math.round(W * 0.95) : Math.round(Math.min(460, W * 0.6));
  const M = narrow ? { top: 22, right: 12, bottom: 48, left: 40 } : { top: 16, right: 20, bottom: 52, left: 60 };

  const X = AXES[xKey];
  const Y = AXES[yKey];
  const hasExcluded = Object.values(status).includes("excluded");
  const hasOther = Object.values(status).includes("other");

  const data = useMemo(() => {
    const pts = polymers
      .map((p) => ({ p, x: X.get(p), y: Y.get(p), s: status[p.id] ?? "neutral" }))
      .filter((d): d is { p: Polymer; x: number; y: number; s: PointStatus } => d.x !== null && d.y !== null);
    return { pts, missing: polymers.length - pts.length };
  }, [polymers, X, Y, status]);

  const visible = data.pts.filter((d) => showExcluded || d.s !== "excluded");
  const scaleBasis = data.pts.length ? data.pts : [{ x: 1, y: 1 }];
  const xLimits = limits.filter((l) => l.axis === xKey);
  const yLimits = limits.filter((l) => l.axis === yKey);
  // Keep every limit line inside the plotted range.
  const xs = makeScale([...scaleBasis.map((d) => d.x), ...xLimits.map((l) => l.value)], X.log, M.left, W - M.right);
  const ys = makeScale([...scaleBasis.map((d) => d.y), ...yLimits.map((l) => l.value)], Y.log, H - M.bottom, M.top);
  const plotted = new Set([xKey, yKey]);
  const offChart = limits.filter((l) => !plotted.has(l.axis));

  // Draw order: excluded under, then main, then compared on top.
  const rank = (d: { p: Polymer; s: PointStatus }) => (compareIds.includes(d.p.id) ? 4 : d.s === "excluded" ? 1 : d.s === "other" ? 2 : 3);

  // Pixel positions, nudging points that land on top of each other (identical
  // typical values are common) so every material stays visible and clickable.
  const placed: { d: (typeof visible)[number]; cx: number; cy: number }[] = [];
  for (const d of [...visible].sort((a, b) => a.p.id.localeCompare(b.p.id))) {
    let cx = xs.f(d.x);
    let cy = ys.f(d.y);
    for (let k = 1; k < 12 && placed.some((q) => Math.hypot(q.cx - cx, q.cy - cy) < 9); k++) {
      const a = k * 2.4; // golden-angle-ish spiral
      cx = xs.f(d.x) + Math.cos(a) * 9 * Math.ceil(k / 6);
      cy = ys.f(d.y) + Math.sin(a) * 9 * Math.ceil(k / 6);
    }
    placed.push({ d, cx, cy });
  }
  const pos = new Map(placed.map((q) => [q.d.p.id, q]));
  const ordered = [...visible].sort((a, b) => rank(a) - rank(b));
  const labelSet = new Set([...compareIds, ...labelIds]);

  const hovered = hover ? data.pts.find((d) => d.p.id === hover.id) : null;

  const showHover = (id: string, cx: number, cy: number) => {
    setHover({ id, left: cx, top: cy, flip: cx > W * 0.55 });
  };

  const select = (cls: string) =>
    `rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[13px] text-[var(--foreground)] ${cls}`;

  const legend: { key: string; label: string; swatch: ReactNode }[] = [];
  const mainLabel = hasOther ? "Best match" : hasExcluded ? "Meets your requirements" : "Material";
  if (compareIds.length > 0 || hasExcluded || hasOther) {
    legend.push({ key: "m", label: mainLabel, swatch: <circle cx={6} cy={6} r={5} fill={COLOR.main} /> });
    if (hasOther)
      legend.push({ key: "o", label: "Other materials", swatch: <circle cx={6} cy={6} r={4} fill="none" stroke={COLOR.main} strokeOpacity={0.55} strokeWidth={2} /> });
    if (hasExcluded && showExcluded)
      legend.push({ key: "e", label: "Excluded", swatch: <circle cx={6} cy={6} r={4} fill="none" stroke={COLOR.excluded} strokeWidth={2} /> });
    if (compareIds.length > 0) legend.push({ key: "c", label: "Comparing", swatch: <circle cx={6} cy={6} r={5} fill={COLOR.compare} /> });
  }

  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5">
      {/* Controls: one row above the chart */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--muted)]">
        <label className="flex items-center gap-2">
          Y
          <select value={yKey} onChange={(e) => setYKey(e.target.value as AxisKey)} className={select("")}>
            {AXIS_ORDER.map((k) => (
              <option key={k} value={k} disabled={k === xKey}>
                {AXES[k].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          X
          <select value={xKey} onChange={(e) => setXKey(e.target.value as AxisKey)} className={select("")}>
            {AXIS_ORDER.map((k) => (
              <option key={k} value={k} disabled={k === yKey}>
                {AXES[k].label}
              </option>
            ))}
          </select>
        </label>
        {hasExcluded && (
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={showExcluded} onChange={(e) => setShowExcluded(e.target.checked)} className="h-[14px] w-[14px] accent-[#2563a8]" />
            Show excluded
          </label>
        )}
      </div>

      {legend.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]" aria-hidden>
          {legend.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5">
              <svg width={12} height={12}>{l.swatch}</svg>
              {l.label}
            </span>
          ))}
        </div>
      )}

      <div ref={wrapRef} className="relative" onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="block max-w-full select-none"
          role="img"
          aria-label={`${Y.label} versus ${X.label} for ${visible.length} polymers. The list below has the same data.`}
        >
          {narrow && (
            <text x={M.left + 4} y={11} fontSize={11} fill="var(--subtle)">
              {Y.short}
              {Y.unit && ` (${Y.unit})`}
            </text>
          )}
          {/* Grid + ticks */}
          {ys.ticks.map((t) => (
            <g key={`y${t}`}>
              <line x1={M.left} x2={W - M.right} y1={ys.f(t)} y2={ys.f(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={M.left - 8} y={ys.f(t)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--subtle)">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          {xs.ticks.map((t) => (
            <g key={`x${t}`}>
              <line x1={xs.f(t)} x2={xs.f(t)} y1={M.top} y2={H - M.bottom} stroke="var(--border)" strokeWidth={1} strokeOpacity={0.6} />
              <text x={xs.f(t)} y={H - M.bottom + 18} textAnchor="middle" fontSize={12} fill="var(--subtle)">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          <text x={(M.left + W - M.right) / 2} y={H - 10} textAnchor="middle" fontSize={13} fill="var(--muted)">
            {X.label}
            {X.unit && ` (${X.unit})`}
            {X.log && " · log scale"}
          </text>
          {!narrow && (
            <text transform={`translate(16 ${(M.top + H - M.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={13} fill="var(--muted)">
              {Y.label}
              {Y.unit && ` (${Y.unit})`}
              {Y.log && " · log"}
            </text>
          )}

          {/* Requirement limits: shade the failing side, dashed line at the limit */}
          {xLimits.map((l) => {
            const x = xs.f(l.value);
            const failX = l.op === ">=" ? M.left : x;
            const failW = l.op === ">=" ? x - M.left : W - M.right - x;
            return (
              <g key={`lx-${l.label}`} pointerEvents="none">
                <rect x={failX} y={M.top} width={Math.max(0, failW)} height={H - M.bottom - M.top} fill="#8a2a1a" fillOpacity={0.05} />
                <line x1={x} x2={x} y1={M.top} y2={H - M.bottom} stroke="#8a2a1a" strokeWidth={1.5} strokeDasharray="5 4" />
                <text x={x + (l.op === ">=" ? 5 : -5)} y={M.top + 12} textAnchor={l.op === ">=" ? "start" : "end"} fontSize={11} fontWeight={600} fill="#8a2a1a">
                  {l.label}
                </text>
              </g>
            );
          })}
          {yLimits.map((l) => {
            const y = ys.f(l.value);
            const failY = l.op === ">=" ? y : M.top;
            const failH = l.op === ">=" ? H - M.bottom - y : y - M.top;
            return (
              <g key={`ly-${l.label}`} pointerEvents="none">
                <rect x={M.left} y={failY} width={W - M.right - M.left} height={Math.max(0, failH)} fill="#8a2a1a" fillOpacity={0.05} />
                <line x1={M.left} x2={W - M.right} y1={y} y2={y} stroke="#8a2a1a" strokeWidth={1.5} strokeDasharray="5 4" />
                <text x={W - M.right - 4} y={y + (l.op === ">=" ? -5 : 13)} textAnchor="end" fontSize={11} fontWeight={600} fill="#8a2a1a">
                  {l.label}
                </text>
              </g>
            );
          })}

          {/* Points */}
          {ordered.map((d) => {
            const { cx, cy } = pos.get(d.p.id)!;
            const comparing = compareIds.includes(d.p.id);
            const excluded = d.s === "excluded";
            const other = d.s === "other";
            const isHover = hover?.id === d.p.id;
            const r = comparing ? 6.5 : excluded ? 4.5 : 5.5;
            return (
              <g
                key={d.p.id}
                className="cursor-pointer"
                onMouseEnter={() => showHover(d.p.id, cx, cy)}
                onFocus={() => showHover(d.p.id, cx, cy)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect(d.p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(d.p.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${d.p.name}: ${X.short} ${d.x}${X.unit ? " " + X.unit : ""}, ${Y.short} ${d.y}${Y.unit ? " " + Y.unit : ""}. Open details.`}
              >
                <circle cx={cx} cy={cy} r={14} fill="transparent" />
                {excluded && !comparing ? (
                  <circle cx={cx} cy={cy} r={r} fill={COLOR.surface} stroke={COLOR.excluded} strokeWidth={2} />
                ) : other && !comparing ? (
                  <circle cx={cx} cy={cy} r={4.5} fill={COLOR.surface} stroke={COLOR.main} strokeOpacity={0.55} strokeWidth={2} />
                ) : (
                  <circle cx={cx} cy={cy} r={isHover ? r + 1.5 : r} fill={comparing ? COLOR.compare : COLOR.main} stroke={COLOR.surface} strokeWidth={2} />
                )}
              </g>
            );
          })}

          {/* Selective direct labels */}
          {ordered
            .filter((d) => labelSet.has(d.p.id))
            .map((d) => {
              const { cx, cy } = pos.get(d.p.id)!;
              const right = cx < W - M.right - 70;
              return (
                <text
                  key={`l${d.p.id}`}
                  x={right ? cx + 9 : cx - 9}
                  y={cy}
                  dy="0.32em"
                  textAnchor={right ? "start" : "end"}
                  fontSize={12}
                  fontWeight={600}
                  fill="var(--foreground)"
                  stroke={COLOR.surface}
                  strokeWidth={3}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {d.p.abbr}
                </text>
              );
            })}
        </svg>

        {/* Tooltip */}
        {hovered && hover && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[230px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[12px] leading-[1.5] text-[var(--muted)] shadow-[0_4px_16px_rgba(26,24,20,0.12)]"
            style={{
              left: hover.left,
              top: hover.top,
              transform: `translate(${hover.flip ? "calc(-100% - 12px)" : "12px"}, -50%)`,
            }}
          >
            <div className="text-[13px] font-semibold text-[var(--foreground)]">
              {hovered.p.name} <span className="font-normal text-[var(--subtle)]">{hovered.p.abbr}</span>
            </div>
            <div>
              {X.short}: <b className="text-[var(--foreground)]">{xKey === "costTier" ? "$".repeat(hovered.x) : hovered.x}</b> {X.unit}
            </div>
            <div>
              {Y.short}: <b className="text-[var(--foreground)]">{yKey === "costTier" ? "$".repeat(hovered.y) : hovered.y}</b> {Y.unit}
            </div>
            {hovered.s === "excluded" && <div className="text-[#8a2a1a]">✕ Excluded by your requirements</div>}
            {hovered.s === "candidate" && hasOther && <div className="text-[var(--accent)]">★ Best match</div>}
            <div className="mt-0.5 text-[var(--subtle)]">Click for details</div>
          </div>
        )}
      </div>

      <p className="mt-2 text-[12px] leading-[1.6] text-[var(--subtle)]">
        {limits.length > 0 && (
          <>
            Dashed lines mark your numeric requirements; the shaded side fails.
            {offChart.length > 0 && ` Not on these axes: ${offChart.map((l) => `${AXES[l.axis].short} ${l.label}`).join(", ")}.`}{" "}
          </>
        )}
        Typical values for a representative grade. Click a point to open its details.
        {data.missing > 0 && ` ${data.missing} material${data.missing === 1 ? "" : "s"} without data on these axes (e.g. elastomers have no tensile modulus or HDT) not shown.`}
      </p>
    </div>
  );
}
