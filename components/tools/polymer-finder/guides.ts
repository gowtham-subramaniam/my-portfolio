/**
 * Design, joining, optical, medical, stress-cracking and recycling information
 * per material. Every item carries the source it was taken from. Where a rule
 * from a source is applied to a datasheet value (snap-fit strain), the
 * calculation is shown in full.
 */

import { REFS } from "./refs";

export interface Src {
  label: string;
  url: string;
}
export interface Item {
  text: string;
  src: Src;
}

const S = {
  protolabsDG: { label: "Protolabs injection molding design guidelines", url: "https://protolabs.com/services/injection-molding/plastic-injection-molding/design-guidelines" },
  dupont: { label: "DuPont General Design Principles, Module I", url: "https://www.academic.sun.ac.za/mad/catalogs/dfmguidelines/dupontgeneraldesignprinciples.pdf" },
  bayer: { label: "Bayer MaterialScience, Snap-Fit Joints for Plastics", url: "https://fab.cba.mit.edu/classes/S62.12/people/vernelle.noel/Plastic_Snap_fit_design.pdf" },
  celanese: {
    label: "Celanese, Snap-Fits for Assembly and Disassembly (T. Spahr)",
    url: "https://www.docketalarm.com/cases/PTAB/IPR2017-01990/Inter_Partes_Review_of_U.S._Pat._6631715/12-12-2017-Patent_Owner/Exhibit-2002-18-Exhibit_2002_Snap_Fits_Celanese/",
  },
  dukane: { label: "Dukane, Demystifying plastic compatibility in ultrasonic welding", url: "https://www.dukane.com/resources/blog/item/demystifying-plastic-compatibility-in-ultrasonic-welding" },
  polyone: { label: "PolyOne, TPE Overmolding Solutions for Engineering Thermoplastics", url: "https://gravi-tech.polyone.com/sites/default/files/resources/TPE_Overmolding_Solutions_for_Engineering_Thermoplastics.pdf" },
  loctite: { label: "Loctite Design Guide for Bonding Plastics (Henkel)", url: "https://dm.henkel-dam.com/is/content/henkel/Design-Guide-Bonding-Plastics" },
  apollo: { label: "Apollo Optical Systems, Common polymers for optical components", url: "https://www.apollooptical.com/common-polymers-for-optical-components" },
  piruska: { label: "Piruska et al., The autofluorescence of plastic materials and chips (RSC, 2005)", url: "https://pubs.rsc.org/en/content/articlehtml/2005/lc/b508288a" },
  astm: { label: "ASTM International, Resin Identification Code revisions (ASTM D7611)", url: "https://newsroom.astm.org/node/3040/printable/print" },
  exponent: { label: "Exponent, Is your cleaning protocol harming your plastic parts?", url: "https://www.exponent.com/sites/default/files/media/documents/tl_is-your-covid19-cleaning-protocol-harming-your-plastic-parts.pdf" },
  tmd: { label: "Today's Medical Developments, Polymer compatibility with harsh healthcare disinfectants", url: "https://todaysmedicaldevelopments.com/article/materials-polymer-compatibility-harsh-healthcare-disinfectants" },
  sepe22: { label: "PlasticsToday, The Materials Analyst Part 22", url: "https://www.plasticstoday.com/materials/the-materials-analyst-part-22-stress-cracking-how-to-avoid-this-silent-killer-part-1-" },
  sepe23: { label: "PlasticsToday, The Materials Analyst Part 23 (1999)", url: "https://www.plasticstoday.com/materials-analyst-part-23stress-cracking-how-avoid-killer-part-2" },
  makrolon2458: { label: "Covestro, Makrolon 2458 product page", url: "https://solutions.covestro.com/en/products/makrolon/makrolon-2458_000000000057533971" },
  solvayHC: { label: "Solvay, High-Performance Plastics for Healthcare (2017)", url: "https://www.solvay.com/sites/g/files/srpend221/files/2018-07/healthcare-specialty-polymers-en.pdf" },
  invibio: {
    label: "Victrex plc news release (13 Apr 2017)",
    url: "https://www.victrexplc.com/news/invibio-around-9-million-implanted-devices-worldwide-now-using-peek-optima-polymer-international-peek-meeting-upcoming/",
  },
  topasMed: { label: "TOPAS, Medical grade resin", url: "https://topas.com/medical-grade-resin" },
  eastar: { label: "Eastman, Eastar MN058 product page", url: "https://www.eastman.com/en/products/product-detail/71068566/eastar-copolyester-mn058" },
  purell: { label: "LyondellBasell, Purell brochure", url: "https://www.lyondellbasell.com/49313d/globalassets/sites/2021/fakuma/olefins-and-polyolefins/purellconceptbrochure.pdf" },
  ultemHU: { label: "Ultrapolymers, ULTEM HU1000 product page", url: "https://ultrapolymers.com/en-NL/products/100351607-ultem-hu1000" },
  trinseo: { label: "Trinseo, Acrylic medical solutions", url: "https://www.trinseo.com/industries/medical/acrylic-medical-solutions-americas" },
  topasTDS: { label: "TOPAS 6013M-07 datasheet", url: "https://topas.com/wp-content/uploads/2023/05/TDS-6013M-07_e.pdf" },
  tpx: { label: "Mitsui Chemicals, TPX brochure", url: "https://ap.mitsuichemicals.com/sites/default/files/media/document/2018/tpx_e.pdf" },
  eastar6763: { label: "Eastman, Eastar copolyester 6763 brochure (MBS-80Q)", url: "https://eastman.com/content/dam/eastman/corporate/en/literature/m/mbs80.pdf" },
  ultraformPro: { label: "BASF, Ultraform N2320 003 PRO AT processing data sheet", url: "https://download.basf.com/p1/8a8082587fd4b608017fd6446cf77c4b/en/ULTRAFORM%25C2%25AE_N2320_003_PRO_AT" },
} satisfies Record<string, Src>;

export const GUIDE_SOURCES: Src[] = Object.values(S);

/* ── Design for molding ── */

const WALL: Record<string, [string, number, number]> = {
  // Protolabs table, mm
  abs: ["ABS", 1.143, 3.556],
  pom: ["Acetal", 0.762, 3.048],
  pomh: ["Acetal", 0.762, 3.048],
  pmma: ["Acrylic", 0.635, 12.7],
  lcp: ["Liquid crystal polymer", 0.762, 3.048],
  pa6: ["Nylon", 0.762, 2.921],
  pa66: ["Nylon", 0.762, 2.921],
  pa11: ["Nylon", 0.762, 2.921],
  pa12: ["Nylon", 0.762, 2.921],
  pa46: ["Nylon", 0.762, 2.921],
  pc: ["Polycarbonate", 1.016, 3.81],
  pet: ["Polyester", 0.635, 3.175],
  pbt: ["Polyester", 0.635, 3.175],
  hdpe: ["Polyethylene", 0.762, 5.08],
  ldpe: ["Polyethylene", 0.762, 5.08],
  pps: ["Polyphenylene sulfide", 0.508, 4.572],
  pp: ["Polypropylene", 0.889, 3.81],
  gpps: ["Polystyrene", 0.889, 3.81],
  hips: ["Polystyrene", 0.889, 3.81],
  tpu: ["Polyurethane", 2.032, 19.05],
};

const DRAFT: Record<string, [string, string, string]> = {
  // DuPont Table 3.01: shallow (< 25 mm deep), deep (> 25 mm deep)
  pbt: ["CRASTIN PBT", "0–¼°", "½°"],
  pomh: ["DELRIN", "0–¼°", "½°"],
  pa66: ["ZYTEL", "0–⅛°", "¼–½°"],
  pa66gf: ["Reinforced nylons", "¼–½°", "½–1°"],
  pbtgf: ["Reinforced PBT", "½°", "½–1°"],
};

export function designFor(id: string, elastomer: boolean): Item[] {
  if (elastomer && id !== "tpu") return [];
  const out: Item[] = [];
  const w = WALL[id];
  if (w) out.push({ text: `Recommended wall thickness (${w[0]}): ${w[1]}–${w[2]} mm`, src: S.protolabsDG });
  const d = DRAFT[id];
  if (d) out.push({ text: `Draft for smooth finish (${d[0]}): ${d[1]} under 25 mm deep, ${d[2]} deeper; add 1° per 0.025 mm of texture depth`, src: S.dupont });
  out.push({ text: "Ribs about ½ to ⅔ of the wall they reinforce; deep ribs need about ¼–½° draft", src: S.dupont });
  out.push({ text: "General draft: 0.5° on vertical faces minimum, 2° for most faces, 3° at shut-offs and light texture, 5°+ for heavier texture", src: S.protolabsDG });
  return out;
}

/* ── Snap-fits ── */

export interface SnapLimit {
  /** Allowable strain for a single assembly, % */
  single: number;
  /** Allowable strain for repeated assembly, % */
  repeated: number;
  /** One line on where the number comes from */
  basis: string;
  src: Src;
}

/** Numeric allowable snap-fit strain, from the same sources as snapFitFor. */
export function snapLimit(id: string): SnapLimit | null {
  if (id === "pc") return { single: 4, repeated: 2.4, basis: "Bayer table value for unreinforced Makrolon PC at 23 °C", src: S.bayer };
  if (id === "pcabs") return { single: 2.5, repeated: 1.5, basis: "Bayer table value for Bayblend PC/ABS at 23 °C", src: S.bayer };
  const r = REFS[id];
  if (!r) return null;
  if (r.yieldStrain !== undefined) {
    const a = +(0.7 * r.yieldStrain).toFixed(1);
    return { single: a, repeated: +(0.6 * a).toFixed(1), basis: `70 % of the ${r.yieldStrain} % yield strain of ${r.grade}`, src: S.celanese };
  }
  if (r.tensile?.what === "break" && r.elongation && !Array.isArray(r.elongation.v) && !r.elongation.atLeast) {
    const a = +(0.5 * r.elongation.v).toFixed(2);
    return { single: a, repeated: +(0.6 * a).toFixed(2), basis: `50 % of the ${r.elongation.v} % strain at break of ${r.grade}`, src: S.celanese };
  }
  return null;
}

export const SNAP_SOURCES = { bayer: S.bayer, celanese: S.celanese };

export function snapFitFor(id: string): Item[] {
  if (id === "pc")
    return [
      { text: "Permissible short-term strain 4 % for Makrolon PC (unreinforced, 23 °C, single assembly). For frequent separation and rejoining use about 60 % of this (≈ 2.4 %).", src: S.bayer },
      { text: "Glass-reinforced Makrolon: 2.2 % (10 % glass), 2.0 % (20 % glass).", src: S.bayer },
    ];
  if (id === "pcabs")
    return [{ text: "Permissible short-term strain 2.5 % for Bayblend PC/ABS (23 °C, single assembly). For frequent separation and rejoining use about 60 % (≈ 1.5 %).", src: S.bayer }];
  const r = REFS[id];
  if (!r) return [];
  if (r.yieldStrain !== undefined) {
    const a = +(0.7 * r.yieldStrain).toFixed(1);
    const b = +(0.6 * a).toFixed(1);
    return [
      {
        text: `Rule of thumb: up to 70 % of the yield strain. ${r.grade} yields at ${r.yieldStrain} % (datasheet), so ≈ ${a} % for a single assembly and ≈ ${b} % (60 % of that) for repeated assembly. Confirm with the supplier.`,
        src: S.celanese,
      },
    ];
  }
  if (r.tensile?.what === "break" && r.elongation && !Array.isArray(r.elongation.v) && !r.elongation.atLeast) {
    const a = +(0.5 * r.elongation.v).toFixed(2);
    const b = +(0.6 * a).toFixed(2);
    return [
      {
        text: `Rule of thumb for materials that break without yielding: up to 50 % of the strain at break. ${r.grade} breaks at ${r.elongation.v} % (datasheet), so ≈ ${a} % for a single assembly and ≈ ${b} % for repeated assembly. Confirm with the supplier.`,
        src: S.celanese,
      },
    ];
  }
  return [];
}

/* ── Joining ── */

const STYRENIC_WELD = new Set(["gpps", "hips", "pc", "pmma", "abs", "san", "asa", "pcabs"]);
const OVERMOLD: Record<string, string> = {
  pc: "Lexan 141",
  abs: "Cycolac T1000",
  pcabs: "Cycoloy C2950",
  pa6: "Zytel 7331F",
  pa66: "Zytel 101L",
};
const LOCTITE: Record<string, string> = {
  pomh: "Acetal Homopolymer",
  pmma: "Acrylic (PMMA)",
  asa: "ASA",
  abs: "ABS",
  ptfe: "Fluoropolymers",
  fep: "Fluoropolymers",
  pfa: "Fluoropolymers",
  etfe: "Fluoropolymers",
  lcp: "Liquid Crystal Polymer",
  pa6: "Polyamide (Nylon)",
  pa66: "Polyamide (Nylon)",
  pa11: "Polyamide (Nylon)",
  pa12: "Polyamide (Nylon)",
  pa46: "Polyamide (Nylon)",
  pa66gf: "Polyamide (Nylon)",
  pbt: "Polybutylene Terephthalate",
  pbtgf: "Polybutylene Terephthalate",
  pc: "Polycarbonate",
  peek: "PEEK",
  peekcf: "PEEK",
  pei: "Polyetherimide",
  pes: "Polyethersulfone",
  hdpe: "Polyethylene",
  ldpe: "Polyethylene",
  uhmwpe: "Polyethylene",
  pet: "Polyethylene Terephthalate",
  pi: "Polyimide",
  pmp: "Polymethylpentene",
  ppe: "Polyphenylene Oxide",
  pps: "Polyphenylene Sulfide",
  pp: "Polypropylene",
  gpps: "Polystyrene",
  hips: "Polystyrene",
  tpu: "Polyurethane",
  pvc: "Polyvinyl Chloride",
  san: "Styrene-Acrylonitrile",
};

export function joiningFor(id: string, structure: string, thermoset: boolean): Item[] {
  const out: Item[] = [];
  if (!thermoset) {
    out.push({
      text: "Ultrasonic welding works best between parts of the same base resin; different grades should have melt temperatures within 4–5 °C and melt flow within 1 g/10 min of each other. Glass, fillers, colorants and flame retardants can change compatibility.",
      src: S.dukane,
    });
    if (STYRENIC_WELD.has(id))
      out.push({ text: "Polystyrene, polycarbonate, acrylic and ABS commonly weld to each other; styrene-based resins are often compatible.", src: S.dukane });
    else if (structure === "Semi-crystalline")
      out.push({ text: "No known chemical cross-compatibility for semi-crystalline resins: weld only to the same resin, or use staking, swaging or spot welding.", src: S.dukane });
  }
  if (OVERMOLD[id])
    out.push({
      text: `TPE overmolding: PolyOne's overmold TPE grades exceeded their 13 pli acceptance level for peel adhesion on ${OVERMOLD[id]}.`,
      src: S.polyone,
    });
  if (LOCTITE[id])
    out.push({ text: `Adhesive shear-strength data for this plastic is in the Loctite guide, section "${LOCTITE[id]}".`, src: S.loctite });
  return out;
}

/* ── Optical ── */

const OPTICAL: Record<string, Item[]> = {
  pmma: [
    { text: "Refractive index 1.49, Abbe number 55–57, transmission 92.1 % (550 nm, 1.5 mm), haze 0.5–2 %", src: S.apollo },
    { text: "Autofluorescence: injection-molded PMMA chips had the lowest of the chips tested (PMMA < COC < PC); chips were typically 5–10× higher than BoroFloat glass. The molded PMMA chip rose unexpectedly at 633 nm.", src: S.piruska },
  ],
  pc: [
    { text: "Refractive index 1.59, Abbe number 30, transmission 89.9 % (550 nm, 1.5 mm), high birefringence", src: S.apollo },
    { text: "Autofluorescence: highest of the chips tested (PMMA < COC < PC). A 2 mm PC sheet was about 40× BoroFloat glass at 633 nm, more at shorter wavelengths.", src: S.piruska },
  ],
  gpps: [{ text: "Refractive index 1.59, Abbe number 31, transmission 88.8 % (550 nm, 1.5 mm), haze 2–3 %", src: S.apollo }],
  coc: [
    { text: "Refractive index 1.53, Abbe number 56, transmission 90.7 % (550 nm, 1.5 mm), low birefringence. COP: 1.53, 56, 91.0 %.", src: S.apollo },
    { text: "TOPAS 6013M-07: light transmission 91 % at 2 mm, refractive index 1.53", src: S.topasTDS },
    { text: "Autofluorescence: between PMMA and PC among the chips tested (PMMA < COC < PC).", src: S.piruska },
  ],
  pmp: [{ text: "TPX RT18 / RT31: light transmittance 94 % (ASTM D1003), refractive index 1.462 at 589 nm (ASTM D542)", src: S.tpx }],
  pei: [{ text: "Refractive index 1.68, Abbe number 19, high birefringence", src: S.apollo }],
  petg: [{ text: "Eastar 6763 film (250 µm): total transmission 91 %, haze 0.8 % (ASTM D1003)", src: S.eastar6763 }],
  lsr: [
    {
      text: "Autofluorescence: PDMS (Sylgard 184, a cast silicone, not an LSR grade) was the lowest of the plastics tested, comparable to BoroFloat glass at 633 nm and 2–3× higher at other wavelengths.",
      src: S.piruska,
    },
  ],
};
export function opticalFor(id: string): Item[] {
  return OPTICAL[id] ?? [];
}

/* ── Medical and food-contact grades ── */

const MEDICAL: Record<string, Item[]> = {
  pc: [{ text: "Makrolon 2458: \"biocompatible according to many ISO 10993-1 test requirements\"; suitable for EtO and steam sterilization at 121 °C; food contact listed among uses needing Covestro approval.", src: S.makrolon2458 }],
  psu: [
    { text: "Udel PSU offered for limited-contact (< 24 h) devices; Eviva PSU for implants (> 24 h). ISO 10993-1 biocompatibility testing performed.", src: S.solvayHC },
  ],
  ppsu: [
    { text: "Radel PPSU offered for limited-contact (< 24 h) devices; Veriva PPSU for implants (> 24 h). ISO 10993-1 biocompatibility testing performed.", src: S.solvayHC },
  ],
  pes: [{ text: "Veradel HC PESU offered for limited-contact (< 24 h) devices. ISO 10993-1 biocompatibility testing performed.", src: S.solvayHC }],
  peek: [
    { text: "KetaSpire PEEK for limited contact (< 24 h); Zeniva PEEK for implants (> 24 h). ISO 10993-1 biocompatibility testing performed.", src: S.solvayHC },
    { text: "Invibio PEEK-OPTIMA: used in about 9 million implanted devices worldwide (as of April 2017).", src: S.invibio },
  ],
  coc: [{ text: "TOPAS offers a USP Class VI / ISO 10993 series of medical-grade resins and was the first polymer line certified to USP <661.1>.", src: S.topasMed }],
  petg: [{ text: "Eastar MN058: \"Meets ISO 10993 and/or USP Class VI biocompatibility requirements\"; gamma and e-beam color stable.", src: S.eastar }],
  pom: [{ text: "Ultraform N2320 003 PRO AT (BASF): biocompatibility USP Class VI, ISO 10993-5.", src: S.ultraformPro }],
  pp: [{ text: "Purell PP grades: compliant with Ph. Eur. and/or USP; Drug Master Files filed with the FDA; ISO 10993 references in regulatory documents.", src: S.purell }],
  ldpe: [{ text: "Purell LDPE grades (e.g., PE 1840H): compliant with Ph. Eur. and/or USP; DMFs filed with the FDA.", src: S.purell }],
  hdpe: [{ text: "Purell HDPE grades (e.g., GC7260): compliant with Ph. Eur. and/or USP; DMFs filed with the FDA.", src: S.purell }],
  pei: [{ text: "ULTEM HU1000: biocompatible (ISO 10993 or USP Class VI); may resist steam, H₂O₂, gamma, EtO, UV-C and e-beam; food-contact compliant in most jurisdictions.", src: S.ultemHU }],
  pmma: [{ text: "Medical-grade PLEXIGLAS acrylic resins with ISO 10993 compliance; gamma, e-beam and EtO listed.", src: S.trinseo }],
};
export function medicalFor(id: string): Item[] {
  return MEDICAL[id] ?? [];
}

/* ── Stress-cracking agents ── */

const ESC: Record<string, Item[]> = {
  pc: [
    { text: "Named as susceptible to cleaners containing fragrances, humectants or preservatives, and to essential oils.", src: S.exponent },
    { text: "Toluene is used as a stress-cracking test agent; an aromatic petroleum distillate in marking ink cracked PC tubes.", src: S.sepe23 },
  ],
  gpps: [{ text: "Named as susceptible to cleaners containing fragrances, humectants or preservatives, and to essential oils.", src: S.exponent }],
  hips: [
    { text: "Delayed cracking of a HIPS bearing housing was traced to solvent in the bearing grease plus high assembly stress.", src: S.sepe23 },
    { text: "Polystyrene named as susceptible to fragranced or humectant-containing cleaners.", src: S.exponent },
  ],
  pvc: [{ text: "Named as susceptible to cleaners containing fragrances, humectants or preservatives.", src: S.exponent }],
  pmma: [{ text: "Named as susceptible to cleaners containing fragrances, humectants or preservatives.", src: S.exponent }],
  abs: [{ text: "Ethyl acetate (with molded-in stress) cracked ABS handsets at brass inserts; glacial acetic acid cracks all but stress-free ABS parts and is used as a test agent.", src: S.sepe23 }],
  pcabs: [{ text: "Brittle fracture after three days of exposure to Sani-Cloth AF3 disinfectant wipes.", src: S.tmd }],
  psu: [{ text: "Cracked in xylene under stress where semi-crystalline PPS did not.", src: S.sepe22 }],
};
export function escFor(id: string): Item[] {
  return ESC[id] ?? [];
}

/* ── Resin identification code ── */

const RIC: Record<string, string> = {
  pet: "1 (PETE)",
  hdpe: "2 (HDPE)",
  pvc: "3 (V)",
  ldpe: "4 (LDPE)",
  pp: "5 (PP)",
  gpps: "6 (PS)",
  hips: "6 (PS)",
};
const RIC_OTHER = new Set(["abs", "pc", "pcabs", "pmma", "pbt", "pa6", "pa66", "pa12", "pom", "ppe", "coc", "psu", "ppsu", "pei", "pps", "peek", "lcp", "pai", "ptfe", "pvdf", "tpu", "san", "pla", "asa", "pmp", "pomh", "pa11", "pa66gf", "pbtgf", "pes", "pekk", "pi", "ppa", "pa46", "peekcf", "fep", "pfa", "etfe", "pctfe", "tpv", "tpc", "peba"]);
export function ricFor(id: string): Item | null {
  if (RIC[id]) return { text: `Resin identification code ${RIC[id]}`, src: S.astm };
  if (RIC_OTHER.has(id)) return { text: "Resin identification code 7 (other); ASTM lists PLA, PC, ABS and nylon among the resins currently coded as other", src: S.astm };
  return null;
}
