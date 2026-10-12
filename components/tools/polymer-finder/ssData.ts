/**
 * Published tensile data points for the stress–strain chart.
 *
 * Every number below is copied from the named datasheet (psi converted to MPa
 * with 1 psi = 0.0068948 MPa). Nothing is estimated: a value the datasheet
 * does not give is left out, and the chart only draws what is here.
 * Values are typical for the named grade at 23 °C unless the condition says
 * otherwise. Different test standards (ISO 527, ASTM D638, ASTM D412 for
 * rubbers) are not strictly comparable.
 */

export type Val = number | [number, number]; // single value or published range

export interface SSPoint {
  stress: Val; // MPa
  strain: Val; // %
  /** Strain is a lower bound (">50 %") */
  strainAtLeast?: boolean;
}

export interface SSData {
  grade: string;
  source: { label: string; url: string };
  /** Test standard and condition as stated */
  standard: string;
  /** Tensile modulus, MPa */
  modulus?: Val;
  /** Yield point (stress and strain both published) */
  yield?: SSPoint;
  /** Yield stress published without its strain */
  yieldStress?: Val;
  /** "Tensile strength" published without saying yield or break */
  strength?: Val;
  /** Stress at given strains (rubbers: stress at 100 %, 300 %, …) */
  at?: SSPoint[];
  /** Break point (stress and strain both published) */
  brk?: SSPoint;
  /** Strain at break published without its stress */
  breakStrain?: Val;
  breakStrainAtLeast?: boolean;
  note?: string;
}

const PSI = 0.0068948;
const psi = (v: number) => +(v * PSI).toFixed(2);

const MDC = "CAMPUS / materialdatacenter.com";

export const SS_DATA: Record<string, SSData> = {
  pp: {
    grade: "Pro-fax 6523 (LyondellBasell, homopolymer)",
    source: { label: "Pro-fax 6523 datasheet (Protolabs)", url: "https://protolabs.com/media/xwhp5oai/pro-fax-6523.pdf" },
    standard: "ISO 527-2, 23 °C",
    yield: { stress: 30, strain: 12 },
    note: "No tensile modulus or break values published (flexural modulus only).",
  },
  hdpe: {
    grade: "Marlex 9006 (Chevron Phillips)",
    source: { label: "Marlex 9006 datasheet (Protolabs)", url: "https://protolabs.com/media/e5kdhu1y/marlex-9006-1.pdf" },
    standard: "ASTM D638",
    yieldStress: 28,
    breakStrain: 950,
  },
  ldpe: {
    grade: "DOW LDPE 722",
    source: { label: "DOW LDPE 722 datasheet (Protolabs)", url: "https://WWW.PROTOLABS.COM/media/iddp4tec/ldpe-772.pdf" },
    standard: "ASTM D638",
    yield: { stress: 8.27, strain: 4 },
    brk: { stress: 9.65, strain: 500 },
  },
  hips: {
    grade: "Styrolution PS 486N (INEOS Styrolution)",
    source: { label: `Styrolution PS 486N (${MDC})`, url: "https://www.materialdatacenter.com/ms/en/Styrolution%20PS/INEOS+Styrolution/Styrolution%C2%AE+PS+486N/906dd48b/6541" },
    standard: "ISO 527",
    modulus: 1800,
    yield: { stress: 24, strain: 1.5 },
    breakStrain: 35,
    note: "Break value is nominal strain at break.",
  },
  abs: {
    grade: "Terluran GP-35 (INEOS Styrolution)",
    source: { label: `Terluran GP-35 (${MDC})`, url: "https://materialdatacenter.com/ms/en/Terluran/INEOS+Styrolution/Terluran%C2%AE+GP-35/d4a7a7cd/367" },
    standard: "ISO 527",
    modulus: 2300,
    yield: { stress: 44, strain: 2.4 },
    breakStrain: 12,
    note: "Break value is nominal strain at break.",
  },
  pc: {
    grade: "Makrolon 2405 (Covestro)",
    source: { label: `Makrolon 2405 (${MDC})`, url: "https://materialdatacenter.com/ms/en/Makrolon/Covestro+Deutschland+AG/Makrolon%C2%AE+2405/986598f8/410" },
    standard: "ISO 527",
    modulus: 2400,
    yield: { stress: 65, strain: 6 },
    brk: { stress: 65, strain: 125 },
  },
  pcabs: {
    grade: "Cycoloy C1200HF (SABIC)",
    source: { label: "Cycoloy C1200HF datasheet (Protolabs)", url: "https://protolabs.com/media/socff1cn/cycoloy-c1200hf.pdf" },
    standard: "ISO 527",
    modulus: 2400,
    yield: { stress: 55, strain: 4.8 },
    breakStrain: 110,
  },
  pmma: {
    grade: "PLEXIGLAS 7N (Röhm)",
    source: { label: `PLEXIGLAS 7N (${MDC})`, url: "https://www.materialdatacenter.com/ms/en/Plexiglas/R%C3%B6hm+GmbH/PLEXIGLAS%C2%AE+7N/a7aaeaa5/2125" },
    standard: "ISO 527",
    modulus: 3200,
    brk: { stress: 73, strain: 3.5 },
  },
  petg: {
    grade: "Eastar 6763 (Eastman)",
    source: { label: "Eastar 6763 datasheet (Protolabs)", url: "https://protolabs.com/media/pzub5tfo/eastar-6763.pdf" },
    standard: "ISO 527 (modulus, stresses, break strain)",
    modulus: 2100,
    yieldStress: 50,
    brk: { stress: 28, strain: 100 },
    note: "Stress at break is below yield stress: the bar necks and draws after yield.",
  },
  pa6: {
    grade: "Ultramid B3S (BASF), dry as molded",
    source: { label: `Ultramid B3S (${MDC})`, url: "https://materialdatacenter.com/ms/en/Ultramid%20B/BASF/Ultramid%C2%AE+B3S/caf8ea95/4337" },
    standard: "ISO 527, dry",
    modulus: 3500,
    yield: { stress: 90, strain: 4 },
    breakStrain: 10,
    note: "Break value is nominal strain at break. Conditioned: 1200 MPa modulus, yield 45 MPa at 20 %.",
  },
  pa66: {
    grade: "Ultramid A3K FC R01 (BASF), dry as molded",
    source: { label: `Ultramid A3K FC R01 (${MDC})`, url: "https://materialdatacenter.com/ms/en/Ultramid%20A/BASF/Ultramid%C2%AE+A3K+FC+R01/4dac76e9/371" },
    standard: "ISO 527, dry",
    modulus: 3000,
    yield: { stress: 85, strain: 5 },
    note: "No break values published.",
  },
  pom: {
    grade: "HOSTAFORM C 9021 (Celanese)",
    source: { label: `HOSTAFORM C 9021 (${MDC})`, url: "https://materialdatacenter.com/ms/en/Hostaform/Celanese/HOSTAFORM%C2%AE+C+9021/651a61bb/2434" },
    standard: "ISO 527",
    modulus: 2851,
    yield: { stress: 64, strain: 9 },
    breakStrain: 30,
    note: "Break value is nominal strain at break.",
  },
  ppe: {
    grade: "NORYL EN265 (SABIC)",
    source: { label: `NORYL EN265 (${MDC})`, url: "https://www.materialdatacenter.com/ms/es/Noryl/Saudi+Basic+Industries+Corporation+%28SABIC%29/NORYL%E2%84%A2+Resin+EN265+-+Americas/c0f9313b/1127" },
    standard: "ASTM D638",
    yieldStress: 63,
    breakStrain: 25,
  },
  coc: {
    grade: "TOPAS 6013M-07",
    source: { label: "TOPAS 6013M-07 datasheet", url: "https://topas.com/wp-content/uploads/2023/05/TDS-6013M-07_e.pdf" },
    standard: "ISO 527-3",
    modulus: 2900,
    brk: { stress: 63, strain: 2.6 },
  },
  psu: {
    grade: "Udel P-1700 (Syensqo)",
    source: { label: "Udel P-1700 datasheet (Protolabs)", url: "https://protolabs.com/media/b2rj51rq/udel-p1700.pdf" },
    standard: "ASTM D638",
    modulus: 2480,
    strength: 70.3,
    breakStrain: [50, 100],
  },
  ppsu: {
    grade: "Radel R-5500 (stock shapes)",
    source: { label: "PPSU Radel R-5500 data sheet (Protolabs CNC)", url: "https://www.protolabs.com/media/0wfjcp00/2026-026-cnc-material-data-sheet_ppsu-radel-r-5500.pdf" },
    standard: "ASTM D638",
    modulus: [psi(350000), psi(390000)],
    yieldStress: psi(11000),
    breakStrain: [30, 80],
  },
  pei: {
    grade: "Ultem 1000 (SABIC)",
    source: { label: "Ultem 1000 datasheet (Protolabs)", url: "https://www.protolabs.com/media/s34d4h1r/ultem-1000-bk7101-clear.pdf" },
    standard: "ASTM D638, 5 mm/min",
    modulus: 3590,
    yield: { stress: 110, strain: 7 },
    breakStrain: 60,
  },
  pps: {
    grade: "Fortron 1140L4 (Celanese), 40% glass",
    source: { label: "Fortron 1140L4 datasheet (Protolabs)", url: "https://Protolabs.com/media/1t4hwpu5/fortron_pps-1140l4.pdf" },
    standard: "ISO 527-2",
    modulus: 14700,
    brk: { stress: 195, strain: 1.9 },
  },
  peek: {
    grade: "VICTREX PEEK 450G",
    source: { label: "VICTREX PEEK 450G datasheet", url: "https://www.victrex.com/en/downloads/datasheets/victrex-peek-450g" },
    standard: "ISO 527, 23 °C",
    modulus: 4000,
    yieldStress: 98,
    breakStrain: 25,
  },
  peekcf: {
    grade: "VICTREX PEEK 450CA30, 30% carbon",
    source: { label: "VICTREX 450CA30 datasheet", url: "https://drakeplastics.com/wp-content/uploads/2016/01/Victrex_TDS_450CA30.pdf" },
    standard: "ISO 527, 23 °C",
    modulus: 28000,
    brk: { stress: 265, strain: 1.7 },
  },
  pekk: {
    grade: "KEPSTAN 6002 (Arkema)",
    source: { label: "KEPSTAN 6002 datasheet", url: "https://hpp.arkema.com/assets/arkema/TDS_KEPSTAN%C2%AE%206002_en_WW.pdf" },
    standard: "ISO 527, 23 °C (1BA)",
    modulus: 2900,
    yield: { stress: 88, strain: 5.4 },
    breakStrain: 80,
    breakStrainAtLeast: true,
  },
  lcp: {
    grade: "VECTRA A130 (Celanese), 30% glass",
    source: { label: `VECTRA A130 (${MDC})`, url: "https://materialdatacenter.com/ms/en/Vectra/Celanese/VECTRA%C2%AE+A130/e20777db/2442" },
    standard: "ISO 527",
    modulus: 15000,
    brk: { stress: 190, strain: 2.1 },
  },
  pai: {
    grade: "Torlon 4203L",
    source: { label: "Torlon 4203L datasheet (Drake Plastics)", url: "https://drakeplastics.com/wp-content/uploads/2016/01/Torlon-4203L.pdf" },
    standard: "ASTM D638",
    modulus: 4480,
    strength: 152,
    breakStrain: 7.6,
  },
  pi: {
    grade: "Vespel SP-1 (DuPont)",
    source: { label: "Vespel SP-1 datasheet (Curbell)", url: "https://www.curbellplastics.com/wp-content/uploads/2022/11/DuPont-Vespel-SP-1-Data-Sheet.pdf" },
    standard: "ASTM D1708, 23 °C",
    strength: 86.2,
    breakStrain: 7.5,
    note: "Only flexural modulus (3102 MPa) is published, so no tensile modulus is drawn.",
  },
  ptfe: {
    grade: "Teflon PTFE 7A X (Chemours)",
    source: { label: `Teflon PTFE 7A X (${MDC})`, url: "https://www.materialdatacenter.com/ms/en/Teflon/The+Chemours+Company/Teflon%E2%84%A2+PTFE+7A+X/61699362/824" },
    standard: "ASTM D4894",
    strength: 48.3,
    breakStrain: 375,
  },
  pfa: {
    grade: "Teflon PFA 340 (Chemours)",
    source: { label: `Teflon PFA 340 (${MDC})`, url: "https://materialdatacenter.com/ms/en/Teflon/The+Chemours+Company/Teflon%E2%84%A2+PFA+340/5882405c/824" },
    standard: "ASTM D3307",
    strength: 25,
    breakStrain: 300,
  },
  etfe: {
    grade: "Tefzel ETFE 200 (Chemours)",
    source: { label: "Tefzel 200 product information (Pexco)", url: "https://www.pexco.com/wp-content/uploads/2025/09/Tefzel_ETFE_200_ProductInfo.pdf" },
    standard: "ASTM D3159, 23 °C",
    strength: 45,
    breakStrain: 300,
  },
  pvdf: {
    grade: "Kynar 740 (Arkema)",
    source: { label: "Kynar 740 datasheet", url: "https://hpp.arkema.com/assets/arkema/TDS_KYNAR%C2%AE%20740_en_WW.pdf" },
    standard: "ASTM D638 (stresses, modulus), ISO 527 (strains)",
    modulus: 1800,
    yield: { stress: [44.8, 55.2], strain: 7 },
    brk: { stress: [34.5, 55.2], strain: 50, strainAtLeast: true },
  },
  san: {
    grade: "Luran 358N (INEOS Styrolution)",
    source: { label: `Luran 358N (${MDC})`, url: "https://www.materialdatacenter.com/ms/en/Luran/INEOS+Styrolution/Luran%C2%AE+358N/238afc86/367" },
    standard: "ISO 527",
    modulus: 3700,
    brk: { stress: 72, strain: 3 },
  },
  asa: {
    grade: "Luran S 777K (INEOS Styrolution)",
    source: { label: `Luran S 777K (${MDC})`, url: "https://www.materialdatacenter.com/ms/en/Luran/INEOS+Styrolution/Luran%C2%AE+S+777K/db37c64e/367" },
    standard: "ISO 527",
    modulus: 2300,
    yield: { stress: 48, strain: 3.3 },
    breakStrain: 50,
    breakStrainAtLeast: true,
    note: "Break value is nominal strain at break.",
  },
  pa11: {
    grade: "Rilsan BESNO TL (Arkema), conditioned",
    source: { label: "Rilsan BESNO TL datasheet", url: "https://hpp.arkema.com/assets/arkema/TDS_RILSAN%C2%AE%20BESNO%20TL_en_WW.pdf" },
    standard: "ISO 527, 23 °C, conditioned",
    modulus: 1280,
    yield: { stress: 38, strain: 5 },
    brk: { stress: 57, strain: 50, strainAtLeast: true },
  },
  pa46: {
    grade: "Stanyl TW341 (Envalior), dry",
    source: { label: "Stanyl TW341 datasheet (Protolabs)", url: "https://protolabs.com/media/zkljkqyq/stanyl-tw341.pdf" },
    standard: "ISO 527-2, 23 °C, dry",
    modulus: 3300,
    yield: { stress: 100, strain: 10 },
    breakStrain: 40,
    note: "Break value is nominal strain at break. Conditioned: 1000 MPa modulus, yield 55 MPa at 20 %.",
  },
  pbtgf: {
    grade: "VALOX 420SE0 (SABIC), 30% glass, flame retardant",
    source: { label: "VALOX 420SE0 datasheet (Protolabs)", url: "https://Protolabs.com/media/dc0oz3am/valox-420seo.pdf" },
    standard: "ASTM D638",
    modulus: 12000,
    brk: { stress: 120, strain: 2 },
  },
  // ── Elastomers ──
  tpu: {
    grade: "Elastollan 1185A (BASF), 85 Shore A",
    source: { label: "Elastollan 1185A specification sheet", url: "https://media.iewc.com/SpecificationSheets/1185A.pdf" },
    standard: "ASTM D412",
    at: [
      { stress: psi(1400), strain: 100 },
      { stress: psi(3100), strain: 300 },
    ],
    brk: { stress: psi(5200), strain: 530 },
  },
  tpc: {
    grade: "Hytrel 5526, 51 Shore D",
    source: { label: "Hytrel product reference guide", url: "https://www.formerra.com/sites/default/files/2021-07/hytrel-product-reference-guide.pdf" },
    standard: "ISO 527",
    brk: { stress: 43, strain: 780 },
    note: "Break value is nominal strain at break.",
  },
  peba: {
    grade: "Pebax 4033 SA 01 (Arkema), conditioned",
    source: { label: "Pebax 4033 SA 01 datasheet", url: "https://hpp.arkema.com/assets/arkema/TDS_PEBAX%C2%AE%204033%20SA%2001_en_WW.pdf" },
    standard: "ISO 527, 23 °C, conditioned",
    modulus: 71,
    at: [{ stress: 9, strain: 50 }],
    brk: { stress: 40, strain: 450, strainAtLeast: true },
  },
  tpv: {
    grade: "Santoprene 201-87",
    source: { label: "Santoprene 201-87 datasheet (Protolabs)", url: "https://protolabs.com/media/hwrboouo/santoprene-201-87-en.pdf" },
    standard: "ISO 37, across flow",
    at: [{ stress: 7.1, strain: 100 }],
    brk: { stress: 15, strain: 580 },
  },
  lsr: {
    grade: "ELASTOSIL LR 3003/20 TR (Wacker), 22 Shore A",
    source: { label: "ELASTOSIL LR 3003/20 datasheet", url: "https://www.stockwell.com/data-sheets/TDS%202020-W%20ELASTOSIL%20LR-300320.pdf" },
    standard: "ISO 37 type 1, post-cured",
    brk: { stress: 8.3, strain: 870 },
    note: "A softer grade than the 50 Shore A card values; the only LSR datasheet with both values I could open.",
  },
  nbr: {
    grade: "Parker N0674-70, 71 Shore A",
    source: { label: "Parker N0674-70 test report", url: "https://www.marcorubber.com/downloads/Marco-Material-Datasheet-Parker-N0674-70.pdf" },
    standard: "Test results (ASTM D2000 compound)",
    brk: { stress: psi(2546), strain: 331 },
  },
  hnbr: {
    grade: "Parker N3831 HNBR, 74 Shore A",
    source: { label: "Parker N3831 compound data sheet", url: "https://www.parker.com/content/dam/Parker-com/Literature/Praedifa/Compound_Data_Sheets/EMG_PTD_Compound-Data-Sheet_HNBR_N3831_EN.pdf" },
    standard: "DIN 53504 S2, typical",
    at: [{ stress: 6.4, strain: 100 }],
    brk: { stress: 23.9, strain: 302 },
  },
  epdm: {
    grade: "Parker E1244-70 EPDM, 65 Shore A (O-ring 2-129)",
    source: { label: "Parker E1244-70 test report", url: "https://www.marcorubber.com/downloads/Marco-Material-Datasheet-Parker-E1244-70.pdf" },
    standard: "Test results",
    brk: { stress: psi(2035), strain: 278 },
  },
  fkm: {
    grade: "Parker V1164-75 FKM, 75 Shore A",
    source: { label: "Parker V1164-75 test report", url: "https://www.marcorubber.com/downloads/Marco-Material-Datasheet-Parker-V1164-75.pdf" },
    standard: "Test results",
    brk: { stress: psi(1694), strain: 229 },
  },
  ffkm: {
    grade: "Parker FF362-75 FFKM, 75 Shore A",
    source: { label: "Parker FF362-75 data sheet", url: "https://www.parker.com/content/dam/Parker-com/Literature/O-Ring-Division-Literature/FF362-75%20.pdf" },
    standard: "ASTM D1414, typical",
    brk: { stress: psi(1669), strain: 284 },
  },
  cr: {
    grade: "Parker C0873-70 neoprene, 72 Shore A",
    source: { label: "Parker C0873-70 test report", url: "https://www.marcorubber.com/downloads/Marco-Material-Datasheet-Parker-C0873-70.pdf" },
    standard: "Test results",
    brk: { stress: psi(1832), strain: 293 },
  },
  iir: {
    grade: "Parker B0612-70 butyl, 75 Shore A",
    source: { label: "Parker B0612-70 test report", url: "https://www.canyoncomponents.com/downloads/Pub/DtaMrk/CC/B0612-70-Datasheet.pdf" },
    standard: "Test results",
    brk: { stress: 12.2, strain: 289 },
  },
};

/** Materials with no plottable published data yet, and why. */
export const SS_MISSING: Record<string, string> = {
  gpps: "Datasheet found (Styron 666D) but I could not open it.",
  pvc: "Datasheet found (Protolabs PVC stock shapes) but I could not open it.",
  pet: "Datasheet found (Protolabs PET stock shapes) but I could not open it.",
  pbt: "CAMPUS page for Ultradur B4520 was rate-limited; Valox 357 datasheet could not be opened.",
  pa12: "Only 3D-printed PA12 datasheets found, not a molded grade.",
  pes: "Not found yet (not in Protolabs’ datasheet list; no other source searched).",
  pla: "Ingeo 3D850 datasheet gives stresses but no strains.",
  pmp: "Not found yet (not in Protolabs’ datasheet list; no other source searched).",
  pomh: "Delrin 100P CAMPUS page failed to load; Delrin 500P datasheet could not be opened.",
  pa66gf: "Datasheet found (Zytel 70G33HS1L) but I could not open it.",
  ppa: "Datasheet found (Zytel HTN 51G35HSL) but I could not open it.",
  pctfe: "Not found yet (not in Protolabs’ datasheet list; no other source searched).",
  uhmwpe: "Not searched yet.",
  fep: "Teflon FEP 100 datasheet gives tensile strength only, no elongation.",
};

export const lo = (v: Val) => (Array.isArray(v) ? v[0] : v);
export const hi = (v: Val) => (Array.isArray(v) ? v[1] : v);
export const fmtVal = (v: Val, unit: string) => (Array.isArray(v) ? `${v[0]}–${v[1]} ${unit}` : `${v} ${unit}`);

/** Largest stress and strain in an entry (for axis ranges). */
export function extent(d: SSData) {
  const stresses: number[] = [];
  const strains: number[] = [];
  const add = (p?: SSPoint) => {
    if (!p) return;
    stresses.push(hi(p.stress));
    strains.push(hi(p.strain));
  };
  add(d.yield);
  add(d.brk);
  d.at?.forEach(add);
  if (d.yieldStress !== undefined) stresses.push(hi(d.yieldStress));
  if (d.strength !== undefined) stresses.push(hi(d.strength));
  if (d.breakStrain !== undefined) strains.push(hi(d.breakStrain));
  return { maxStress: Math.max(0, ...stresses), maxStrain: Math.max(0, ...strains), minStrain: Math.min(...strains) };
}
