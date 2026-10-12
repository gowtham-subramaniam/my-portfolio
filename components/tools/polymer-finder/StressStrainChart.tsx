"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { POLYMERS, type Family, type Polymer } from "./polymers";
import { SS_DATA, SS_MISSING, extent, fmtVal, hi, lo, type SSData, type SSPoint, type Val } from "./ssData";
import Term from "./Term";

/** Categorical slots, validated for this surface (CVD-safe adjacent pairs). Color follows the material, never its position. */
export const CURVE_COLORS = ["#2563a8", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
export const MAX_CURVES = CURVE_COLORS.length;
export const hasSSData = (id: string) => id in SS_DATA;

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
const fmtPct = (v: number) => (v === 0 ? "0" : v >= 10 ? Math.round(v).toString() : v >= 1 ? v.toFixed(1).replace(/\.0$/, "") : String(+v.toFixed(2)));
const mid = (v: Val) => (lo(v) + hi(v)) / 2;

type Tip = { x: number; y: number; title: string; lines: string[] };

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
  /** Best matches from the current search that have published data */
  suggestions: string[];
  onUseSuggestions: () => void;
  onSelect: (id: string) => void;
}) {
  const [scale, setScale] = useState<Scale>("auto");
  const [tip, setTip] = useState<Tip | null>(null);
  const [showMissing, setShowMissing] = useState(false);
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

  const items = useMemo(
    () =>
      selected
        .map((s) => {
          const p = POLYMERS.find((x) => x.id === s.id);
          const d = SS_DATA[s.id];
          return p && d ? { p, d, slot: s.slot, ext: extent(d) } : null;
        })
        .filter((c): c is { p: Polymer; d: SSData; slot: number; ext: ReturnType<typeof extent> } => c !== null),
    [selected],
  );

  const eMax = Math.max(...items.map((c) => c.ext.maxStrain), 1);
  const eMinOfMax = Math.min(...items.map((c) => c.ext.maxStrain || eMax), eMax);
  const isLog = scale === "log" || (scale === "auto" && eMax / eMinOfMax > 20);
  const sMax = niceMax(Math.max(...items.map((c) => c.ext.maxStress), 10) * 1.1);

  const x0 = M.left;
  const x1 = W - M.right;
  const y0 = H - M.bottom;
  const y1 = M.top;
  const logLo = 0.1;
  const logHi = 10 ** Math.ceil(Math.log10(eMax * 1.1));
  const linHi = niceMax(eMax * 1.08);
  const X = (pct: number) =>
    isLog
      ? x0 + ((Math.log10(Math.max(pct, logLo)) - Math.log10(logLo)) / (Math.log10(logHi) - Math.log10(logLo))) * (x1 - x0)
      : x0 + (pct / linHi) * (x1 - x0);
  const Y = (mpa: number) => y0 - (mpa / sMax) * (y0 - y1);
  const xStart = isLog ? logLo : 0;

  const xTicks = isLog ? Array.from({ length: Math.round(Math.log10(logHi / logLo)) + 1 }, (_, i) => logLo * 10 ** i) : linTicks(linHi, narrow ? 4 : 6);
  const yTicks = linTicks(sMax, narrow ? 4 : 5);

  const available = POLYMERS.filter((p) => !selected.some((s) => s.id === p.id));
  const full = selected.length >= MAX_CURVES;
  const sameAsSuggestions = suggestions.length > 0 && suggestions.length === selected.length && suggestions.every((id) => selected.some((s) => s.id === id));
  const missing = POLYMERS.filter((p) => SS_MISSING[p.id]);

  const btn = (on: boolean) =>
    `px-2.5 py-1 text-[12px] font-medium ${on ? "bg-[var(--accent)] text-white" : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"}`;

  /* ── Drawing helpers ── */
  const show = (x: number, y: number, title: string, lines: string[]) => setTip({ x, y, title, lines });
  const hit = (key: string, x: number, y: number, title: string, lines: string[]) => (
    <circle
      key={key}
      cx={x}
      cy={y}
      r={11}
      fill="transparent"
      tabIndex={0}
      role="img"
      aria-label={`${title}: ${lines.join(", ")}`}
      onPointerEnter={() => show(x, y, title, lines)}
      onPointerLeave={() => setTip(null)}
      onFocus={() => show(x, y, title, lines)}
      onBlur={() => setTip(null)}
      className="cursor-default outline-none"
    />
  );

  /** Marker for a published point, with range bars and a "≥" arrow where the datasheet gives a lower bound. */
  const marker = (key: string, pt: SSPoint, shape: "yield" | "break" | "at", color: string, title: string, label: string): ReactNode => {
    const cx = X(mid(pt.strain));
    const cy = Y(mid(pt.stress));
    const parts: ReactNode[] = [];
    if (Array.isArray(pt.stress)) {
      parts.push(<line key="vb" x1={cx} x2={cx} y1={Y(pt.stress[0])} y2={Y(pt.stress[1])} stroke={color} strokeWidth={2} />);
      parts.push(<line key="vb1" x1={cx - 4} x2={cx + 4} y1={Y(pt.stress[0])} y2={Y(pt.stress[0])} stroke={color} strokeWidth={2} />);
      parts.push(<line key="vb2" x1={cx - 4} x2={cx + 4} y1={Y(pt.stress[1])} y2={Y(pt.stress[1])} stroke={color} strokeWidth={2} />);
    }
    if (Array.isArray(pt.strain)) {
      parts.push(<line key="hb" x1={X(pt.strain[0])} x2={X(pt.strain[1])} y1={cy} y2={cy} stroke={color} strokeWidth={2} />);
    }
    if (pt.strainAtLeast) {
      parts.push(<path key="ar" d={`M${cx + 6},${cy}h12m-4,-4l4,4l-4,4`} fill="none" stroke={color} strokeWidth={1.5} />);
    }
    const ring = { stroke: "var(--card-bg)", strokeWidth: 2 };
    if (shape === "break") parts.push(<circle key="m" cx={cx} cy={cy} r={5} fill={color} {...ring} />);
    else if (shape === "yield") parts.push(<path key="m" d={`M${cx},${cy - 6}l6,6l-6,6l-6,-6z`} fill={color} {...ring} />);
    else parts.push(<rect key="m" x={cx - 4} y={cy - 4} width={8} height={8} fill={color} {...ring} />);
    const lines = [
      `Stress ${fmtVal(pt.stress, "MPa")}`,
      `Strain ${pt.strainAtLeast ? "> " : ""}${fmtVal(pt.strain, "%")}`,
    ];
    parts.push(hit("h", cx, cy, `${title} · ${label}`, lines));
    return <g key={key}>{parts}</g>;
  };

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
            className="max-w-[230px] rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[13px] text-[var(--foreground)] disabled:opacity-50"
          >
            <option value="">{full ? `Max ${MAX_CURVES} materials` : "Choose a material…"}</option>
            {FAMILY_ORDER.map((f) => (
              <optgroup key={f} label={f}>
                {available
                  .filter((p) => p.family === f)
                  .sort((a, b) => a.abbr.localeCompare(b.abbr))
                  .map((p) => (
                    <option key={p.id} value={p.id} disabled={!hasSSData(p.id)}>
                      {p.abbr} · {p.name}
                      {hasSSData(p.id) ? "" : " (no published data found)"}
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

      {items.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Plotted materials">
          {items.map((c) => (
            <li key={c.p.id} className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] py-[2px] pl-2 pr-1 text-[12px] text-[var(--foreground)]">
              <svg width="12" height="12" aria-hidden>
                <circle cx="6" cy="6" r="5" fill={CURVE_COLORS[c.slot]} />
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
        {items.length === 0 ? (
          <div className="flex items-center justify-center rounded-md border border-dashed border-[var(--border)] px-4 text-center text-[13px] text-[var(--subtle)]" style={{ height: H }}>
            Add a material above, or tick “Stress–strain” on any material card.
          </div>
        ) : (
          <svg width={W} height={H} role="group" aria-label={`Published tensile data points for ${items.map((c) => c.p.abbr).join(", ")}`} className="block select-none">
            {yTicks.map((t) => (
              <g key={`y${t}`}>
                <line x1={x0} x2={x1} y1={Y(t)} y2={Y(t)} stroke="var(--border)" strokeWidth={1} />
                <text x={x0 - 8} y={Y(t) + 4} textAnchor="end" fontSize={12} fill="var(--subtle)">
                  {t}
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <g key={`x${t}`}>
                <line x1={X(t)} x2={X(t)} y1={y1} y2={y0} stroke="var(--border)" strokeWidth={1} />
                <text x={X(t)} y={y0 + 18} textAnchor="middle" fontSize={12} fill="var(--subtle)">
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

            {items.map((c) => {
              const col = CURVE_COLORS[c.slot];
              const d = c.d;
              const name = c.p.abbr;
              const g: ReactNode[] = [];

              // 1. Dotted connector through the published points only (visual guide, not data).
              const pts: SSPoint[] = [d.yield, ...(d.at ?? []), d.brk].filter((v): v is SSPoint => Boolean(v)).sort((a, b) => mid(a.strain) - mid(b.strain));
              if (pts.length) {
                const path = [`M${X(xStart)},${Y(0)}`, ...pts.map((p) => `L${X(mid(p.strain))},${Y(mid(p.stress))}`)].join("");
                g.push(<path key="conn" d={path} fill="none" stroke={col} strokeWidth={1.25} strokeDasharray="1.5 3.5" strokeLinecap="round" opacity={0.9} />);
              }

              // 2. Modulus: the published initial slope, drawn as a short solid line from the origin.
              if (d.modulus !== undefined) {
                const ref = Math.min(...[d.yield, d.brk, ...(d.at ?? [])].filter((v): v is SSPoint => Boolean(v)).map((p) => lo(p.stress)), d.yieldStress ? lo(d.yieldStress) : Infinity, d.strength ? lo(d.strength) : Infinity, sMax * 0.5);
                const top = ref * 0.6;
                for (const [i, E] of (Array.isArray(d.modulus) ? d.modulus : [d.modulus]).entries()) {
                  const eEnd = (top / E) * 100; // % strain where the tangent reaches `top`
                  const seg = isLog
                    ? Array.from({ length: 24 }, (_, k) => {
                        const e = 10 ** (Math.log10(logLo) + ((Math.log10(Math.max(eEnd, logLo * 1.01)) - Math.log10(logLo)) * k) / 23);
                        return `${k ? "L" : "M"}${X(e)},${Y((E * e) / 100)}`;
                      }).join("")
                    : `M${X(0)},${Y(0)}L${X(eEnd)},${Y(top)}`;
                  g.push(<path key={`E${i}`} d={seg} fill="none" stroke={col} strokeWidth={2.5} strokeLinecap="round" />);
                }
                const eEnd = (top / hi(d.modulus)) * 100;
                g.push(hit("Eh", X(Math.max(eEnd * 0.6, xStart)), Y(top * 0.6), `${name} · modulus`, [`${fmtVal(d.modulus, "MPa")} (initial slope)`]));
              }

              // 3. Stresses published without a strain: dashed horizontal line.
              const breakEnd = d.breakStrain !== undefined ? hi(d.breakStrain) : d.brk ? hi(d.brk.strain) : null;
              const capEnd = breakEnd ?? (isLog ? logHi : linHi) * 0.25;
              const cap = (key: string, v: Val, label: string) => {
                const yy = Y(mid(v));
                g.push(<line key={key} x1={X(xStart)} x2={X(capEnd)} y1={yy} y2={yy} stroke={col} strokeWidth={1.75} strokeDasharray="7 4" />);
                if (Array.isArray(v)) g.push(<rect key={`${key}r`} x={X(xStart)} y={Y(v[1])} width={X(capEnd) - X(xStart)} height={Y(v[0]) - Y(v[1])} fill={col} opacity={0.12} />);
                g.push(hit(`${key}h`, X(capEnd) - 10, yy, `${name} · ${label}`, [`${fmtVal(v, "MPa")} (strain not published)`]));
              };
              if (d.yieldStress !== undefined) cap("ys", d.yieldStress, "yield stress");
              if (d.strength !== undefined) {
                cap("st", d.strength, "tensile strength (not stated as yield or break)");
                if (d.breakStrain !== undefined) {
                  g.push(<line key="env" x1={X(hi(d.breakStrain))} x2={X(hi(d.breakStrain))} y1={Y(0)} y2={Y(mid(d.strength))} stroke={col} strokeWidth={1} strokeDasharray="2 3" />);
                }
              }

              // 4. Strain at break published without its stress: hollow marker on the strain axis.
              if (d.breakStrain !== undefined) {
                const bx = X(mid(d.breakStrain));
                if (Array.isArray(d.breakStrain)) g.push(<line key="bsr" x1={X(d.breakStrain[0])} x2={X(d.breakStrain[1])} y1={y0} y2={y0} stroke={col} strokeWidth={4} strokeLinecap="round" />);
                g.push(<circle key="bs" cx={bx} cy={y0} r={5} fill="var(--card-bg)" stroke={col} strokeWidth={2.5} />);
                if (d.breakStrainAtLeast) g.push(<path key="bsa" d={`M${bx + 7},${y0 - 6}h10m-4,-3l4,3l-4,3`} fill="none" stroke={col} strokeWidth={1.5} />);
                g.push(hit("bsh", bx, y0, `${name} · strain at break`, [`${d.breakStrainAtLeast ? "> " : ""}${fmtVal(d.breakStrain, "%")} (stress at break not published)`]));
              }

              // 5. Published points.
              if (d.yield) g.push(marker("y", d.yield, "yield", col, name, "yield"));
              d.at?.forEach((p, i) => g.push(marker(`a${i}`, p, "at", col, name, `stress at ${fmtVal(p.strain, "%")}`)));
              if (d.brk) g.push(marker("b", d.brk, "break", col, name, "break"));

              // 6. Name label at the right-most published point.
              const ends: { x: number; y: number }[] = [];
              pts.forEach((p) => ends.push({ x: X(hi(p.strain)), y: Y(mid(p.stress)) }));
              if (d.yieldStress !== undefined) ends.push({ x: X(capEnd), y: Y(mid(d.yieldStress)) });
              if (d.strength !== undefined) ends.push({ x: X(capEnd), y: Y(mid(d.strength)) });
              const end = ends.sort((a, b) => b.x - a.x)[0];
              if (end) {
                const left = end.x + 8 + name.length * 7.5 > W;
                g.push(
                  <text key="lbl" x={left ? end.x - 10 : end.x + 10} y={end.y - 8} textAnchor={left ? "end" : "start"} fontSize={12} fontWeight={600} fill="var(--foreground)" pointerEvents="none">
                    {name}
                  </text>,
                );
              }
              return <g key={c.p.id}>{g}</g>;
            })}
          </svg>
        )}
        {tip && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[12px] shadow-sm"
            style={{ top: Math.max(0, tip.y - 60), ...(tip.x > W * 0.6 ? { right: W - tip.x + 14 } : { left: tip.x + 14 }) }}
          >
            <div className="font-semibold text-[var(--foreground)]">{tip.title}</div>
            {tip.lines.map((l) => (
              <div key={l} className="text-[var(--muted)]">
                {l}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key */}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]" aria-label="Chart key">
        <li className="flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden>
            <path d="M7,1l6,6l-6,6l-6,-6z" fill="var(--muted)" />
          </svg>
          Yield point
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <circle cx="6" cy="6" r="5" fill="var(--muted)" />
          </svg>
          Break point
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <rect x="2" y="2" width="8" height="8" fill="var(--muted)" />
          </svg>
          Stress at a stated strain
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--muted)" strokeWidth="2" />
          </svg>
          Strain at break (stress not published)
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden>
            <line x1="1" y1="4" x2="21" y2="4" stroke="var(--muted)" strokeWidth="2" strokeDasharray="6 3" />
          </svg>
          Stress published without its strain
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden>
            <line x1="1" y1="7" x2="21" y2="1" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <Term k="modulus">Modulus</Term> (initial slope)
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden>
            <line x1="1" y1="4" x2="21" y2="4" stroke="var(--muted)" strokeWidth="1.25" strokeDasharray="1.5 3.5" strokeLinecap="round" />
          </svg>
          Joins published points (not data)
        </li>
      </ul>

      <p className="mt-3 text-[12px] leading-[1.6] text-[var(--subtle)]">
        <b className="text-[var(--muted)]">Only published datasheet values are plotted.</b> Datasheets give a few points, not the full curve, so the
        shape between points is unknown; the dotted line only joins them. Each material is a specific named grade at 23 °C, linked below. Test
        standards differ (ISO 527, ASTM D638, rubber standards), so compare with care. Full measured curves for many grades are on{" "}
        <a href="https://www.campusplastics.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[var(--foreground)]">
          CAMPUS
        </a>
        .
      </p>

      {items.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--subtle)]">
                <th className="py-1 pr-3 font-normal">Material · grade</th>
                <th className="py-1 pr-3 font-normal">
                  <Term k="modulus">Modulus</Term>
                </th>
                <th className="py-1 pr-3 font-normal">Yield</th>
                <th className="py-1 pr-3 font-normal">Break</th>
                <th className="py-1 font-normal">Source</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ p, d, slot }) => {
                const pt = (x: SSPoint) => `${fmtVal(x.stress, "MPa")} @ ${x.strainAtLeast ? ">" : ""}${fmtVal(x.strain, "%")}`;
                const yieldTxt = d.yield ? pt(d.yield) : d.yieldStress !== undefined ? `${fmtVal(d.yieldStress, "MPa")} @ —` : "—";
                const breakTxt = d.brk
                  ? pt(d.brk)
                  : d.breakStrain !== undefined
                    ? `— @ ${d.breakStrainAtLeast ? ">" : ""}${fmtVal(d.breakStrain, "%")}`
                    : "—";
                return (
                  <tr key={p.id} className="border-b border-[var(--border)] align-top text-[var(--foreground)] last:border-0">
                    <td className="py-1.5 pr-3">
                      <span className="mr-1.5 inline-block h-[9px] w-[9px] rounded-full align-middle" style={{ background: CURVE_COLORS[slot] }} />
                      <b>{p.abbr}</b> · {d.grade}
                      <div className="text-[11px] text-[var(--subtle)]">
                        {d.standard}
                        {d.strength !== undefined && ` · Tensile strength ${fmtVal(d.strength, "MPa")} (not stated as yield or break)`}
                        {d.at?.length ? ` · ${d.at.map((a) => `${fmtVal(a.stress, "MPa")} @ ${fmtVal(a.strain, "%")}`).join(", ")}` : ""}
                        {d.note && ` · ${d.note}`}
                      </div>
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">{d.modulus !== undefined ? fmtVal(d.modulus, "MPa") : "—"}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{yieldTxt}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{breakTxt}</td>
                    <td className="py-1.5">
                      <a href={d.source.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                        {d.source.label}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 text-[12px] text-[var(--muted)]">
        <button type="button" onClick={() => setShowMissing((v) => !v)} aria-expanded={showMissing} className="font-semibold text-[var(--accent)] hover:underline">
          {showMissing ? "Hide" : "Show"} materials without published data ({missing.length}) {showMissing ? "▴" : "▾"}
        </button>
        {showMissing && (
          <ul className="mt-1.5 space-y-0.5">
            {missing.map((p) => (
              <li key={p.id}>
                <b className="text-[var(--foreground)]">{p.abbr}</b> · {SS_MISSING[p.id]}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
