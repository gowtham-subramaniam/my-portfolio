/**
 * Knowledge check: short quizzes generated from the dataset itself, so every
 * answer is exactly what the material's card says (correct by construction).
 * Questions are skipped when the data can't give a single unambiguous answer.
 */

import { CHEM_LABELS, POLYMERS, RATING_LABELS, type ChemKey, type Compat, type Polymer } from "./polymers";

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

function build(id: string, prompt: string, correct: string, wrong: string[], explanation: string, keepOrder = false): QuizQuestion {
  const options = keepOrder ? [correct, ...wrong] : shuffle([correct, ...wrong], id);
  const ordered = keepOrder ? [...options].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)) : options;
  return { id, prompt, options: ordered, answer: ordered.indexOf(correct), explanation };
}

const ORDER = ["Yes", "Limited", "No"];

/** Pick distractor values at least `gap` away from the answer and from each other, close enough to be plausible. */
function numericDistractors(value: number, pool: number[], gap: number, n: number): number[] | null {
  const uniq = [...new Set(pool)].filter((v) => Math.abs(v - value) >= gap).sort((a, b) => Math.abs(a - value) - Math.abs(b - value));
  const out: number[] = [];
  for (const v of uniq) {
    if (out.every((o) => Math.abs(o - v) >= gap)) out.push(v);
    if (out.length === n) return out;
  }
  return null;
}

const compatWord: Record<Compat, string> = { yes: "Yes", limited: "Limited", no: "No" };
const steamMeaning: Record<Compat, string> = {
  yes: "suitable for repeated cycles",
  limited: "only a limited number of cycles, or only with specific grades",
  no: "not suitable",
};
const gammaMeaning: Record<Compat, string> = {
  yes: "tolerates typical sterilization doses",
  limited: "usable with care: expect some yellowing or property loss, or choose a radiation-stabilized grade",
  no: "degrades (embrittles) at typical sterilization doses",
};

export function quizFor(p: Polymer): QuizQuestion[] {
  const qs: QuizQuestion[] = [];

  // 1. Continuous-use temperature
  const contPool = POLYMERS.filter((o) => o.id !== p.id).map((o) => o.contUseC);
  const contWrong = numericDistractors(p.contUseC, contPool, 25, 3);
  if (contWrong) {
    qs.push(
      build(
        `${p.id}-cont`,
        `Roughly what is the maximum continuous-use temperature of a typical ${p.abbr} grade?`,
        `${p.contUseC} °C`,
        contWrong.map((v) => `${v} °C`),
        `About ${p.contUseC} °C for the grade these numbers are based on (${p.grade}).` +
          (p.hdtC !== null ? ` Its HDT at 1.8 MPa is ${p.hdtC} °C: HDT is a short-term softening point under load, not a long-term limit.` : ""),
      ),
    );
  }

  // 2. Steam autoclave
  const ac = p.sterilization.autoclave;
  qs.push(
    build(
      `${p.id}-steam`,
      `Can ${p.abbr} be steam autoclaved repeatedly?`,
      compatWord[ac],
      (["yes", "limited", "no"] as Compat[]).filter((c) => c !== ac).map((c) => compatWord[c]),
      `${compatWord[ac]}: ${steamMeaning[ac]}. Continuous-use temperature is ${p.contUseC} °C` +
        (p.tgC !== null && p.structure === "Amorphous" ? ` and Tg is ${p.tgC} °C` : "") +
        `, against steam at 121–134 °C.`,
      true,
    ),
  );

  // 3. Gamma
  const g = p.sterilization.gamma;
  qs.push(
    build(
      `${p.id}-gamma`,
      `Is ${p.abbr} compatible with gamma sterilization?`,
      compatWord[g],
      (["yes", "limited", "no"] as Compat[]).filter((c) => c !== g).map((c) => compatWord[c]),
      `${compatWord[g]}: ${gammaMeaning[g]}. For comparison, ethylene oxide (EtO) compatibility is ${compatWord[p.sterilization.eto]}.`,
      true,
    ),
  );

  // 4. Weakest chemical class, only when a single class is clearly worst
  const rank = { E: 3, G: 2, F: 1, P: 0 } as const;
  const keys = Object.keys(CHEM_LABELS) as ChemKey[];
  const worst = Math.min(...keys.map((k) => rank[p.chem[k]]));
  const worstKeys = keys.filter((k) => rank[p.chem[k]] === worst);
  if (worstKeys.length === 1 && worst <= 1) {
    const w = worstKeys[0];
    const others = shuffle(
      keys.filter((k) => rank[p.chem[k]] >= worst + 2),
      `${p.id}-chemwrong`,
    ).slice(0, 3);
    if (others.length === 3) {
      qs.push(
        build(
          `${p.id}-chem`,
          `Which of these chemical classes is ${p.abbr} least resistant to?`,
          CHEM_LABELS[w],
          others.map((k) => CHEM_LABELS[k]),
          `${CHEM_LABELS[w]}: rated ${RATING_LABELS[p.chem[w]]}. ` +
            others.map((k) => `${CHEM_LABELS[k]}: ${RATING_LABELS[p.chem[k]]}`).join("; ") +
            ". Ratings assume room temperature and no applied stress.",
        ),
      );
    }
  }

  // 5. Structure (thermoplastics only)
  if (p.structure !== "Elastomer") {
    const amorph = p.structure === "Amorphous";
    qs.push(
      build(
        `${p.id}-struct`,
        `Is ${p.abbr} amorphous or semi-crystalline?`,
        p.structure,
        [amorph ? "Semi-crystalline" : "Amorphous"],
        amorph
          ? `Amorphous (Tg ${p.tgC ?? "—"} °C, no melting point). It softens above Tg and shrinks fairly evenly${p.transparency === "clear" ? ", and can be optically clear" : ""}.`
          : `Semi-crystalline (melts at about ${p.tmC} °C). Crystals give chemical and fatigue resistance but higher, less uniform mold shrinkage.`,
      ),
    );
  }

  // 6. Moisture: does it need drying before molding?
  if (p.processes.some((x) => /injection/i.test(x)) && p.structure !== "Elastomer") {
    const dry = p.processing.dryC !== null;
    qs.push(
      build(
        `${p.id}-dry`,
        `Does ${p.abbr} normally need drying before injection molding?`,
        dry ? "Yes" : "No",
        [dry ? "No" : "Yes"],
        dry
          ? `Yes: typically ${p.processing.dryC} °C for about ${p.processing.dryH ?? "2–4"} h in a desiccant dryer. Water absorption (24 h) is ${p.waterAbsPct}%.`
          : `Not normally. Water absorption (24 h) is only ${p.waterAbsPct}%, although surface moisture from cold storage can still cause splay.`,
        true,
      ),
    );
  }

  return qs;
}
