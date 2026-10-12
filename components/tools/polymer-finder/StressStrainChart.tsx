"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { POLYMERS, type Family, type Polymer } from "./polymers";
import { KIND_TEXT, curveModel, sampleCurve, stressAt, type CurveModel } from "./stressStrain";
import Term from "./Term";

/** Categorical slots, validated for this surface (CVD-safe adjacent pairs). Color follows the material, never its position. */
export const CURVE_COLORS = ["#2563a8", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
export const MAX_CURVES = CURVE_COLORS.length;

export interface CurveSel {
  id: string;
  slot: number;
}

const FAMILY_ORDER: Family[] = ["Commodity", "Engineering", "High-performance", "Fluoropolymer", "Elastomer"];

type Scale = "auto" | "linear" | "log";

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
function linTicks(max: number, n = 5) {
  const step = niceMax(max / n);
  const out: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}
const fmtPct = (v: number) => (v === 0 ? "0" : v >= 10 ? Math.round(v).toString() : v >= 1 ? v.toFixed(1).replace(/\.0$/, "") : v.toFixed(2).replace(/0$/, ""));

export default function StressStrainChart({
  selected,
  onAdd,
  onRemove,
  onClear,
  suggestions,
  onUseSuggestions,
  onSelect,
}: {
  selected: CurveSel[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Best matches from the current search, offered as a one-click set */
  suggestions: string[];
  onUseSuggestions: () => void;
  onSelect: (id: string) => void;
}) {
  const [scale, setScale] = useState<Scale>("auto");
  const [hoverX, setHoverX] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = W < 520;
  const H = narrow ? Math.round(W * 0.9) : Math.round(Math.min(420, W * 0.55));
  const M = narrow ? { top: 14, right: 44, bottom: 48, left: 42 } : { top: 14, right: 64, bottom: 52, left: 58 };

  const curves = useMemo(
    () =>
      selected
        .map((s) => {
          const p = POLYMERS.find((x) => x.id === s.id);
          return p ? { p, slot: s.slot, m: curveModel(p) } : null;
        })
        .filter((c): c is { p: Polymer; slot: number; m: CurveModel } => c !== null),
    [selected],
  );

  // Strain axis: log when the selected materials' elongations span more than ~20×.
  const eMax = Math.max(...curves.map((c) => c.m.epsB * 100), 1);
  const eMin = Math.min(...curves.map((c) => c.m.epsB * 100), eMax);
  const autoLog = eMax / eMin > 20;
  const isLog = scale === "log" || (scale === "auto" && autoLog);

  const sMax = niceMax(Math.max(...curves.map((c) => c.m.sigma), 10) * 1.08);
  const x0 = M.left;
  const x1 = W - M.right;
  const y0 = H - M.bottom;
  const y1 = M.top;

  const logLo = 0.1; // %
  const logHi = 10 ** Math.ceil(Math.log10(eMax * 1.05));
  const linHi = niceMax(eMax * 1.05);
  const xPx = (pct: number) =>
    isLog
      ? x0 + ((Math.log10(Math.max(pct, logLo)) - Math.log10(logLo)) / (Math.log10(logHi) - Math.log10(logLo))) * (x1 - x0)
      : x0 + (pct / linHi) * (x1 - x0);
  const xInv = (px: number) =>
    isLog ? 10 ** (Math.log10(logLo) + ((px - x0) / (x1 - x0)) * (Math.log10(logHi) - Math.log10(logLo))) : ((px - x0) / (x1 - x0)) * linHi;
  const yPx = (mpa: number) => y0 - (mpa / sMax) * (y0 - y1);

  const xTicks = isLog
    ? Array.from({ length: Math.round(Math.log10(logHi / logLo)) + 1 }, (_, i) => logLo * 10 ** i)
    : linTicks(linHi, narrow ? 4 : 6);
  const yTicks = linTicks(sMax, narrow ? 4 : 5);

  const paths = curves.map((c) => {
    const pts = sampleCurve(c.m, isLog ? logLo / 100 : 0);
    const d = pts.map(([e, s], i) => `${i ? "L" : "M"}${xPx(e * 100).toFixed(1)},${yPx(s).toFixed(1)}`).join("");
    return { ...c, d, bx: xPx(c.m.epsB * 100), by: yPx(c.m.sigma) };
  });

  // End labels: keep them from overlapping by pushing apart vertically.
  const labels = paths
    .map((c) => ({ id: c.p.id, text: c.p.abbr, x: c.bx, y: c.by }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    for (let j = 0; j < i; j++) {
      if (Math.abs(labels[i].x - labels[j].x) < 70 && labels[i].y - labels[j].y < 13) labels[i].y = labels[j].y + 13;
    }
  }
  const labelPos = new Map(labels.map((l) => [l.id, l]));

  const hoverPct = hoverX !== null ? xInv(hoverX) : null;

  const available = POLYMERS.filter((p) => !selected.some((s) => s.id === p.id));
  const full = selected.length >= MAX_CURVES;
  const sameAsSuggestions = suggestions.length > 0 && suggestions.every((id) => selected.some((s) => s.id === id)) && suggestions.length === selected.length;

  const btn = (on: boolean) =>
    `px-2.5 py-1 text-[12px] font-medium ${on ? "bg-[var(--accent)] text-white" : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"}`;

  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5">
      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--muted)]">
        <label className="flex items-center gap-2">
          <span>Add</span>
          <select
            value=""
            disabled={full}
            onChange={(e) => e.target.value && onAdd(e.target.value)}
            className="max-w-[220px] rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[13px] text-[var(--foreground)] disabled:opacity-50"
          >
            <option value="">{full ? `Max ${MAX_CURVES} materials` : "Choose a material…"}</option>
            {FAMILY_ORDER.map((f) => (
              <optgroup key={f} label={f}>
                {available
                  .filter((p) => p.family === f)
                  .sort((a, b) => a.abbr.localeCompare(b.abbr))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.abbr} · {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <span>Strain axis</span>
          <div className="flex overflow-hidden rounded-md border border-[var(--border)]" role="group" aria-label="Strain axis scale">
            <button type="button" aria-pressed={!isLog} onClick={() => setScale("linear")} className={btn(!isLog)}>
              Linear
            </button>
            <button type="button" aria-pressed={isLog} onClick={() => setScale("log")} className={`border-l border-[var(--border)] ${btn(isLog)}`}>
              Log
            </button>
          </div>
        </div>
        {suggestions.length > 0 && !sameAsSuggestions && (
          <button type="button" onClick={onUseSuggestions} className="font-semibold text-[var(--accent)] hover:underline">
            Plot best matches
          </button>
        )}
        {selected.length > 0 && (
          <button type="button" onClick={onClear} className="text-[var(--subtle)] hover:text-[var(--foreground)]">
            Clear
          </button>
        )}
      </div>

      {/* Legend (identity is never color alone: chips carry the name, curves carry end labels) */}
      {curves.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Plotted materials">
          {curves.map((c) => (
            <li key={c.p.id} className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] py-[2px] pl-2 pr-1 text-[12px] text-[var(--foreground)]">
              <svg width="18" height="8" aria-hidden>
                <line x1="1" y1="4" x2="17" y2="4" stroke={CURVE_COLORS[c.slot]} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <button type="button" onClick={() => onSelect(c.p.id)} className="font-semibold hover:underline" title={`Open ${c.p.name}`}>
                {c.p.abbr}
              </button>
              <button type="button" onClick={() => onRemove(c.p.id)} aria-label={`Remove ${c.p.abbr}`} className="px-1 text-[14px] leading-none text-[var(--subtle)] hover:text-[var(--foreground)]">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={wrapRef} className="relative">
        {curves.length === 0 ? (
          <div className="flex items-center justify-center rounded-md border border-dashed border-[var(--border)] text-[13px] text-[var(--subtle)]" style={{ height: H }}>
            Add a material above, or tick “Stress–strain” on any material card.
          </div>
        ) : (
          <svg
            width={W}
            height={H}
            role="img"
            aria-label={`Idealized stress–strain curves for ${curves.map((c) => c.p.abbr).join(", ")}`}
            className="block touch-none select-none"
            onPointerMove={(e) => {
              const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const px = e.clientX - r.left;
              setHoverX(px >= x0 && px <= x1 ? px : null);
            }}
            onPointerLeave={() => setHoverX(null)}
          >
            {/* Grid + axes */}
            {yTicks.map((t) => (
              <g key={`y${t}`}>
                <line x1={x0} x2={x1} y1={yPx(t)} y2={yPx(t)} stroke="var(--border)" strokeWidth={1} />
                <text x={x0 - 8} y={yPx(t) + 4} textAnchor="end" fontSize={12} fill="var(--subtle)">
                  {t}
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <g key={`x${t}`}>
                <line x1={xPx(t)} x2={xPx(t)} y1={y1} y2={y0} stroke="var(--border)" strokeWidth={1} />
                <text x={xPx(t)} y={y0 + 18} textAnchor="middle" fontSize={12} fill="var(--subtle)">
                  {fmtPct(t)}
                </text>
              </g>
            ))}
            <line x1={x0} x2={x1} y1={y0} y2={y0} stroke="var(--faint)" strokeWidth={1} />
            <text x={(x0 + x1) / 2} y={H - 10} textAnchor="middle" fontSize={13} fill="var(--muted)">
              Strain (%){isLog ? " · log scale" : ""}
            </text>
            <text x={14} y={(y0 + y1) / 2} textAnchor="middle" fontSize={13} fill="var(--muted)" transform={`rotate(-90 14 ${(y0 + y1) / 2})`}>
              Stress (MPa)
            </text>

            {/* Curves */}
            {paths.map((c) => (
              <g key={c.p.id}>
                <path d={c.d} fill="none" stroke="var(--card-bg)" strokeWidth={5} strokeLinejoin="round" />
                <path d={c.d} fill="none" stroke={CURVE_COLORS[c.slot]} strokeWidth={2} strokeLinejoin="round" strokeDasharray={c.m.kind === "elastomer" ? "6 4" : undefined} />
              </g>
            ))}
            {/* Break points + end labels */}
            {paths.map((c) => {
              const l = labelPos.get(c.p.id)!;
              const left = l.x + 40 > W;
              return (
                <g key={`b${c.p.id}`}>
                  <circle cx={c.bx} cy={c.by} r={4.5} fill={CURVE_COLORS[c.slot]} stroke="var(--card-bg)" strokeWidth={2} />
                  <text x={left ? c.bx - 8 : c.bx + 8} y={l.y + 4} textAnchor={left ? "end" : "start"} fontSize={12} fontWeight={600} fill="var(--foreground)">
                    {c.p.abbr}
                  </text>
                </g>
              );
            })}

            {/* Crosshair */}
            {hoverX !== null && <line x1={hoverX} x2={hoverX} y1={y1} y2={y0} stroke="var(--subtle)" strokeWidth={1} strokeDasharray="3 3" />}
            {hoverX !== null &&
              hoverPct !== null &&
              paths.map((c) => {
                const s = stressAt(c.m, hoverPct / 100);
                return s === null ? null : <circle key={`h${c.p.id}`} cx={hoverX} cy={yPx(s)} r={3.5} fill={CURVE_COLORS[c.slot]} stroke="var(--card-bg)" strokeWidth={1.5} />;
              })}
          </svg>
        )}

        {hoverX !== null && hoverPct !== null && curves.length > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[170px] rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[12px] shadow-sm"
            style={hoverX > W * 0.55 ? { right: W - hoverX + 10 } : { left: hoverX + 10 }}
          >
            <div className="mb-1 font-semibold text-[var(--foreground)]">Strain {fmtPct(hoverPct)}%</div>
            {curves.map((c) => {
              const s = stressAt(c.m, hoverPct / 100);
              return (
                <div key={c.p.id} className="flex items-center justify-between gap-3 text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-[3px] w-3 rounded" style={{ background: CURVE_COLORS[c.slot] }} />
                    {c.p.abbr}
                  </span>
                  <span className="tabular-nums text-[var(--foreground)]">{s === null ? "broken" : `${s.toFixed(s < 10 ? 1 : 0)} MPa`}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-[12px] leading-[1.6] text-[var(--subtle)]">
        <b className="text-[var(--muted)]">Idealized curves, not measured ones.</b> Each curve is drawn from three typical datasheet values: it starts at the
        slope of the <Term k="modulus">modulus</Term>, rises to the <Term k="tensile">tensile strength</Term> and ends (●) at the{" "}
        <Term k="elongation">elongation at break</Term>. Real curves show yield peaks, necking and strain hardening, and change with
        temperature, moisture and test speed. Elastomers (dashed) have no modulus in the data, so their shape is schematic. For design, use the
        supplier&apos;s measured curves, for example on{" "}
        <a href="https://www.campusplastics.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[var(--foreground)]">
          CAMPUS
        </a>
        .
      </p>

      {curves.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--subtle)]">
                <th className="py-1 pr-3 font-normal">Material</th>
                <th className="py-1 pr-3 font-normal">
                  <Term k="modulus">Modulus</Term>
                </th>
                <th className="py-1 pr-3 font-normal">
                  <Term k="tensile">Tensile</Term>
                </th>
                <th className="py-1 pr-3 font-normal">
                  <Term k="elongation">Elongation</Term>
                </th>
                <th className="py-1 pr-3 font-normal">Shape</th>
                <th className="py-1 font-normal">
                  <Term k="basis">Data basis</Term>
                </th>
              </tr>
            </thead>
            <tbody>
              {curves.map((c) => (
                <tr key={c.p.id} className="border-b border-[var(--border)] last:border-0 text-[var(--foreground)]">
                  <td className="py-1 pr-3 font-semibold">
                    <span className="mr-1.5 inline-block h-[3px] w-3 rounded align-middle" style={{ background: CURVE_COLORS[c.slot] }} />
                    {c.p.abbr}
                  </td>
                  <td className="py-1 pr-3 tabular-nums">{c.p.modulusGPa !== null ? `${c.p.modulusGPa} GPa` : c.p.hardness?.split(" ")[0] ?? "—"}</td>
                  <td className="py-1 pr-3 tabular-nums">{c.p.tensileMPa} MPa</td>
                  <td className="py-1 pr-3 tabular-nums">{c.p.elongationPct}%</td>
                  <td className="py-1 pr-3 text-[var(--muted)]">{KIND_TEXT[c.m.kind]}</td>
                  <td className="py-1 text-[var(--muted)]">{c.p.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
