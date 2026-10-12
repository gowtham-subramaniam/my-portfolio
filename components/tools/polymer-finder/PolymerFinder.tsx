"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CHEM_LABELS,
  POLYMERS,
  RATING_LABELS,
  type ChemKey,
  type Compat,
  type Family,
  type Polymer,
  type Processing,
  type Rating,
} from "./polymers";
import { FIELD_NOTE_CATEGORIES, notesFor, type FieldNoteCategory } from "./fieldNotes";
import { ALL_SOURCES, sourcesFor } from "./sources";
import { ALL_READING, readingFor } from "./reading";
import Term from "./Term";
import type { TermKey } from "./glossary";
import { quizFor } from "./quiz";
import { REFS, fmtVal } from "./refs";
import { isVerified, valueText, type VKey } from "./verified";
import { designFor, escFor, joiningFor, medicalFor, opticalFor, ricFor, snapFitFor, type Item } from "./guides";
import {
  MODEL_ID,
  getDocEmbeddings,
  keywordScores,
  loadEmbedder,
  parseQuery,
  rank,
  semanticScores,
  type Check,
  type ParsedQuery,
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

function keyStats(p: Polymer) {
  const v = (key: VKey, unit: string) => ({ value: valueText(p, key, unit), ok: isVerified(p, key) as boolean | null });
  return [
    { label: "Cont. use", term: "contUse", ...v("contUseC", "°C") },
    { label: "HDT 1.8 MPa", term: "hdt", ...v("hdtC", "°C") },
    { label: "Tensile", term: "tensile", ...v("tensileMPa", "MPa") },
    p.modulusGPa !== null
      ? { label: "Modulus", term: "modulus", ...v("modulusGPa", "GPa") }
      : { label: "Hardness", term: "hardness", value: p.hardness?.split(" ")[0] ?? "—", ok: isVerified(p, "hardness") as boolean | null },
    { label: "Density", term: "density", ...v("density", "g/cm³") },
    { label: "Cost", term: "cost", value: "$".repeat(p.costTier), ok: null },
  ] satisfies { label: string; term: TermKey; value: string; ok: boolean | null }[];
}

/** ✓ for values from the reference datasheet; "typ." for older typical values not yet tied to a datasheet. */
function Mark({ ok }: { ok: boolean | null }) {
  if (ok === null) return null;
  return ok ? (
    <span className="ml-1 align-super text-[10px] font-bold text-[#1a5c2a]" title="From the reference-grade datasheet (see Details)">
      ✓
    </span>
  ) : (
    <span className="ml-1 align-super text-[9px] font-medium text-[var(--faint)]" title="Typical value, not verified against a datasheet">
      typ.
    </span>
  );
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
      id={`pf-${p.id}`}
      className={`scroll-mt-28 rounded-[10px] border bg-[var(--card-bg)] px-5 py-[1.1rem] sm:px-6 ${
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
            <dt className="text-[11px] text-[var(--subtle)]">
              <Term k={s.term}>{s.label}</Term>
            </dt>
            <dd className={`text-[14px] font-semibold tabular-nums ${s.ok === false ? "text-[var(--subtle)]" : "text-[var(--foreground)]"}`}>
              {s.value}
              <Mark ok={s.ok} />
            </dd>
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

      {result.why.length > 0 && (
        <p className="mt-2 text-[12px] text-[var(--accent)]">
          <span className="font-semibold">Why it matches:</span> {result.why.join(" · ")}
        </p>
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
        <span className="text-[12px] text-[var(--subtle)]">
          {p.watchOuts.length} watch-out{p.watchOuts.length === 1 ? "" : "s"}
          {notesFor(p.id).length > 0 && ` · ${notesFor(p.id).length} field note${notesFor(p.id).length === 1 ? "" : "s"}`}
        </span>
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
    <div className="mt-4 border-t border-[var(--border)] pt-4 text-[14px]">
      <ReferenceGrade p={p} />
      <WatchOuts p={p} />
      <PracticalReading p={p} />
      <div className="mt-5 grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <ListBlock title="Strengths" items={p.strengths} />
        <ListBlock title="Limitations" items={p.limitations} />
        <ListBlock title="Typical uses" items={p.uses} />
      </div>
      <div className="space-y-4">
        <div>
          <h4 className={`mb-1.5 ${LABEL}`}>
            <Term k="chem">Chemical resistance</Term>
          </h4>
          <p className="mb-1.5 text-[11px] text-[var(--faint)]">General guidance, not from a specific datasheet</p>
          <table className="w-full text-[13px]">
            <tbody>
              {(Object.keys(CHEM_LABELS) as ChemKey[]).map((k) => (
                <tr key={k} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-1 pr-2 text-[var(--muted)]">
                    <Term k={k}>{CHEM_LABELS[k]}</Term>
                  </td>
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
          <p className="mb-1 text-[11px] text-[var(--faint)]">General guidance; gamma checked against Nordion&apos;s compatibility guide</p>
          <div className="flex flex-wrap gap-x-4 text-[13px] text-[var(--muted)]">
            <span>
              <Term k="steam">Steam</Term>: <b className={compatTone[p.sterilization.autoclave]}>{compatText[p.sterilization.autoclave]}</b>
            </span>
            <span>
              <Term k="gamma">Gamma</Term>: <b className={compatTone[p.sterilization.gamma]}>{compatText[p.sterilization.gamma]}</b>
            </span>
            <span>
              <Term k="eto">EtO</Term>: <b className={compatTone[p.sterilization.eto]}>{compatText[p.sterilization.eto]}</b>
            </span>
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
          <Row k="Structure" term="structure" v={p.structure} />
          <Row k="Tg" term="tgtm" v={valueText(p, "tgC", "°C")} ok={isVerified(p, "tgC")} />
          <Row k="Tm" term="tgtm" v={valueText(p, "tmC", "°C")} ok={isVerified(p, "tmC")} />
          <Row k="Elongation at break" term="elongation" v={valueText(p, "elongationPct", "%")} ok={isVerified(p, "elongationPct")} />
          {p.hardness && <Row k="Hardness" term="hardness" v={p.hardness} ok={isVerified(p, "hardness")} />}
          <Row k="Water abs. (24 h)" term="water" v={valueText(p, "waterAbsPct", "%")} ok={isVerified(p, "waterAbsPct")} />
          <Row k="Transparency" term="transparency" v={p.transparency[0].toUpperCase() + p.transparency.slice(1)} />
          <Row k="UL94" term="ul94" v={p.ul94} ok={isVerified(p, "ul94")} />
          <Row k="UV / weathering" term="uv" v={`${RATING_LABELS[p.uv]} (unstabilized, general guidance)`} />
          <Row k="Processing" term="processes" v={p.processes.join(", ")} />
          <Row k="Also known as" term="aka" v={p.aka.join(", ")} />
        </dl>
        <ProcessingBlock pr={p.processing} elastomer={p.structure === "Elastomer" && p.processes.some((x) => /compression|transfer/i.test(x))} />
      </div>
      </div>
      <GuideSections p={p} />
      <KnowledgeCheck p={p} />
      <FieldNotes p={p} />
    </div>
  );
}

function ReferenceGrade({ p }: { p: Polymer }) {
  const r = REFS[p.id];
  if (!r)
    return (
      <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[12px] leading-[1.6] text-[var(--subtle)]">
        <b className="text-[var(--muted)]">No manufacturer datasheet linked yet.</b> All values for {p.abbr} are typical figures (marked <i>typ.</i>) that
        haven&apos;t been checked against a manufacturer&apos;s own document.
      </div>
    );
  const rows: [string, string][] = [];
  const dag = (f?: { alt?: boolean }) => (f?.alt ? " †" : "");
  const add = (label: string, f: { v: number | [number, number]; std: string; atLeast?: boolean; alt?: boolean } | undefined, unit: string) => {
    if (f) rows.push([label, `${fmtVal(f.v, unit, f.atLeast)} · ${f.std}${dag(f)}`]);
  };
  add("Density", r.density, "g/cm³");
  if (r.tensile) rows.push([`Tensile (${r.tensile.what === "strength" ? "strength, not stated as yield or break" : r.tensile.what})`, `${fmtVal(r.tensile.v, "MPa")} · ${r.tensile.std}${dag(r.tensile)}`]);
  add("Tensile modulus", r.modulus, "MPa");
  add("Elongation at break", r.elongation, "%");
  add("HDT 1.8 MPa", r.hdt, "°C");
  add("Tg", r.tg, "°C");
  add("Tm", r.tm, "°C");
  add("Water abs. 24 h", r.water24h, "%");
  add("Max. service temp.", r.contUse, "°C");
  if (r.ul94) rows.push(["Flammability", `${r.ul94.v} · ${r.ul94.std}${dag(r.ul94)}`]);
  if (r.hardness) rows.push(["Hardness", `${r.hardness.v} · ${r.hardness.std}${dag(r.hardness)}`]);
  return (
    <div className="mb-4 rounded-lg border border-[#cfe8cf] bg-[#f4fbf4] px-4 py-3">
      <h4 className="mb-1 flex flex-wrap items-baseline gap-x-2 text-[13px] font-bold text-[#1a5c2a]">
        <span aria-hidden>✓</span> Reference datasheet:{" "}
        <a href={r.src.url} target="_blank" rel="noreferrer" className="underline decoration-[#9fd09f] underline-offset-2 hover:text-[#0f3d1a]">
          {r.grade}
        </a>
      </h4>
      <p className="mb-2 text-[12px] leading-[1.6] text-[#2f5d3a]">
        {r.kind === "stock"
          ? "No named grade could be opened, so these are a supplier's stock-shape values. "
          : r.kind === "report"
            ? "Values from the compound's published test report. "
            : ""}
        Card values marked ✓ come from this {r.kind === "report" ? "report" : "datasheet"}; values marked <i>typ.</i> are typical figures not yet tied to a
        source.
        {r.note && ` ${r.note}`}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12px]">
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-[#2f5d3a]">{k}</dt>
            <dd className="min-w-0 break-words text-[#14361f]">{v}</dd>
          </Fragment>
        ))}
      </dl>
      {r.other && r.other.length > 0 && <p className="mt-1.5 text-[12px] leading-[1.6] text-[#2f5d3a]">Also published: {r.other.join(" · ")}</p>}
      {r.alt && (
        <p className="mt-1 text-[12px] leading-[1.6] text-[#2f5d3a]">
          † Not in the manufacturer document above; from{" "}
          <a href={r.alt.url} target="_blank" rel="noreferrer" className="underline decoration-[#9fd09f] underline-offset-2">
            {r.alt.label}
          </a>
          , which publishes the manufacturer&apos;s data.
        </p>
      )}
    </div>
  );
}

function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.text} className="text-[13px] leading-[1.6] text-[var(--muted)]">
          {it.text}{" "}
          <a href={it.src.url} target="_blank" rel="noreferrer" className="break-words text-[12px] text-[var(--accent)] hover:underline">
            [{it.src.label}]
          </a>
        </li>
      ))}
    </ul>
  );
}

function GuideSections({ p }: { p: Polymer }) {
  const thermoset = p.structure === "Elastomer" && !["tpu", "tpv", "tpc", "peba"].includes(p.id);
  const ric = ricFor(p.id);
  const sections: [string, Item[]][] = [
    ["Design for molding", designFor(p.id, p.structure === "Elastomer")],
    ["Snap-fit strain", snapFitFor(p.id)],
    ["Joining", joiningFor(p.id, p.structure, thermoset)],
    ["Optical", opticalFor(p.id)],
    ["Medical & food-contact grades", medicalFor(p.id)],
    ["Known stress-cracking agents", escFor(p.id)],
    ["Recycling", ric ? [ric] : []],
  ];
  const shown = sections.filter(([, items]) => items.length > 0);
  if (shown.length === 0) return null;
  return (
    <div className="mt-6 grid gap-x-6 gap-y-5 border-t border-[var(--border)] pt-4 md:grid-cols-2">
      {shown.map(([title, items]) => (
        <div key={title}>
          <h4 className={`mb-1.5 ${LABEL}`}>{title}</h4>
          <ItemList items={items} />
        </div>
      ))}
    </div>
  );
}

function KnowledgeCheck({ p }: { p: Polymer }) {
  const questions = useMemo(() => quizFor(p), [p]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const answered = Object.keys(picked).length;
  const correct = questions.filter((q) => picked[q.id] === q.answer).length;
  if (questions.length === 0) return null;
  return (
    <div className="mt-6 border-t border-[var(--border)] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className={LABEL}>Knowledge check</h4>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="text-[13px] font-semibold text-[var(--accent)] hover:underline"
        >
          {open ? "Hide ▴" : `Test yourself on ${p.abbr} (${questions.length} questions) ▾`}
        </button>
      </div>
      {open && (
        <div className="mt-3">
          <p className="mb-3 text-[12px] leading-[1.6] text-[var(--subtle)]">Every answer comes from the reference datasheet linked at the top of these details.</p>
          <ol className="space-y-4">
            {questions.map((q, qi) => {
              const choice = picked[q.id];
              const done = choice !== undefined;
              return (
                <li key={q.id}>
                  <div className="mb-1.5 text-[14px] font-semibold text-[var(--foreground)]">
                    {qi + 1}. {q.prompt}
                  </div>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={q.prompt}>
                    {q.options.map((o, i) => {
                      const isAnswer = i === q.answer;
                      const tone = !done
                        ? "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--accent)]"
                        : isAnswer
                          ? "border-[#cfe8cf] bg-[#f0faf0] text-[#1a5c2a]"
                          : i === choice
                            ? "border-[#f0cfc8] bg-[#fdf0ee] text-[#8a2a1a]"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--faint)]";
                      return (
                        <button
                          key={o}
                          type="button"
                          disabled={done}
                          onClick={() => setPicked((s) => ({ ...s, [q.id]: i }))}
                          aria-pressed={i === choice}
                          className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium ${tone}`}
                        >
                          {done && isAnswer && <span aria-hidden>✓ </span>}
                          {done && i === choice && !isAnswer && <span aria-hidden>✕ </span>}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {done && (
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--muted)]" aria-live="polite">
                      <b className={choice === q.answer ? "text-[#1a5c2a]" : "text-[#8a2a1a]"}>{choice === q.answer ? "Correct." : "Not quite."}</b> {q.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          {answered > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px]">
              <span className="font-semibold text-[var(--foreground)]">
                Score: {correct} / {answered}
                {answered === questions.length && (correct === questions.length ? " · You know " + p.abbr + " well." : "")}
              </span>
              <button type="button" onClick={() => setPicked({})} className="text-[var(--accent)] hover:underline">
                Start over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WatchOuts({ p }: { p: Polymer }) {
  if (p.watchOuts.length === 0) return null;
  return (
    <div className="rounded-lg border border-[#f0dcc0] bg-[#fdf6ee] px-4 py-3">
      <h4 className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-[#7a4010]">
        <span aria-hidden>⚠</span> Design &amp; manufacturing watch-outs
      </h4>
      <ul className="space-y-1.5 text-[14px] leading-[1.6] text-[#5a3410]">
        {p.watchOuts.map((w) => (
          <li key={w} className="flex gap-2">
            <span className="text-[#c98a2b]" aria-hidden>
              •
            </span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] leading-[1.6] text-[#7a4010]">
        <span className="font-semibold">Checked against: </span>
        {sourcesFor(p.id).map((src, i) => (
          <span key={src.url}>
            {i > 0 && " · "}
            <a href={src.url} target="_blank" rel="noreferrer" className="underline decoration-[#e0c49a] underline-offset-2 hover:text-[#5a3410]">
              {src.label}
            </a>
          </span>
        ))}
        . Points without a named source are general engineering guidance.
      </p>
    </div>
  );
}

function PracticalReading({ p }: { p: Polymer }) {
  const items = readingFor(p.id);
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className={`mb-1.5 ${LABEL}`}>Practical reading &amp; key lessons</h4>
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.url} className="text-[13px] leading-[1.55]">
            <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)] hover:underline">
              {r.title}
            </a>
            <span className="text-[var(--subtle)]"> · {r.source}</span>
            <div className="text-[var(--muted)]">{r.note}</div>
            <ul className="mt-1 space-y-0.5 border-l-2 border-[var(--accent-bg)] pl-3 text-[var(--muted)]">
              {r.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function range(r: [number, number] | null, unit: string) {
  return r ? `${r[0]}–${r[1]} ${unit}` : "—";
}

function ProcessingBlock({ pr, elastomer }: { pr: Processing; elastomer: boolean }) {
  return (
    <div>
      <h4 className={`mb-1.5 ${LABEL}`}>Processing (typical)</h4>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        <Row k="Mold shrinkage" term="shrink" v={range(pr.shrinkPct, "%")} />
        <Row k="Drying" term="drying" v={pr.dryC ? `${pr.dryC} °C, ${pr.dryH ?? "2–4"} h` : "Not normally required"} />
        <Row k={elastomer ? "Cure temp" : "Melt temp"} term={elastomer ? "cure" : "melt"} v={range(pr.meltC, "°C")} />
        {!elastomer && <Row k="Mold temp" term="mold" v={range(pr.moldC, "°C")} />}
      </dl>
      {pr.note && <p className="mt-1.5 text-[12px] leading-[1.6] text-[var(--subtle)]">{pr.note}</p>}
    </div>
  );
}

function FieldNotes({ p }: { p: Polymer }) {
  const notes = notesFor(p.id);
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 border-t border-[var(--border)] pt-4">
      <h4 className={`mb-2 ${LABEL}`}>Field notes from engineers</h4>
      {notes.length === 0 ? (
        <p className="text-[13px] leading-[1.6] text-[var(--subtle)]">
          No field notes for {p.abbr} yet. If you have molded, machined, bonded or sterilized it, your experience helps the next engineer.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n, i) => (
            <li key={i} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={PILL}>{n.category}</span>
                <span className="text-[12px] text-[var(--subtle)]">
                  {n.attribution ?? "Anonymous engineer"} · {n.date}
                </span>
              </div>
              <p className="text-[14px] leading-[1.65] text-[var(--muted)]">{n.note}</p>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <FieldNoteForm p={p} onClose={() => setOpen(false)} />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mt-3 text-[13px] font-semibold text-[var(--accent)] hover:underline">
          + Share your experience with {p.abbr}
        </button>
      )}
    </div>
  );
}

function FieldNoteForm({ p, onClose }: { p: Polymer; onClose: () => void }) {
  const [form, setForm] = useState({ category: "" as FieldNoteCategory | "", note: "", name: "", role: "", email: "", publishName: false, website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || form.note.trim().length < 20) {
      setState("error");
      setError("Please choose a category and write at least 20 characters.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/field-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, polymerId: p.id }),
      });
      if (res.ok) {
        setState("sent");
      } else {
        const j = await res.json().catch(() => ({}));
        setState("error");
        setError(j.error ?? "Couldn't send right now. Please try again later.");
      }
    } catch {
      setState("error");
      setError("Couldn't send right now. Please try again later.");
    }
  };

  if (state === "sent") {
    return (
      <div className="mt-3 rounded-lg border border-[#cfe8cf] bg-[#f0faf0] px-3 py-2 text-[13px] text-[#1a5c2a]">
        ✓ Thanks! Your note was sent for review. Notes are checked before they appear here.
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[14px] text-[var(--foreground)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]";
  const label = "mb-1 block text-[12px] font-semibold text-[var(--muted)]";

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="text-[14px] font-semibold text-[var(--foreground)]">Share a field note about {p.name}</div>
      <p className="text-[12px] leading-[1.6] text-[var(--subtle)]">
        What went wrong, what surprised you, or what you&apos;d tell a colleague. Notes are reviewed before publishing. Please leave out
        confidential details, part numbers and customer names.
      </p>
      <div>
        <label className={label} htmlFor={`fn-cat-${p.id}`}>
          Category
        </label>
        <select id={`fn-cat-${p.id}`} value={form.category} onChange={(e) => set("category", e.target.value as FieldNoteCategory)} className={input}>
          <option value="">Choose…</option>
          {FIELD_NOTE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor={`fn-note-${p.id}`}>
          Your note
        </label>
        <textarea
          id={`fn-note-${p.id}`}
          rows={4}
          maxLength={1500}
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder={`e.g. "Our ${p.abbr} housings cracked at the snap-fits after two weeks of wiping with…"`}
          className={`${input} resize-y`}
        />
        <div className="mt-0.5 text-right text-[11px] text-[var(--faint)]">{form.note.length}/1500</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`fn-name-${p.id}`}>
            Name (optional)
          </label>
          <input id={`fn-name-${p.id}`} value={form.name} maxLength={80} onChange={(e) => set("name", e.target.value)} className={input} />
        </div>
        <div>
          <label className={label} htmlFor={`fn-role-${p.id}`}>
            Role / industry (optional)
          </label>
          <input
            id={`fn-role-${p.id}`}
            value={form.role}
            maxLength={120}
            onChange={(e) => set("role", e.target.value)}
            placeholder="e.g. Process engineer, medical devices"
            className={input}
          />
        </div>
      </div>
      <div>
        <label className={label} htmlFor={`fn-email-${p.id}`}>
          Email (optional, never published; only used if I have a question)
        </label>
        <input id={`fn-email-${p.id}`} type="email" value={form.email} maxLength={160} onChange={(e) => set("email", e.target.value)} className={input} />
      </div>
      {/* Honeypot for bots; hidden from people and screen readers */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={form.website}
        onChange={(e) => set("website", e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <label className="flex cursor-pointer items-start gap-2 text-[13px] text-[var(--muted)]">
        <input type="checkbox" checked={form.publishName} onChange={(e) => set("publishName", e.target.checked)} className="mt-[3px] h-[14px] w-[14px] accent-[#2563a8]" />
        Show my name with the note (otherwise only the role is shown)
      </label>
      {state === "error" && <p className="text-[13px] text-[#8a2a1a]">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-lg bg-[var(--btn-bg)] px-4 py-2 text-[14px] font-semibold text-[var(--btn-text)] hover:opacity-90 disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Send for review"}
        </button>
        <button type="button" onClick={onClose} className="text-[13px] text-[var(--subtle)] hover:text-[var(--foreground)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Row({ k, v, term, ok }: { k: string; v: string; term?: TermKey; ok?: boolean }) {
  return (
    <>
      <dt className="text-[var(--subtle)]">{term ? <Term k={term}>{k}</Term> : k}</dt>
      <dd className={ok === false ? "text-[var(--subtle)]" : "text-[var(--foreground)]"}>
        {v}
        {ok !== undefined && <Mark ok={ok} />}
      </dd>
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

function vt(p: Polymer, key: VKey, unit: string) {
  const ok = isVerified(p, key);
  return (
    <span className={ok ? undefined : "text-[var(--subtle)]"}>
      {valueText(p, key, unit)}
      <Mark ok={ok} />
    </span>
  );
}

function CompareTable({ polymers, onRemove, onClear }: { polymers: Polymer[]; onRemove: (id: string) => void; onClear: () => void }) {
  const rows: { label: string; term?: TermKey; get: (p: Polymer) => ReactNode }[] = [
    { label: "Family", term: "family", get: (p) => p.family },
    { label: "Structure", term: "structure", get: (p) => p.structure },
    { label: "Continuous use", term: "contUse", get: (p) => vt(p, "contUseC", "°C") },
    { label: "HDT @ 1.8 MPa", term: "hdt", get: (p) => vt(p, "hdtC", "°C") },
    { label: "Tg", term: "tgtm", get: (p) => vt(p, "tgC", "°C") },
    { label: "Tm", term: "tgtm", get: (p) => vt(p, "tmC", "°C") },
    { label: "Tensile strength", term: "tensile", get: (p) => vt(p, "tensileMPa", "MPa") },
    { label: "Modulus / hardness", term: "modulus", get: (p) => (p.modulusGPa !== null ? vt(p, "modulusGPa", "GPa") : vt(p, "hardness", "")) },
    { label: "Elongation", term: "elongation", get: (p) => vt(p, "elongationPct", "%") },
    { label: "Density", term: "density", get: (p) => vt(p, "density", "g/cm³") },
    { label: "Water abs. (24 h)", term: "water", get: (p) => vt(p, "waterAbsPct", "%") },
    { label: "Transparency", term: "transparency", get: (p) => p.transparency[0].toUpperCase() + p.transparency.slice(1) },
    { label: "Steam autoclave", term: "steam", get: (p) => <b className={compatTone[p.sterilization.autoclave]}>{compatText[p.sterilization.autoclave]}</b> },
    { label: "Gamma", term: "gamma", get: (p) => <b className={compatTone[p.sterilization.gamma]}>{compatText[p.sterilization.gamma]}</b> },
    { label: "EtO", term: "eto", get: (p) => <b className={compatTone[p.sterilization.eto]}>{compatText[p.sterilization.eto]}</b> },
    ...(Object.keys(CHEM_LABELS) as ChemKey[]).map((k) => ({
      label: CHEM_LABELS[k],
      term: k as TermKey,
      get: (p: Polymer) => (
        <span className={`inline-block w-[74px] rounded-md px-1.5 py-[1px] text-center text-[12px] font-medium ${ratingTone[p.chem[k]]}`}>
          {RATING_LABELS[p.chem[k]]}
        </span>
      ),
    })),
    { label: "UL94", term: "ul94", get: (p) => vt(p, "ul94", "") },
    { label: "Reference grade", term: "basis", get: (p) => (REFS[p.id] ? <a href={REFS[p.id].src.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">{REFS[p.id].grade}</a> : "—") },
    {
      label: "UV / weathering",
      term: "uv",
      get: (p) => <span className={`inline-block w-[74px] rounded-md px-1.5 py-[1px] text-center text-[12px] font-medium ${ratingTone[p.uv]}`}>{RATING_LABELS[p.uv]}</span>,
    },
    { label: "Cost", term: "cost", get: (p) => "$".repeat(p.costTier) },
    { label: "Processing", term: "processes", get: (p) => p.processes.join(", ") },
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
                <td className="px-4 py-1.5 text-[var(--subtle)]">{r.term ? <Term k={r.term}>{r.label}</Term> : r.label}</td>
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

function ChipRow({
  title,
  hint,
  items,
  disabled,
  onToggle,
  tone,
}: {
  title: string;
  hint: string;
  items: { id: string; label: string }[];
  disabled: Set<string>;
  onToggle: (id: string) => void;
  tone: "solid" | "outline";
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-[12px] font-semibold text-[var(--muted)] sm:w-auto sm:min-w-[96px]">
        {title} <span className="font-normal text-[var(--subtle)]">· {hint}</span>
      </span>
      {items.map((c) => {
        const on = !disabled.has(c.id);
        const onCls =
          tone === "solid"
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]";
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(c.id)}
            className={`rounded-full border px-3 py-1 text-[13px] font-medium ${on ? onCls : "border-[var(--border)] bg-transparent text-[var(--faint)] line-through"}`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── Main component ───────────────────────────── */

export default function PolymerFinder() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedQuery | null>(null);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const query = parsed?.text ?? "";

  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const [modelPct, setModelPct] = useState<number | null>(null);
  const [sem, setSem] = useState<{ query: string; scores: number[] } | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [showExcluded, setShowExcluded] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

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
    setParsed(trimmed ? parseQuery(trimmed) : null);
    setDisabled(new Set());
    setExpanded(null);
    setShowExcluded(false);
    setShowOthers(false);
    if (trimmed) ensureModel();
  };

  const kw = useMemo(() => (parsed ? keywordScores(parsed.keywordText) : null), [parsed]);
  const semScores = sem && sem.query === query ? sem.scores : null;

  const ranking = useMemo(() => {
    if (!parsed || !kw) return null;
    return rank(parsed, disabled, kw, semScores);
  }, [parsed, kw, semScores, disabled]);

  const browseList: Result[] = useMemo(
    () =>
      [...POLYMERS]
        .sort((a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family) || a.name.localeCompare(b.name))
        .map((p) => ({ polymer: p, score: 0, relevance: 0, checks: [], warnings: 0, why: [] })),
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
  const modeLabel = !ranking
    ? ""
    : ranking.mode === "understood"
      ? `Ranked by what you asked for${semScores ? " · AI similarity breaks ties" : ""}`
      : ranking.mode === "semantic"
        ? "Nothing specific recognised · ranked by AI similarity"
        : "Ranked by how well each meets your requirements";

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
        <p className="mt-3 max-w-[620px] text-[13px] leading-[1.6] text-[var(--subtle)]">
          For screening only. Values marked ✓ come from the manufacturer documents linked in each material&apos;s details; always
          confirm with the datasheet for the exact grade you use. <a href="#pf-notice" className="text-[var(--accent)] hover:underline">About this data</a>
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

      {/* What the search understood */}
      {parsed && (
        <section className="mt-6" aria-label="Detected requirements">
          {parsed.corrections.length > 0 && (
            <p className="mb-3 text-[13px] text-[var(--muted)]">
              Searching for{" "}
              {parsed.corrections.map(([from, to], i) => (
                <span key={from}>
                  {i > 0 && ", "}
                  <b className="text-[var(--foreground)]">{to}</b> <span className="text-[var(--subtle)]">(you typed &ldquo;{from}&rdquo;)</span>
                </span>
              ))}
            </p>
          )}
          {parsed.constraints.length + parsed.signals.length === 0 ? (
            <p className="text-[14px] leading-[1.7] text-[var(--subtle)]">
              {kw?.some((v) => v > 0)
                ? "No requirements, applications or property preferences recognised; ranking by matching words."
                : "Nothing specific recognised yet. Try an application (gear, O-ring, catheter, housing, lens), a property (stiff, lightweight, tough, tensile > 100 MPa), or a requirement (150 °C, autoclavable, resists IPA)."}
            </p>
          ) : (
            <div className="space-y-2">
              <ChipRow
                title="Requirements"
                hint="must pass"
                items={parsed.constraints.map((c) => ({ id: c.id, label: c.label }))}
                disabled={disabled}
                onToggle={toggleConstraint}
                tone="solid"
              />
              <ChipRow
                title="Application"
                hint="ranks materials used this way"
                items={parsed.signals.filter((x) => x.kind === "app")}
                disabled={disabled}
                onToggle={toggleConstraint}
                tone="outline"
              />
              <ChipRow
                title="Preferences"
                hint="ranks by property data"
                items={parsed.signals.filter((x) => x.kind === "pref")}
                disabled={disabled}
                onToggle={toggleConstraint}
                tone="outline"
              />
              <p className="text-[12px] text-[var(--subtle)]">Click a chip to turn it off.</p>
            </div>
          )}
        </section>
      )}

      {comparePolymers.length >= 2 && <CompareTable polymers={comparePolymers} onRemove={toggleCompare} onClear={() => setCompare([])} />}

      {/* Results */}
      <section className="mt-10" aria-live="polite">
        {ranking ? (
          <>
            <SectionHeading right={<span className="text-[12px] text-[var(--subtle)]">{modeLabel}</span>}>
              {ranking.best.length > 0
                ? `${ranking.best.length} best match${ranking.best.length === 1 ? "" : "es"}`
                : ranking.others.length > 0
                  ? "No strong matches"
                  : "No matches"}
            </SectionHeading>
            {ranking.best.length > 0 ? (
              <ol className="flex flex-col gap-4">{ranking.best.map((r) => card(r, { showRelevance: true }))}</ol>
            ) : ranking.others.length > 0 ? (
              <p className="text-[14px] leading-[1.7] text-[var(--muted)]">
                Nothing stands out for that description. The materials below meet any requirements you gave; try adding an
                application or a property to narrow them down.
              </p>
            ) : (
              <p className="text-[14px] leading-[1.7] text-[var(--muted)]">
                No material meets every requirement. Turn a requirement off above, or open the excluded list below to see what
                comes closest.
              </p>
            )}

            {ranking.others.length > 0 && (
              <div className="mt-8">
                <button
                  type="button"
                  aria-expanded={showOthers || ranking.best.length === 0}
                  onClick={() => setShowOthers((s) => !s)}
                  className="mb-4 text-[14px] font-semibold text-[var(--subtle)] hover:text-[var(--foreground)]"
                >
                  {showOthers || ranking.best.length === 0 ? "▾" : "▸"} {ranking.others.length} other material
                  {ranking.others.length === 1 ? "" : "s"} {ranking.mode === "understood" && parsed?.constraints.length ? "that also meet your requirements" : ""}
                </button>
                {(showOthers || ranking.best.length === 0) && (
                  <ol className="flex flex-col gap-4">{ranking.others.map((r) => card(r, { showRelevance: false }))}</ol>
                )}
              </div>
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
        <p className="mb-3 rounded-lg bg-[var(--accent-bg)] px-4 py-3 text-[14px] text-[var(--muted)]">
          <b className="text-[var(--foreground)]">Know something the datasheets don&apos;t say?</b> Open any material&apos;s details and use
          &ldquo;Share your experience&rdquo; to send a field note. Notes are reviewed before they&apos;re published.
        </p>
        <section id="pf-notice" aria-label="About this data" className="scroll-mt-28 space-y-2">
          <h2 className="text-[14px] font-bold text-[var(--muted)]">About this data</h2>
          <p>
            <b className="text-[var(--muted)]">Screening aid, not design data.</b> Values marked ✓ are typical values copied from the
            manufacturer or supplier document linked in each material&apos;s details, with its test standard. Values marked
            &ldquo;typ.&rdquo; are general typical figures not yet tied to a source. Chemical, sterilization and UV ratings are general
            guidance and assume room temperature and no applied stress. Other grades of the same polymer can differ widely.
          </p>
          <p>
            <b className="text-[var(--muted)]">No warranty.</b> This tool is provided as is, without any warranty of accuracy or fitness for
            a purpose. Always design from the current datasheet for the exact grade you will use, and test parts in your application.
            Nothing here is a recommendation for a regulated use; medical and food-contact suitability belongs to specific grades and must
            be confirmed with the supplier.
          </p>
          <p>
            <b className="text-[var(--muted)]">Trademarks.</b> Trade names such as Makrolon, Delrin, Zytel, Ultem, VICTREX, Teflon and
            others are trademarks of their respective owners and are used only to identify the products that the data describes. This site
            is not affiliated with, sponsored or endorsed by any material supplier.
          </p>
          <p>
            <b className="text-[var(--muted)]">Sources.</b> Only publicly available documents are cited, and only individual values are
            quoted, each with a link to the original. If you own a document cited here and would like a change, please use the{" "}
            <a href="/contact" className="text-[var(--accent)] hover:underline">contact page</a>.
          </p>
        </section>
        <details className="mt-2">
          <summary className="cursor-pointer">Practical reading ({ALL_READING.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {ALL_READING.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                  {r.title}
                </a>{" "}
                · {r.source}. {r.note}
              </li>
            ))}
          </ul>
        </details>
        <details className="mt-2">
          <summary className="cursor-pointer">References ({ALL_SOURCES.length})</summary>
          <ul className="mt-2 space-y-1">
            {ALL_SOURCES.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                  {src.label}
                </a>
              </li>
            ))}
          </ul>
        </details>
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
