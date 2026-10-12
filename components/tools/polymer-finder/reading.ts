/**
 * Practical reading: columns, case studies and troubleshooting guides written
 * by practitioners (molders, failure analysts, machinists, seal engineers),
 * as opposed to datasheets. Shown per material in its details panel.
 */

export interface Reading {
  title: string;
  url: string;
  /** Publication or organization */
  source: string;
  /** One line on why it's worth reading */
  note: string;
  /** Key lessons from the article, paraphrased (checked against the source) */
  takeaways: string[];
}

const R = {
  stressCracking: {
    title: 'Stress cracking: how to avoid this silent killer',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-22-stress-cracking-how-to-avoid-this-silent-killer-part-1-',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Why amorphous plastics crack under stress plus chemicals, with case studies.',
    takeaways: [
      'Stress cracking needs stress and a chemical together; either alone may do nothing.',
      'Amorphous polymers are the most vulnerable; semi-crystalline PPS outlasted amorphous PSU in xylene.',
    ],
  },
  sterilization: {
    title: 'The challenges in high-energy sterilization of polymers',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-121-the-challenges-in-high-energy-sterilization-of-polymers',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Which polymers degrade under gamma / e-beam and how to test aged parts.',
    takeaways: [
      'Acetal, PTFE, unstabilized PP and FEP degrade at typical sterilization doses; silicone tends to crosslink and PC loses molecular weight.',
      'Prefer radiation-resistant PP and PC grades and platinum-cured silicone, and test parts after aging, not just after exposure.',
    ],
  },
  nylonWater: {
    title: 'Fixing brittle nylon product with water',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-85-fixing-brittle-nylon-product-with-water',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Moisture conditioning masked degraded PA66 parts that later failed in the field.',
    takeaways: [
      'Moisture conditioning made degraded PA66 parts look tough; they failed once the moisture content dropped to about 1.5%.',
      'When nylon parts are brittle, check melt flow rate for degradation before blaming low moisture.',
    ],
  },
  acetal: {
    title: 'How do you like your acetal: homopolymer or copolymer?',
    url: 'https://www.ptonline.com/columns/how-do-you-like-your-acetal-homopolymer-or-copolymer',
    source: 'Plastics Technology (M. Sepe)',
    note: 'Practical trade-offs between Delrin-type and copolymer acetal.',
    takeaways: [
      'Homopolymer is stiffer and stronger with better short-term heat, creep and fatigue performance.',
      'Copolymer has a wider processing window and better long-term heat and chemical resistance.',
    ],
  },
  annealing: {
    title: 'Annealing tips for semicrystalline polymers',
    url: 'https://ptonline.com/blog/post/part-3-materials-annealing-tips-for-semicrystalline-polymers',
    source: 'Plastics Technology (M. Sepe)',
    note: 'Annealing PPS, PEEK, PPA and nylon to finish crystallizing molded parts.',
    takeaways: [
      'Anneal at or slightly above the maximum use temperature; the time needed is found by experiment.',
      'Protect nylon from oxidation while annealing: inert gas, vacuum or hot mineral oil.',
    ],
  },
  stability: {
    title: 'How stable is your material?',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-57-how-stable-is-your-material-part-2-',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Hydrolysis and thermal degradation of polyesters, PC, TPU and nylon during processing.',
    takeaways: [
      'Hydrolysis during processing matters most for PET; for PBT, thermal degradation is the bigger threat.',
    ],
  },
  warpage: {
    title: 'Injection molding: the causes of warpage',
    url: 'https://ptonline.com/articles/injection-molding-the-causes-of-warpage',
    source: 'Plastics Technology',
    note: 'Uneven shrinkage, fiber orientation and cooling: why molded parts warp.',
    takeaways: [
      'Warpage comes from uneven shrinkage: differential cooling, molecular and fiber orientation, and wall-thickness changes.',
    ],
  },
  pcFailure: {
    title: 'Fractographic characterization of polycarbonate failure modes',
    url: 'https://madisongroup.com/fractographic-characterization-of-polycarbonate-failure-modes/',
    source: 'The Madison Group',
    note: 'How to tell ESC, fatigue, impact and hydrolysis apart on a broken PC part.',
    takeaways: [
      'Fracture surfaces distinguish overload, impact, fatigue, hydrolysis and environmental stress cracking in PC.',
    ],
  },
  disinfectants: {
    title: 'Polymer compatibility with harsh healthcare disinfectants',
    url: 'https://todaysmedicaldevelopments.com/article/materials-polymer-compatibility-harsh-healthcare-disinfectants',
    source: "Today's Medical Developments",
    note: 'ABS, PC, PC blends and sulfones against quats, bleach, peroxide and alcohol.',
    takeaways: [
      'Choose grades rated for the specific hospital disinfectants, minimize molded-in and assembly stress, and test finished parts.',
    ],
  },
  cleaning: {
    title: 'Is your cleaning protocol harming your plastic parts?',
    url: 'https://www.exponent.com/sites/default/files/media/documents/tl_is-your-covid19-cleaning-protocol-harming-your-plastic-parts.pdf',
    source: 'Exponent',
    note: 'Wipes and sprays causing stress cracking in PC, PS, PVC and acrylic.',
    takeaways: [
      'Fragranced or humectant-containing cleaners caused cracking in PC, PS, PVC and acrylic parts.',
    ],
  },
  ppGamma: {
    title: 'The gamma radiation tolerance of polypropylene',
    url: 'https://www.mddionline.com/materials/the-gamma-radiation-tolerance-of-polypropylene-measurement-and-enhancement',
    source: 'MDDI',
    note: 'Choosing and screening PP formulations that survive gamma sterilization.',
    takeaways: [
      'Use low-crystallinity, narrow molecular-weight-distribution PP with HALS stabilizers and without phenolic antioxidants.',
      'Random copolymers with at least ~2% ethylene tolerate gamma better; screen aged parts with a flex-to-failure test.',
    ],
  },
  machiningTolerances: {
    title: 'Dimensional tolerance challenges when machining plastics',
    url: 'https://www.curbellplastics.com/wp-content/uploads/2023/10/Dimensional-Tolerance-Challenges-Slides.pdf',
    source: 'Curbell Plastics',
    note: 'Why machined PEEK, PTFE, nylon, acetal, PAI and PE parts move, and how to hold size.',
    takeaways: [
      'Machined plastic parts move because of thermal expansion, moisture uptake and released residual stress.',
      'Stress-relief annealing, careful fixturing and suitable tooling help machined parts hold size.',
    ],
  },
  peekMachining: {
    title: 'Why machining PEEK is challenging',
    url: 'https://www.ensingerplastics.com/en-us/injection-molding/blog/why-machining-peek-is-challenging-and-what-precision-shops-do-differently',
    source: 'Ensinger',
    note: 'Heat control, tooling, fixturing and stress relief for precision PEEK parts.',
    takeaways: [
      'Controlling heat during cutting and relieving stress are the keys to holding size on precision PEEK parts.',
    ],
  },
  ptfeFab: {
    title: 'PTFE fabrication guidelines',
    url: 'https://www.plasticsintl.com/media/chgduosg/ptfe_fabrication_guidelines.pdf',
    source: 'Plastics International',
    note: 'Machining PTFE around its 19 °C transition and high thermal expansion.',
    takeaways: [
      'PTFE changes volume by roughly 1–1.5% around 19 °C, so measure parts at their service temperature.',
      'Stress-relieve just above the use temperature to keep machined PTFE parts stable.',
    ],
  },
  cocBonding: {
    title: 'Solvent-assisted in-mold bonding of COC microfluidic chips',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9230383/',
    source: 'Micromachines (open access)',
    note: 'Bonding COC chips without distorting microchannels.',
    takeaways: [
      'Solvent-assisted in-mold bonding can seal COC chips without distorting the microchannels.',
    ],
  },
  oringFailure: {
    title: 'O-ring failure modes',
    url: 'https://parker.com/promotionsite/oring-ehandbook/us/en/ehome/Failure-Modes',
    source: 'Parker O-Ring eHandbook',
    note: 'Compression set, extrusion, swell, ozone, rapid decompression: what each looks like.',
    takeaways: [
      'Common seal failures: compression set, extrusion and nibbling, spiral failure, explosive (rapid gas) decompression, abrasion and installation damage.',
      'Fluid incompatibility, gland overfill and ozone cracking also cause failures; each leaves a recognizable signature on the seal.',
    ],
  },
  lsrTooling: {
    title: 'Getting into LSR: how LSR tooling is different',
    url: 'https://ptonline.com/articles/getting-into-lsr--part-iv-how-lsr-tooling-is-different',
    source: 'Plastics Technology',
    note: 'Tight fits to stop flash, vent design and cold-deck runners.',
    takeaways: [
      'LSR flashes easily, so inserts and shut-offs need tight fits.',
      'Use controlled venting and a chilled cold-deck runner with needle valves to keep the material from curing early.',
    ],
  },
  overmolding: {
    title: 'How to optimize adhesion in hard-soft overmolding',
    url: 'https://ptonline.com/articles/how-to-optimize-adhesion-in-hard-soft-overmolding',
    source: 'Plastics Technology',
    note: 'Drying TPU, shut-off design and melt temperature for strong TPE bonds.',
    takeaways: [
      'Dry TPU thoroughly (to about 0.05% moisture, −40 °F dew point) and keep mold release off the substrate.',
      'Sharp shut-offs, compatible color carriers, upper-range melt temperatures and larger gates all improve hard-soft bond strength.',
    ],
  },
} satisfies Record<string, Reading>;

const BY_ID: Record<string, Reading[]> = {
  pc: [R.pcFailure, R.stressCracking, R.disinfectants, R.cleaning, R.sterilization],
  pcabs: [R.disinfectants, R.stressCracking],
  abs: [R.disinfectants, R.stressCracking],
  gpps: [R.cleaning, R.stressCracking],
  hips: [R.cleaning],
  pvc: [R.cleaning],
  pmma: [R.cleaning, R.stressCracking],
  san: [R.stressCracking],
  petg: [R.stressCracking],
  psu: [R.disinfectants, R.stressCracking],
  ppsu: [R.disinfectants, R.stressCracking],
  pes: [R.stressCracking],
  pei: [R.stressCracking],
  pa6: [R.nylonWater, R.stability, R.machiningTolerances],
  pa66: [R.nylonWater, R.stability, R.annealing],
  pa46: [R.nylonWater],
  pa11: [R.nylonWater],
  pa12: [R.nylonWater],
  pa66gf: [R.nylonWater, R.warpage],
  pom: [R.acetal, R.sterilization, R.machiningTolerances],
  pomh: [R.acetal, R.sterilization],
  pp: [R.ppGamma, R.sterilization, R.machiningTolerances],
  hdpe: [R.machiningTolerances],
  uhmwpe: [R.machiningTolerances],
  pet: [R.stability],
  pbt: [R.stability],
  pbtgf: [R.stability, R.warpage],
  peek: [R.peekMachining, R.annealing, R.machiningTolerances],
  peekcf: [R.peekMachining, R.warpage],
  pps: [R.annealing, R.warpage, R.stressCracking],
  ppa: [R.annealing, R.warpage],
  lcp: [R.warpage],
  pai: [R.machiningTolerances],
  pi: [R.machiningTolerances],
  ptfe: [R.ptfeFab, R.machiningTolerances, R.sterilization],
  fep: [R.sterilization],
  coc: [R.cocBonding],
  tpu: [R.overmolding, R.stability],
  tpv: [R.overmolding],
  tpc: [R.overmolding],
  lsr: [R.lsrTooling, R.sterilization, R.oringFailure],
  nbr: [R.oringFailure],
  hnbr: [R.oringFailure],
  epdm: [R.oringFailure],
  fkm: [R.oringFailure],
  ffkm: [R.oringFailure],
  cr: [R.oringFailure],
  iir: [R.oringFailure],
};

export function readingFor(id: string): Reading[] {
  return BY_ID[id] ?? [];
}

export const ALL_READING: Reading[] = Object.values(R);
