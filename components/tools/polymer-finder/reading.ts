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
}

const R = {
  stressCracking: {
    title: 'Stress cracking: how to avoid this silent killer',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-22-stress-cracking-how-to-avoid-this-silent-killer-part-1-',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Why amorphous plastics crack under stress plus chemicals, with case studies.',
  },
  sterilization: {
    title: 'The challenges in high-energy sterilization of polymers',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-121-the-challenges-in-high-energy-sterilization-of-polymers',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Which polymers degrade under gamma / e-beam and how to test aged parts.',
  },
  nylonWater: {
    title: 'Fixing brittle nylon product with water',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-85-fixing-brittle-nylon-product-with-water',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Moisture conditioning masked degraded PA66 parts that later failed in the field.',
  },
  acetal: {
    title: 'How do you like your acetal: homopolymer or copolymer?',
    url: 'https://www.ptonline.com/columns/how-do-you-like-your-acetal-homopolymer-or-copolymer',
    source: 'Plastics Technology (M. Sepe)',
    note: 'Practical trade-offs between Delrin-type and copolymer acetal.',
  },
  annealing: {
    title: 'Annealing tips for semicrystalline polymers',
    url: 'https://ptonline.com/blog/post/part-3-materials-annealing-tips-for-semicrystalline-polymers',
    source: 'Plastics Technology (M. Sepe)',
    note: 'Annealing PPS, PEEK, PPA and nylon to finish crystallizing molded parts.',
  },
  stability: {
    title: 'How stable is your material?',
    url: 'https://www.plasticstoday.com/materials/the-materials-analyst-part-57-how-stable-is-your-material-part-2-',
    source: 'PlasticsToday · The Materials Analyst (M. Sepe)',
    note: 'Hydrolysis and thermal degradation of polyesters, PC, TPU and nylon during processing.',
  },
  warpage: {
    title: 'Injection molding: the causes of warpage',
    url: 'https://ptonline.com/articles/injection-molding-the-causes-of-warpage',
    source: 'Plastics Technology',
    note: 'Uneven shrinkage, fiber orientation and cooling: why molded parts warp.',
  },
  pcFailure: {
    title: 'Fractographic characterization of polycarbonate failure modes',
    url: 'https://madisongroup.com/fractographic-characterization-of-polycarbonate-failure-modes/',
    source: 'The Madison Group',
    note: 'How to tell ESC, fatigue, impact and hydrolysis apart on a broken PC part.',
  },
  disinfectants: {
    title: 'Polymer compatibility with harsh healthcare disinfectants',
    url: 'https://todaysmedicaldevelopments.com/article/materials-polymer-compatibility-harsh-healthcare-disinfectants',
    source: "Today's Medical Developments",
    note: 'ABS, PC, PC blends and sulfones against quats, bleach, peroxide and alcohol.',
  },
  cleaning: {
    title: 'Is your cleaning protocol harming your plastic parts?',
    url: 'https://www.exponent.com/sites/default/files/media/documents/tl_is-your-covid19-cleaning-protocol-harming-your-plastic-parts.pdf',
    source: 'Exponent',
    note: 'Wipes and sprays causing stress cracking in PC, PS, PVC and acrylic.',
  },
  ppGamma: {
    title: 'The gamma radiation tolerance of polypropylene',
    url: 'https://www.mddionline.com/materials/the-gamma-radiation-tolerance-of-polypropylene-measurement-and-enhancement',
    source: 'MDDI',
    note: 'Choosing and screening PP formulations that survive gamma sterilization.',
  },
  machiningTolerances: {
    title: 'Dimensional tolerance challenges when machining plastics',
    url: 'https://www.curbellplastics.com/wp-content/uploads/2023/10/Dimensional-Tolerance-Challenges-Slides.pdf',
    source: 'Curbell Plastics',
    note: 'Why machined PEEK, PTFE, nylon, acetal, PAI and PE parts move, and how to hold size.',
  },
  peekMachining: {
    title: 'Why machining PEEK is challenging',
    url: 'https://www.ensingerplastics.com/en-us/injection-molding/blog/why-machining-peek-is-challenging-and-what-precision-shops-do-differently',
    source: 'Ensinger',
    note: 'Heat control, tooling, fixturing and stress relief for precision PEEK parts.',
  },
  ptfeFab: {
    title: 'PTFE fabrication guidelines',
    url: 'https://www.plasticsintl.com/media/chgduosg/ptfe_fabrication_guidelines.pdf',
    source: 'Plastics International',
    note: 'Machining PTFE around its 19 °C transition and high thermal expansion.',
  },
  cocBonding: {
    title: 'Solvent-assisted in-mold bonding of COC microfluidic chips',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9230383/',
    source: 'Micromachines (open access)',
    note: 'Bonding COC chips without distorting microchannels.',
  },
  oringFailure: {
    title: 'O-ring failure modes',
    url: 'https://parker.com/promotionsite/oring-ehandbook/us/en/ehome/Failure-Modes',
    source: 'Parker O-Ring eHandbook',
    note: 'Compression set, extrusion, swell, ozone, rapid decompression: what each looks like.',
  },
  lsrTooling: {
    title: 'Getting into LSR: how LSR tooling is different',
    url: 'https://ptonline.com/articles/getting-into-lsr--part-iv-how-lsr-tooling-is-different',
    source: 'Plastics Technology',
    note: 'Tight fits to stop flash, vent design and cold-deck runners.',
  },
  overmolding: {
    title: 'How to optimize adhesion in hard-soft overmolding',
    url: 'https://ptonline.com/articles/how-to-optimize-adhesion-in-hard-soft-overmolding',
    source: 'Plastics Technology',
    note: 'Drying TPU, shut-off design and melt temperature for strong TPE bonds.',
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
