"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { POLYMERS } from "../polymers";
import { SNAP_SOURCES, snapLimit, type SnapLimit } from "../guides";

/* ─────────────────────────── physics ───────────────────────────
 * Cantilever snap-fit arm, rectangular section, small deflection,
 * linear elastic. Tip deflection y and root outer-fibre strain ε:
 *   y = k · ε · L² / h
 * k = 0.67 for constant thickness (beam theory)
 * k = 1.09 when thickness tapers linearly to h/2 at the tip
 *       (Bayer, Snap-Fit Joints for Plastics, design type 2)
 * Both coefficients are reproduced by integrating M/EI below.
 */

type Design = "constant" | "tapered";
const K: Record<Design, number> = { constant: 2 / 3, tapered: 1.09 };

/** thickness ratio h(x)/h at position u = x/L */
const thick = (d: Design, u: number) => (d === "constant" ? 1 : 1 - u / 2);

/** outer-fibre strain at u, relative to the root strain */
const strainShape = (d: Design, u: number) => (1 - u) / thick(d, u) ** 2;

/** deflected shape v(u)/v(1), from integrating curvature twice */
function shapeTable(d: Design, n = 60): number[] {
  const curv = Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return (1 - u) / thick(d, u) ** 3;
  });
  const slope = [0];
  for (let i = 1; i <= n; i++) slope.push(slope[i - 1] + (curv[i - 1] + curv[i]) / (2 * n));
  const v = [0];
  for (let i = 1; i <= n; i++) v.push(v[i - 1] + (slope[i - 1] + slope[i]) / (2 * n));
  return v.map((x) => x / v[n]);
}
const SHAPES: Record<Design, number[]> = { constant: shapeTable("constant"), tapered: shapeTable("tapered") };

const rootStrainPct = (y: number, h: number, L: number, d: Design) => (100 * y * h) / (K[d] * L * L);
const minLength = (y: number, h: number, epsPct: number, d: Design) => Math.sqrt((y * h) / (K[d] * (epsPct / 100)));

/* ─────────────────────────── materials ─────────────────────────── */

interface Mat {
  id: string;
  name: string;
  limit: SnapLimit;
}
const MATS: Mat[] = POLYMERS.filter((p) => p.structure !== "Elastomer")
  .map((p) => ({ id: p.id, name: `${p.abbr} — ${p.name}`, limit: snapLimit(p.id) }))
  .filter((m): m is Mat => m.limit !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

/* ─────────────────────────── colours ─────────────────────────── */

/** cool grey at zero strain → amber at the limit → red beyond it */
const STOPS: [number, [number, number, number]][] = [
  [0, [200, 208, 214]],
  [0.6, [222, 196, 120]],
  [1, [226, 140, 40]],
  [1.4, [196, 58, 40]],
];
function strainColor(r: number): string {
  const c = Math.min(1.4, Math.max(0, r));
  let i = 0;
  while (i < STOPS.length - 2 && c > STOPS[i + 1][0]) i++;
  const [a, ca] = STOPS[i];
  const [b, cb] = STOPS[i + 1];
  const k = (c - a) / (b - a);
  const mix = ca.map((v, j) => Math.round(v + (cb[j] - v) * k));
  return `rgb(${mix.join(",")})`;
}

/* ─────────────────────────── scene ─────────────────────────── */

const PX = 14; // px per mm (fixed so length changes are visible)
const ROOT_X = 70;
const AXIS_Y = 165;
const HOOK_LEN = 2.5; // mm
const PLATE_W = 3; // mm

function Scene({ L, h, y, design, t, limit }: { L: number; h: number; y: number; design: Design; t: number; limit: number }) {
  const tipX = ROOT_X + L * PX;
  const hookStart = L - HOOK_LEN; // mm from root, retaining face
  // mating plate bottom-left corner position, mm from root
  const cxStart = L + 2.5;
  const cxEnd = hookStart - PLATE_W - 1.2;
  const cx = cxStart + (cxEnd - cxStart) * t;
  // hook profile above the arm top: vertical retaining face, then a ramp down to the tip
  const profile = (x: number) => (x < hookStart || x > L ? 0 : (y * (L - x)) / HOOK_LEN);
  let d = 0;
  for (let i = 0; i <= 60; i++) d = Math.max(d, profile(cx + (PLATE_W * i) / 60));
  const locked = cx + PLATE_W < hookStart;
  const eps = rootStrainPct(d, h, L, design);
  const shape = SHAPES[design];
  const n = shape.length - 1;

  // arm segments, coloured by local strain
  const segs: ReactNode[] = [];
  const pts = (i: number) => {
    const u = i / n;
    const x = ROOT_X + u * L * PX;
    const half = (thick(design, u) * h * PX) / 2;
    const dv = shape[i] * d * PX;
    return { x, top: AXIS_Y - half + dv, bot: AXIS_Y + half + dv };
  };
  for (let i = 0; i < n; i++) {
    const a = pts(i);
    const b = pts(i + 1);
    const u = (i + 0.5) / n;
    const r = (eps * strainShape(design, u)) / limit;
    segs.push(
      <polygon
        key={i}
        points={`${a.x},${a.top} ${b.x + 0.6},${b.top} ${b.x + 0.6},${b.bot} ${a.x},${a.bot}`}
        fill={strainColor(r)}
      />,
    );
  }
  const tip = pts(n);
  const all = Array.from({ length: n + 1 }, (_, i) => pts(i));
  const outline = [...all.map((p) => `${p.x},${p.top}`), ...all.reverse().map((p) => `${p.x},${p.bot}`)].join(" ");
  const hs = pts(Math.round((hookStart / L) * n));
  const hookTopY = hs.top; // hook peak sits on the arm top at the retaining face
  const hookFaceX = ROOT_X + hookStart * PX;
  const hook = `${hookFaceX},${hs.top} ${hookFaceX},${hookTopY - y * PX} ${tipX},${tip.top}`;

  const plateLeft = ROOT_X + cx * PX;
  const plateBottom = AXIS_Y - (h * PX) / 2; // undeflected arm top
  const rootRatio = eps / limit;

  const vbW = Math.max(400, ROOT_X + (L + 7) * PX + 40);
  return (
    <svg viewBox={`0 0 ${vbW} 250`} className="h-auto w-full" role="img" aria-label="Snap-fit arm deflecting as the mating part slides over the hook">
      <defs>
        <pattern id="sf-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--faint)" strokeWidth="1.2" />
        </pattern>
      </defs>
      {/* base part */}
      <rect x={ROOT_X - 36} y={AXIS_Y - 60} width={36} height={130} fill="url(#sf-hatch)" stroke="var(--subtle)" strokeWidth="1" />
      {/* mating part */}
      <rect x={plateLeft} y={30} width={PLATE_W * PX} height={plateBottom - 30} fill="var(--tag-bg)" stroke="var(--subtle)" strokeWidth="1" />
      <text x={plateLeft + (PLATE_W * PX) / 2} y={22} textAnchor="middle" fontSize="11" fill="var(--subtle)">
        mating part
      </text>
      {/* arm + hook */}
      {segs}
      <polygon points={hook} fill={strainColor(0)} stroke="var(--subtle)" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={outline} fill="none" stroke="var(--subtle)" strokeWidth="1" strokeLinejoin="round" />
      {/* undeflected outline */}
      <line x1={ROOT_X} y1={AXIS_Y} x2={tipX} y2={AXIS_Y} stroke="var(--faint)" strokeDasharray="3 4" strokeWidth="1" />
      {/* root marker */}
      <circle cx={ROOT_X} cy={AXIS_Y - (h * PX) / 2} r={7} fill="none" stroke={rootRatio > 0.05 ? strainColor(Math.max(rootRatio, 0.6)) : "transparent"} strokeWidth="2" />
      <text x={ROOT_X + 10} y={AXIS_Y + (h * PX) / 2 + 26} fontSize="12" fill="var(--muted)">
        root: {eps.toFixed(2)} % strain
      </text>
      {/* dimension: undercut */}
      <g fontSize="11" fill="var(--subtle)">
        <text x={ROOT_X + (L * PX) / 2} y={AXIS_Y + (h * PX) / 2 + 44 + d * PX} textAnchor="middle">
          L = {L.toFixed(0)} mm, h = {h.toFixed(1)} mm
        </text>
      </g>
      <text x={vbW - 12} y={242} textAnchor="end" fontSize="12" fontWeight="600" fill={locked ? "#2f7a4f" : "var(--subtle)"}>
        {locked ? "Locked" : d > 0 ? `Deflecting ${d.toFixed(2)} mm` : "Push the parts together ↓"}
      </text>
    </svg>
  );
}

/* ─────────────────────────── UI bits ─────────────────────────── */

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block text-[13px] text-[var(--muted)]">
      <span className="flex justify-between">
        <span>{label}</span>
        <b className="font-semibold text-[var(--foreground)]">
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
    </label>
  );
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 text-[12px]">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 ${value === v ? "bg-[var(--btn-bg)] text-[var(--btn-text)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

const H2 = "mt-10 mb-3 text-[20px] font-bold tracking-[-0.01em]";
const P = "mb-3 text-[15px] leading-[1.75] text-[var(--muted)]";
const SrcA = ({ s }: { s: { label: string; url: string } }) => (
  <a href={s.url} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--accent)] hover:underline">
    [{s.label}]
  </a>
);

/* ─────────────────────────── page ─────────────────────────── */

export default function SnapFitExplainer({ initialMaterial }: { initialMaterial?: string }) {
  const [matId, setMatId] = useState(initialMaterial && MATS.some((x) => x.id === initialMaterial) ? initialMaterial : "pc");
  const [L, setL] = useState(12);
  const [h, setH] = useState(2);
  const [y, setY] = useState(1.2);
  const [design, setDesign] = useState<Design>("constant");
  const [mode, setMode] = useState<"single" | "repeated">("single");
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);

  const play = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    setPlaying(true);
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 2600);
      setT(k);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(step);
  }, []);
  useEffect(() => () => void (raf.current && cancelAnimationFrame(raf.current)), []);

  const mat = MATS.find((m) => m.id === matId) ?? MATS[0];
  const limit = mode === "single" ? mat.limit.single : mat.limit.repeated;
  const peak = rootStrainPct(y, h, L, design);
  const ratio = peak / limit;
  const Lmin = minLength(y, h, limit, design);
  const verdict = (() => {
    if (ratio > 1) return { tone: "#b4412b", bg: "#fbeeea", text: `Over the limit: the root strains ${ratio.toFixed(1)}× more than ${mat.name.split(" — ")[0]} allows. Expect whitening, a permanent set or a crack at the root.` };
    if (ratio > 0.8) return { tone: "#9a6312", bg: "#fdf4e6", text: "Close to the limit. Little margin for tolerances, a sharp root corner or a cold day." };
    return { tone: "#2f7a4f", bg: "#edf7f1", text: "Within the allowable strain, with margin." };
  })();

  const tryOut: [string, () => void][] = [
    ["Double the length", () => setL((v) => Math.min(30, v * 2))],
    ["Halve the thickness", () => setH((v) => Math.max(0.8, +(v / 2).toFixed(1)))],
    ["Taper the arm", () => setDesign("tapered")],
    ["Switch to glass-filled nylon", () => setMatId(MATS.some((m) => m.id === "pa66gf") ? "pa66gf" : matId)],
    ["Reset", () => { setL(12); setH(2); setY(1.2); setDesign("constant"); setMatId("pc"); setMode("single"); }],
  ];

  return (
    <article className="pb-24 text-[var(--foreground)]">
      <header className="pt-12 pb-4">
        <a href="/tools/polymer-finder" className="text-[13px] text-[var(--accent)] hover:underline">
          ← Polymer Finder
        </a>
        <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--subtle)]">Learn · Interactive</p>
        <h1 className="mb-3 text-[clamp(24px,5vw,34px)] font-bold tracking-[-0.02em]">Why snap-fits break at the root</h1>
        <p className="max-w-[640px] text-[16px] leading-[1.75] text-[var(--muted)]">
          A snap-fit arm is a small cantilever beam with one job: bend far enough for the hook to pass the mating part, then spring
          back. Whether it survives comes down to one number, the strain at its root.
        </p>
      </header>

      {/* interactive */}
      <section className="rounded-[12px] border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5">
        <Scene L={L} h={h} y={y} design={design} t={t} limit={limit} />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={play}
            disabled={playing}
            className="rounded-lg bg-[var(--btn-bg)] px-3 py-1.5 text-[13px] font-semibold text-[var(--btn-text)] disabled:opacity-60"
          >
            ▶ Assemble
          </button>
          <input aria-label="Assembly progress" type="range" min={0} max={1} step={0.005} value={t} onChange={(e) => setT(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>

        <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Slider label="Arm length L" value={L} min={6} max={30} step={1} unit="mm" onChange={setL} />
            <Slider label="Thickness at root h" value={h} min={0.8} max={4} step={0.1} unit="mm" onChange={setH} />
            <Slider label="Undercut (tip deflection) y" value={y} min={0.3} max={3} step={0.1} unit="mm" onChange={setY} />
          </div>
          <div className="space-y-3 text-[13px] text-[var(--muted)]">
            <label className="block">
              Material
              <select value={matId} onChange={(e) => setMatId(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[13px] text-[var(--foreground)]">
                {MATS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Seg value={design} onChange={setDesign} options={[["constant", "Constant thickness"], ["tapered", "Tapered to h/2"]]} />
              <Seg value={mode} onChange={setMode} options={[["single", "Assemble once"], ["repeated", "Repeated"]]} />
            </div>
          </div>
        </div>

        {/* gauge */}
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-[12px] text-[var(--subtle)]">
            <span>Peak strain at the root when the hook passes</span>
            <span>
              <b className="text-[var(--foreground)]">{peak.toFixed(2)} %</b> of {limit} % allowed
            </span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, (ratio / 1.5) * 100)}%`, background: strainColor(ratio) }} />
            <div className="absolute top-0 h-full w-[2px] bg-[var(--foreground)]" style={{ left: `${100 / 1.5}%` }} title="Allowable strain" />
          </div>
          <div className="mt-3 rounded-lg px-3 py-2 text-[13px] leading-[1.6]" style={{ color: verdict.tone, background: verdict.bg }}>
            {verdict.text} Shortest arm that works here: <b>{Lmin.toFixed(1)} mm</b>.
          </div>
          <p className="mt-2 text-[12px] leading-[1.6] text-[var(--subtle)]">
            Allowable strain: {mat.limit.basis}
            {mode === "repeated" ? ", × 0.6 for repeated assembly" : ""}. <SrcA s={mat.limit.src} />
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="self-center text-[12px] text-[var(--subtle)]">Try:</span>
          {tryOut.map(([l, f]) => (
            <button key={l} type="button" onClick={f} className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-[12px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
              {l}
            </button>
          ))}
        </div>
      </section>

      {/* narrative */}
      <h2 className={H2}>1. The arm is a beam, and the root does all the work</h2>
      <p className={P}>
        Push down on the hook and the arm bends like a diving board. The bending moment is zero at the tip and largest where the
        arm meets the wall, so that is where the outer surface stretches most. Watch the colour in the demo: the root turns red
        first. Bayer&apos;s design guide puts it plainly: for these designs &ldquo;the vulnerable cross section is always at the
        root.&rdquo; <SrcA s={SNAP_SOURCES.bayer} />
      </p>

      <h2 className={H2}>2. One equation explains every design rule</h2>
      <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-center font-mono text-[16px]">
        ε<sub>root</sub> = y · h / (k · L²)
        <div className="mt-1 font-sans text-[12px] text-[var(--subtle)]">k = 0.67 for constant thickness, 1.09 tapered to h/2</div>
      </div>
      <p className={P}>From simple beam theory (small deflection, linear elastic material). Read it term by term:</p>
      <ul className="mb-3 space-y-2 pl-1 text-[15px] leading-[1.7] text-[var(--muted)]">
        <li>
          <b className="text-[var(--foreground)]">L² is the big lever.</b> Double the length and the strain drops to a quarter. When
          an arm fails, lengthen it first.
        </li>
        <li>
          <b className="text-[var(--foreground)]">Thinner means less strain.</b> A thinner arm bends with less stretch at its
          surface. The price is a weaker hold, so thickness is where you trade strain for retention force.
        </li>
        <li>
          <b className="text-[var(--foreground)]">The undercut sets the deflection.</b> Strain grows in direct proportion to how far
          the hook must move. A deeper undercut holds better but strains more.
        </li>
      </ul>

      <h2 className={H2}>3. Taper the arm to share the load</h2>
      <p className={P}>
        A constant-thickness arm wastes material: only the root is highly strained. Taper it to half thickness at the tip and the
        strain spreads along the arm (switch the demo to &ldquo;Tapered&rdquo; and watch the colour even out). Bayer reports this
        increases the permissible deflection by more than 60 % over a constant section, which is where k = 1.09 comes from.{" "}
        <SrcA s={SNAP_SOURCES.bayer} />
      </p>

      <h2 className={H2}>4. Where the allowable strain comes from</h2>
      <p className={P}>
        For Makrolon PC and Bayblend PC/ABS the demo uses Bayer&apos;s table of permissible short-term strains (4 % and 2.5 %).{" "}
        <SrcA s={SNAP_SOURCES.bayer} /> For the other materials it applies the Celanese rule of thumb to each reference
        grade&apos;s datasheet: 70 % of the yield strain, or 50 % of the strain at break for materials that break without yielding,
        and 60 % of that for parts that are assembled repeatedly. <SrcA s={SNAP_SOURCES.celanese} />
      </p>

      <h2 className={H2}>What this demo leaves out</h2>
      <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.7] text-[var(--muted)]">
        <li>A sharp corner at the root multiplies the local strain. Give the root a generous radius.</li>
        <li>Allowable strains are short-term values at room temperature. Cold, heat, moisture (nylons) and chemicals all change them.</li>
        <li>
          Assembly and retention forces need the secant modulus at the working strain, not the datasheet modulus, so they are not
          shown here. <SrcA s={SNAP_SOURCES.bayer} />
        </li>
        <li>Large deflections and non-rectangular sections need the full equations or FEA. Confirm with the resin supplier and with tests.</li>
      </ul>
    </article>
  );
}
