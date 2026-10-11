"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CHEM_LABELS,
  POLYMERS,
  RATING_LABELS,
  type ChemKey,
  type Compat,
  type Family,
  type Polymer,
  type Rating,
} from "./polymers";
import {
  MODEL_ID,
  getDocEmbeddings,
  keywordScores,
  loadEmbedder,
  parseConstraints,
  rank,
  semanticScores,
  type Check,
  type Constraint,
  type Result,
} from "./search";

type ModelStatus = "idle" | "loading" | "ready" | "error";

const EXAMPLES = [
  "Clear housing that survives repeated autoclaving and hospital disinfectants",
  "Optically clear microfluidic cartridge, low autofluorescence, gamma sterilized",
  "Low-friction gear, dimensionally stable, low cost",
  "O-ring for fuel and oil at 150 °C",
  "Pump housing resistant to bleach and acids",
  "Flame-retardant electrical enclosure, injection molded",
];

const FAMILY_ORDER: Family[] = ["Commodity", "Engineering", "High-performance", "Fluoropolymer", "Elastomer"];
const MAX_COMPARE = 3;

/* Palette — matches the site's skill tags and blog pills */
const PILL = "inline-block rounded-full border border-[#bdd4f4] bg-[#eef4fc] px-[9px] py-[2px] text-[11px] font-semibold text-[#1a4a8a]";
const LABEL = "text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--subtle)]";

const checkTone: Record<Check["status"], string> = {
  pass: "border-[#cfe8cf] bg-[#f0faf0] text-[#1a5c2a]",
  warn: "border-[#f0dcc0] bg-[#fdf6ee] text-[#7a4010]",
  fail: "border-[#f0cfc8] bg-[#fdf0ee] text-[#8a2a1a]",
};
const checkIcon: Record<Check["status"], string> = { pass: "✓", warn: "!", fail: "✕" };

const ratingTone: Record<Rating, string> = {
  E: "bg-[#1a5c2a] text-white",
  G: "bg-[#e3f3e3] text-[#1a5c2a]",
  F: "bg-[#fdf0dc] text-[#7a4010]",
  P: "bg-[#fbe3de] text-[#8a2a1a]",
};

const compatText: Record<Compat, string> = { yes: "Yes", limited: "Limited", no: "No" };
const compatTone: Record<Compat, string> = {
  yes: "text-[#1a5c2a]",
  limited: "text-[#7a4010]",
  no: "text-[#8a2a1a]",
};

function fmt(v: number | null | undefined, unit = "") {
  if (v === null || v === undefined) return "—";
  return `${v}${unit}`;
}

function keyStats(p: Polymer) {
  return [
    { label: "Cont. use", value: fmt(p.contUseC, " °C") },
    { label: "HDT 1.8 MPa", value: fmt(p.hdtC, " °C") },
    { label: "Tensile", value: fmt(p.tensileMPa, " MPa") },
    p.modulusGPa !== null
      ? { label: "Modulus", value: fmt(p.modulusGPa, " GPa") }
      : { label: "Hardness", value: p.hardness?.split(" ")[0] ?? "—" },
    { label: "Density", value: fmt(p.density, " g/cm³") },
    { label: "Cost", value: "$".repeat(p.costTier) },
  ];
}

function SectionHeading({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-[10px]">
        <div className="h-[22px] w-1 rounded-sm bg-[var(--accent)]" />
        <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[var(--accent)]">{children}</h2>
      </div>
      {right}
    </div>
  );
}

/* ───────────────────────────── Result card ───────────────────────────── */

function ResultCard({
  result,
  showRelevance,
  expanded,
  onToggleExpand,
  compared,
  compareDisabled,
  onToggleCompare,
  dimmed,
}: {
  result: Result;
  showRelevance: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  compared: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
  dimmed?: boolean;
}) {
  const p = result.polymer;
  return (
    <li
      className={`rounded-[10px] border bg-[var(--card-bg)] px-5 py-[1.1rem] sm:px-6 ${
        compared ? "border-[var(--accent)]" : "border-[var(--border)]"
      } ${dimmed ? "opacity-75" : ""}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-[18px] font-bold tracking-[-0.01em] text-[var(--foreground)]">{p.name}</h3>
        <span className="text-[14px] font-semibold text-[var(--subtle)]">{p.abbr}</span>
        <span className={PILL}>{p.family}</span>
      </div>

      {showRelevance && (
        <div className="mt-2 flex items-center gap-2" title="Relative match to your description">
          <div className="h-[5px] w-36 overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(5, result.relevance * 100)}%` }} />
          </div>
          <span className="text-[12px] text-[var(--subtle)]">match</span>
        </div>
      )}

      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
        {keyStats(p).map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-[11px] text-[var(--subtle)]">{s.label}</dt>
            <dd className="text-[14px] font-semibold tabular-nums text-[var(--foreground)]">{s.value}</dd>
          </div>
        ))}
      </dl>

      {result.checks.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {result.checks.map((c) => (
            <li key={c.constraint.id} className={`flex items-center gap-1.5 rounded-md border px-2 py-[2px] text-[12px] ${checkTone[c.status]}`}>
              <span className="font-bold" aria-hidden>
                {checkIcon[c.status]}
              </span>
              {c.detail}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[14px] leading-[1.7] text-[var(--muted)]">{p.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="text-[13px] font-semibold text-[var(--accent)] hover:underline"
        >
          {expanded ? "Hide details ▴" : "Details ▾"}
        </button>
        <label
          className={`flex items-center gap-2 text-[13px] font-medium ${
            compareDisabled && !compared ? "cursor-not-allowed text-[var(--faint)]" : "cursor-pointer text-[var(--muted)]"
          }`}
        >
          <input
            type="checkbox"
            checked={compared}
            disabled={compareDisabled && !compared}
            onChange={onToggleCompare}
            className="h-[15px] w-[15px] accent-[#2563a8]"
          />
          Compare
        </label>
      </div>

      {expanded && <Details p={p} />}
    </li>
  );
}

function Details({ p }: { p: Polymer }) {
  return (
    <div className="mt-4 grid gap-6 border-t border-[var(--border)] pt-4 text-[14px] md:grid-cols-2">
      <div className="space-y-4">
        <ListBlock title="Strengths" items={p.strengths} />
        <ListBlock title="Limitations" items={p.limitations} />
        <ListBlock title="Typical uses" items={p.uses} />
      </div>
      <div className="space-y-4">
        <div>
          <h4 className={`mb-1.5 ${LABEL}`}>Chemical resistance</h4>
          <table className="w-full text-[13px]">
            <tbody>
              {(Object.keys(CHEM_LABELS) as ChemKey[]).map((k) => (
                <tr key={k} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-1 pr-2 text-[var(--muted)]">{CHEM_LABELS[k]}</td>
                  <td className="py-1 text-right">
                    <span className={`inline-block w-[74px] rounded-md px-1.5 py-[1px] text-center text-[12px] font-medium ${ratingTone[p.chem[k]]}`}>
                      {RATING_LABELS[p.chem[k]]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className={`mb-1.5 ${LABEL}`}>Sterilization</h4>
          <div className="flex flex-wrap gap-x-4 text-[13px] text-[var(--muted)]">
            <span>
              Steam: <b className={compatTone[p.sterilization.autoclave]}>{compatText[p.sterilization.autoclave]}</b>
            </span>
            <span>
              Gamma: <b className={compatTone[p.sterilization.gamma]}>{compatText[p.sterilization.gamma]}</b>
            </span>
            <span>
              EtO: <b className={compatTone[p.sterilization.eto]}>{compatText[p.sterilization.eto]}</b>
            </span>
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
          <Row k="Structure" v={p.structure} />
          <Row k="Tg / Tm" v={`${fmt(p.tgC, " °C")} / ${fmt(p.tmC, " °C")}`} />
          <Row k="Elongation" v={fmt(p.elongationPct, " %")} />
          {p.hardness && <Row k="Hardness" v={p.hardness} />}
          <Row k="Water abs. (24 h)" v={fmt(p.waterAbsPct, " %")} />
          <Row k="Transparency" v={p.transparency[0].toUpperCase() + p.transparency.slice(1)} />
          <Row k="UL94 (base)" v={p.ul94} />
          <Row k="Grades" v={[p.medical && "Medical", p.food && "Food contact"].filter(Boolean).join(", ") || "—"} />
          <Row k="Processing" v={p.processes.join(", ")} />
          <Row k="Also known as" v={p.aka.join(", ")} />
          <Row k="Data basis" v={p.grade} />
        </dl>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-[var(--subtle)]">{k}</dt>
      <dd className="text-[var(--foreground)]">{v}</dd>
    </>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className={`mb-1.5 ${LABEL}`}>{title}</h4>
      <ul className="space-y-1 text-[var(--muted)]">
        {items.map((s) => (
          <li key={s} className="flex gap-2">
            <span className="text-[var(--faint)]">–</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────────── Comparison table ───────────────────────────── */

function CompareTable({ polymers, onRemove, onClear }: { polymers: Polymer[]; onRemove: (id: string) => void; onClear: () => void }) {
  const rows: { label: string; get: (p: Polymer) => ReactNode }[] = [
    { label: "Family", get: (p) => p.family },
    { label: "Structure", get: (p) => p.structure },
    { label: "Continuous use", get: (p) => fmt(p.contUseC, " °C") },
    { label: "HDT @ 1.8 MPa", get: (p) => fmt(p.hdtC, " °C") },
    { label: "Tg / Tm", get: (p) => `${fmt(p.tgC, " °C")} / ${fmt(p.tmC, " °C")}` },
    { label: "Tensile strength", get: (p) => fmt(p.tensileMPa, " MPa") },
    { label: "Modulus / hardness", get: (p) => (p.modulusGPa !== null ? fmt(p.modulusGPa, " GPa") : p.hardness ?? "—") },
    { label: "Elongation", get: (p) => fmt(p.elongationPct, " %") },
    { label: "Density", get: (p) => fmt(p.density, " g/cm³") },
    { label: "Water abs. (24 h)", get: (p) => fmt(p.waterAbsPct, " %") },
    { label: "Transparency", get: (p) => p.transparency[0].toUpperCase() + p.transparency.slice(1) },
    { label: "Steam autoclave", get: (p) => <b className={compatTone[p.sterilization.autoclave]}>{compatText[p.sterilization.autoclave]}</b> },
    { label: "Gamma", get: (p) => <b className={compatTone[p.sterilization.gamma]}>{compatText[p.sterilization.gamma]}</b> },
    { label: "EtO", get: (p) => <b className={compatTone[p.sterilization.eto]}>{compatText[p.sterilization.eto]}</b> },
    ...(Object.keys(CHEM_LABELS) as ChemKey[]).map((k) => ({
      label: CHEM_LABELS[k],
      get: (p: Polymer) => (
        <span className={`inline-block w-[74px] rounded-md px-1.5 py-[1px] text-center text-[12px] font-medium ${ratingTone[p.chem[k]]}`}>
          {RATING_LABELS[p.chem[k]]}
        </span>
      ),
    })),
    { label: "UL94 (base grade)", get: (p) => p.ul94 },
    { label: "Cost", get: (p) => "$".repeat(p.costTier) },
    { label: "Processing", get: (p) => p.processes.join(", ") },
  ];

  return (
    <section className="mt-10" aria-label="Material comparison">
      <SectionHeading
        right={
          <button type="button" onClick={onClear} className="text-[13px] font-medium text-[var(--subtle)] hover:text-[var(--foreground)]">
            Clear comparison
          </button>
        }
      >
        Comparison
      </SectionHeading>
      <div className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--card-bg)]">
        <table className="w-full min-w-[520px] text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="w-44 px-4 py-3 text-left font-normal text-[var(--subtle)]">Property</th>
              {polymers.map((p) => (
                <th key={p.id} className="px-4 py-3 text-left align-top">
                  <div className="text-[15px] font-bold text-[var(--foreground)]">{p.abbr}</div>
                  <div className="text-[12px] font-normal text-[var(--subtle)]">{p.name}</div>
                  <button type="button" onClick={() => onRemove(p.id)} className="mt-1 text-[12px] font-normal text-[var(--accent)] hover:underline">
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-1.5 text-[var(--subtle)]">{r.label}</td>
                {polymers.map((p) => (
                  <td key={p.id} className="px-4 py-1.5 text-[var(--foreground)]">
                    {r.get(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────────────────────────── Main component ───────────────────────────── */

export default function PolymerFinder() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());

  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const [modelPct, setModelPct] = useState<number | null>(null);
  const [sem, setSem] = useState<{ query: string; scores: number[] } | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [showExcluded, setShowExcluded] = useState(false);

  // Download the model on first interaction, not on page load.
  const ensureModel = useCallback(() => {
    if (modelStatus !== "idle") return;
    setModelStatus("loading");
    loadEmbedder(({ pct }) => {
      if (pct !== null) setModelPct(Math.round(pct));
    })
      .then(() => getDocEmbeddings())
      .then(() => setModelStatus("ready"))
      .catch((err) => {
        console.error("Polymer Finder: embedding model failed to load", err);
        setModelStatus("error");
      });
  }, [modelStatus]);

  useEffect(() => {
    if (modelStatus !== "ready" || !query || sem?.query === query) return;
    let cancelled = false;
    semanticScores(query)
      .then((scores) => {
        if (!cancelled) setSem({ query, scores });
      })
      .catch((err) => console.error("Polymer Finder: semantic search failed", err));
    return () => {
      cancelled = true;
    };
  }, [modelStatus, query, sem]);

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    setInput(q);
    setQuery(trimmed);
    setConstraints(trimmed ? parseConstraints(trimmed) : []);
    setDisabled(new Set());
    setExpanded(null);
    setShowExcluded(false);
    if (trimmed) ensureModel();
  };

  const activeConstraints = useMemo(() => constraints.filter((c) => !disabled.has(c.id)), [constraints, disabled]);
  const kw = useMemo(() => (query ? keywordScores(query) : null), [query]);
  const semScores = sem && sem.query === query ? sem.scores : null;

  const ranking = useMemo(() => {
    if (!query || !kw) return null;
    return rank(activeConstraints, kw, semScores);
  }, [query, kw, semScores, activeConstraints]);

  const browseList: Result[] = useMemo(
    () =>
      [...POLYMERS]
        .sort((a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family) || a.name.localeCompare(b.name))
        .map((p) => ({ polymer: p, score: 0, relevance: 0, checks: [], warnings: 0 })),
    [],
  );

  const toggleConstraint = (id: string) =>
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_COMPARE ? prev : [...prev, id]));

  const comparePolymers = compare.map((id) => POLYMERS.find((p) => p.id === id)).filter((p): p is Polymer => Boolean(p));
  const searchMode = semScores ? "semantic" : "keyword";

  const card = (r: Result, opts: { showRelevance: boolean; dimmed?: boolean }) => (
    <ResultCard
      key={r.polymer.id}
      result={r}
      showRelevance={opts.showRelevance}
      dimmed={opts.dimmed}
      expanded={expanded === r.polymer.id}
      onToggleExpand={() => setExpanded(expanded === r.polymer.id ? null : r.polymer.id)}
      compared={compare.includes(r.polymer.id)}
      compareDisabled={compare.length >= MAX_COMPARE}
      onToggleCompare={() => toggleCompare(r.polymer.id)}
    />
  );

  return (
    <div className="pb-24 text-[var(--foreground)]">
      {/* Header */}
      <header className="pt-12 pb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {["Materials", "Polymers", "Tool"].map((t) => (
            <span key={t} className={PILL}>
              {t}
            </span>
          ))}
        </div>
        <h1 className="mb-3 text-[clamp(24px,5vw,34px)] font-bold tracking-[-0.02em]">Polymer Finder</h1>
        <p className="max-w-[620px] text-[16px] leading-[1.75] text-[var(--muted)]">
          Describe your part and its environment in plain language. Requirements like temperature, sterilization and chemical
          exposure are checked against {POLYMERS.length} engineering polymers, then the candidates are ranked by how well they
          fit your description.
        </p>
      </header>

      {/* Search */}
      <form
        className="border-t border-[var(--border)] pt-8"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(input);
        }}
      >
        <label htmlFor="pf-query" className="mb-1.5 block text-[13px] font-semibold text-[var(--muted)]">
          Describe the application
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            id="pf-query"
            value={input}
            rows={2}
            onFocus={ensureModel}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                runSearch(input);
              }
            }}
            placeholder="e.g. Clear fluid manifold, autoclavable, resists IPA and bleach, 130 °C"
            className="min-h-[3.5rem] flex-1 resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-[14px] py-[10px] text-[15px] text-[var(--foreground)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--btn-bg)] px-6 py-[11px] text-[15px] font-semibold tracking-[-0.01em] text-[var(--btn-text)] hover:opacity-90"
          >
            Find materials
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[var(--subtle)]">
          <ModelBadge status={modelStatus} pct={modelPct} />
          {query && (
            <button type="button" onClick={() => runSearch("")} className="font-medium hover:text-[var(--foreground)]">
              Clear search · browse all
            </button>
          )}
        </div>

        {!query && (
          <div className="mt-6">
            <div className="mb-2 text-[13px] font-semibold text-[var(--muted)]">Try an example</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => runSearch(ex)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-left text-[13px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Detected requirements */}
      {query && (
        <section className="mt-6" aria-label="Detected requirements">
          <div className="mb-2 text-[13px] font-semibold text-[var(--muted)]">
            Requirements detected{constraints.length > 0 && <span className="font-normal text-[var(--subtle)]"> · click to turn off</span>}
          </div>
          {constraints.length === 0 ? (
            <p className="text-[14px] leading-[1.7] text-[var(--subtle)]">
              None detected, so materials are ranked by your description only. Mention a temperature (e.g. &ldquo;150 °C&rdquo;),
              sterilization, chemicals, transparency, flame rating or cost to filter.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {constraints.map((c) => {
                const on = !disabled.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleConstraint(c.id)}
                    className={`rounded-full border px-3 py-1 text-[13px] font-medium ${
                      on
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-transparent text-[var(--faint)] line-through"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {comparePolymers.length >= 2 && <CompareTable polymers={comparePolymers} onRemove={toggleCompare} onClear={() => setCompare([])} />}

      {/* Results */}
      <section className="mt-10" aria-live="polite">
        {ranking ? (
          <>
            <SectionHeading
              right={<span className="text-[12px] text-[var(--subtle)]">{searchMode === "semantic" ? "Ranked by meaning + keywords" : "Ranked by keywords"}</span>}
            >
              {ranking.matches.length} candidate{ranking.matches.length === 1 ? "" : "s"}
            </SectionHeading>
            {ranking.matches.length === 0 ? (
              <p className="text-[14px] leading-[1.7] text-[var(--muted)]">
                No material meets every requirement. Turn a requirement off above, or open the excluded list below to see what
                comes closest.
              </p>
            ) : (
              <ol className="flex flex-col gap-4">{ranking.matches.map((r) => card(r, { showRelevance: true }))}</ol>
            )}

            {ranking.excluded.length > 0 && (
              <div className="mt-8">
                <button
                  type="button"
                  aria-expanded={showExcluded}
                  onClick={() => setShowExcluded((s) => !s)}
                  className="mb-4 text-[14px] font-semibold text-[var(--subtle)] hover:text-[var(--foreground)]"
                >
                  {showExcluded ? "▾" : "▸"} {ranking.excluded.length} excluded by your requirements
                </button>
                {showExcluded && <ol className="flex flex-col gap-4">{ranking.excluded.map((r) => card(r, { showRelevance: false, dimmed: true }))}</ol>}
              </div>
            )}
          </>
        ) : (
          <>
            <SectionHeading>All materials ({POLYMERS.length})</SectionHeading>
            <ol className="flex flex-col gap-4">{browseList.map((r) => card(r, { showRelevance: false }))}</ol>
          </>
        )}
      </section>

      {/* Compare tray */}
      {compare.length === 1 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--background)]/95 px-5 py-3 text-[14px] text-[var(--muted)] backdrop-blur">
          <div className="mx-auto flex max-w-[740px] items-center justify-between gap-4">
            <span>
              <b className="text-[var(--foreground)]">{comparePolymers[0]?.abbr}</b> selected. Pick up to {MAX_COMPARE - 1} more to compare.
            </span>
            <button type="button" onClick={() => setCompare([])} className="text-[13px] font-medium text-[var(--subtle)] hover:text-[var(--foreground)]">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Footer note */}
      <footer className="mt-14 border-t border-[var(--border)] pt-6 text-[13px] leading-[1.7] text-[var(--subtle)]">
        <p>
          <b className="text-[var(--muted)]">Screening aid only.</b> Values are typical for a representative unfilled grade unless
          noted under &ldquo;Data basis&rdquo;; real grades vary widely. Chemical ratings assume room temperature and no applied
          stress. Confirm with supplier datasheets and test in your application.
        </p>
        <p className="mt-2">
          Search runs entirely in your browser using the Hugging Face model{" "}
          <a href={`https://huggingface.co/${MODEL_ID}`} className="text-[var(--accent)] hover:underline" target="_blank" rel="noreferrer">
            {MODEL_ID}
          </a>{" "}
          via Transformers.js. Your descriptions never leave your device.
        </p>
      </footer>
    </div>
  );
}

function ModelBadge({ status, pct }: { status: ModelStatus; pct: number | null }) {
  const dot = {
    idle: "bg-[var(--faint)]",
    loading: "bg-[#c98a2b] animate-pulse",
    ready: "bg-[#2f8a4a]",
    error: "bg-[#b54a32]",
  }[status];
  const text = {
    idle: "AI search loads on first use (~23 MB, cached by your browser)",
    loading: `Loading AI model${pct !== null ? ` · ${pct}%` : "…"}. Keyword results are shown meanwhile`,
    ready: "AI search ready · runs locally in your browser",
    error: "AI model unavailable, so keyword search is being used",
  }[status];
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dot}`} />
      {text}
    </span>
  );
}
