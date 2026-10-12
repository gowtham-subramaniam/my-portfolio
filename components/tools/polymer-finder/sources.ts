/**
 * References the watch-outs, processing data and sterilization ratings were
 * checked against. Shown under each material's watch-outs. Statements without
 * a cited source are general engineering guidance.
 */

export interface Source {
  label: string;
  url: string;
}

const S = {
  nordion: { label: 'Nordion: Gamma compatibility guide', url: 'https://www.nordion.com/wp-content/uploads/2017/01/Gamma_Compatibility_2017-01_PCCS-121E.pdf' },
  parker: { label: 'Parker: O-Ring Handbook (ORD 5700)', url: 'https://nfc.arizona.edu/sites/default/files/2022-02/parker_o-ring_handbook.pdf' },
  sulfones: { label: 'Solvay: Sulfones quick molding guide', url: 'https://www.solvay.com/sites/g/files/srpend221/files/2018-07/Sulfones-Quick-Molding-Guide_EN.pdf' },
  solvaySteril: {
    label: 'Solvay: Healthcare sterilization compatibility',
    url: 'https://www.solvay.com/sites/g/files/srpend221/files/2018-07/healthcare-sterilization-compatibility-en.pdf',
  },
  delrin: { label: 'DuPont: Delrin acetal molding tips', url: 'https://www.formerra.com/sites/default/files/2021-07/delrin-r-acetal-homopolymer-resin-molding-tips.pdf' },
  victrex: { label: 'Victrex: PEEK injection molding guide', url: 'https://victrex.com/-/media/downloads/materials-properties/victrex_injection-molding-brochure.pdf' },
  covestro: { label: 'Covestro: Makrolon PC processing data', url: 'https://info.formerra.com/hubfs/Covestro-Makrolon.pdf' },
  ultem: { label: 'SABIC: Ultem 1000 datasheet', url: 'https://www.protolabs.com/media/s34d4h1r/ultem-1000-bk7101-clear.pdf' },
  ppsMold: { label: 'Solvay: PPS mold temperature bulletin', url: 'https://www.solvay.com/sites/g/files/srpend221/files/2018-08/Ryton-PPS-Mold-Temperature_EN-v1.0_0.pdf' },
  amodel: { label: 'Solvay: Amodel PPA quick molding guide', url: 'https://www.solvay.com/sites/g/files/srpend221/files/tridion/documents/Amodel-PPA-Quick-Molding-Guide_EN.pdf' },
  weld: { label: 'Plastics Technology: Coping with weak weld lines', url: 'https://www.ptonline.com/articles/coping-with-weak-weld-lines' },
  acrylite: {
    label: 'Acrylite: Cutting and annealing acrylic',
    url: 'https://www.acrylite.co/files/content/acrylite.co/documents/fabrication-briefs/Extruded-Fabrication-Cutting-Technical-Information.pdf',
  },
  topas: { label: 'TOPAS: COC chemical resistance', url: 'https://topas.com/tech-center/performance-data/chemical-resistance/' },
  nylonMoisture: { label: 'W.S. Hampshire: Dry vs conditioned nylon', url: 'https://www.wshampshire.com/dry-versus-conditioned-nylon-explained/' },
  ulPA: { label: 'UL Prospector: Polyamide moisture absorption', url: 'https://ulprospector.ul.com/1390/polyamide-moisture-absorption/' },
  hytrel: { label: 'DuPont: Hytrel injection molding guide', url: 'https://dupont.materialdatacenter.com/links/processing/Hytrel.pdf' },
  pebax: { label: 'Arkema: Pebax 7033 SP 01 datasheet', url: 'https://hpp.arkema.com/assets/arkema/TDS_PEBAX%C2%AE%207033%20SP%2001_en_WW.pdf' },
  santoprene: { label: 'Santoprene 201-87 datasheet', url: 'https://protolabs.com/media/hwrboouo/santoprene-201-87-en.pdf' },
  daikin: { label: 'Daikin: PTFE compounds', url: 'https://www.daikinchem.de/sites/default/files/pdf/DCIT/Daikin_PTFE_Compounds.pdf' },
  udel: { label: 'Solvay: Udel P-1700 PSU datasheet', url: 'https://protolabs.com/media/b2rj51rq/udel-p1700.pdf' },
  celcon: { label: 'Celanese: Celcon M90 POM datasheet', url: 'https://protolabs.com/media/e1qny04b/celcon-m90.pdf' },
  fortron: { label: 'Celanese: Fortron 1140L4 PPS datasheet', url: 'https://Protolabs.com/media/1t4hwpu5/fortron_pps-1140l4.pdf' },
  cycoloy: { label: 'SABIC: Cycoloy C1200HF PC/ABS datasheet', url: 'https://protolabs.com/media/socff1cn/cycoloy-c1200hf.pdf' },
  kepstan: { label: 'Arkema: Kepstan 6002 PEKK datasheet', url: 'https://hpp.arkema.com/assets/arkema/TDS_KEPSTAN%C2%AE%206002_en_WW.pdf' },
  rilsan: { label: 'Arkema: Rilsan BESNO TL PA11 datasheet', url: 'https://hpp.arkema.com/assets/arkema/TDS_RILSAN%C2%AE%20BESNO%20TL_en_WW.pdf' },
  pebax4033: { label: 'Arkema: Pebax 4033 SA 01 datasheet', url: 'https://hpp.arkema.com/assets/arkema/TDS_PEBAX%C2%AE%204033%20SA%2001_en_WW.pdf' },
  peekCA30: { label: 'Victrex: PEEK 450CA30 datasheet', url: 'https://drakeplastics.com/wp-content/uploads/2016/01/Victrex_TDS_450CA30.pdf' },
  ingeo: { label: 'NatureWorks: Ingeo 3D850 PLA datasheet (CAMPUS)', url: 'https://materialdatacenter.com/ms/en/Ingeo/NatureWorks+LLC/Ingeo%E2%84%A2+3D850/d5660ef4/5616' },
  vectra: { label: 'Celanese: Vectra A130 LCP datasheet (CAMPUS)', url: 'https://materialdatacenter.com/ms/fr/Vectra/Celanese/VECTRA%C2%AE+A130/e20777db/2442' },
} satisfies Record<string, Source>;

/** Material id → references (Nordion's gamma guide applies to every sterilization rating). */
const BY_ID: Record<string, Source[]> = {
  pc: [S.covestro],
  pmma: [S.acrylite],
  pa6: [S.nylonMoisture, S.ulPA],
  pa66: [S.nylonMoisture, S.ulPA],
  pa46: [S.ulPA],
  pa66gf: [S.nylonMoisture, S.weld],
  pbtgf: [S.weld],
  pom: [S.delrin, S.celcon],
  pomh: [S.delrin],
  psu: [S.udel, S.sulfones, S.solvaySteril],
  ppsu: [S.sulfones, S.solvaySteril],
  pes: [S.sulfones],
  peek: [S.victrex, S.solvaySteril],
  peekcf: [S.peekCA30, S.victrex],
  pei: [S.ultem],
  pps: [S.fortron, S.ppsMold],
  ppa: [S.amodel, S.weld],
  coc: [S.topas],
  ptfe: [S.daikin],
  nbr: [S.parker],
  hnbr: [S.parker],
  epdm: [S.parker],
  fkm: [S.parker],
  ffkm: [S.parker],
  cr: [S.parker],
  iir: [S.parker],
  lsr: [S.parker],
  tpc: [S.hytrel],
  peba: [S.pebax4033, S.pebax],
  tpv: [S.santoprene],
  pcabs: [S.cycoloy],
  pekk: [S.kepstan],
  pa11: [S.rilsan],
  pla: [S.ingeo],
  lcp: [S.vectra],
};

export function sourcesFor(id: string): Source[] {
  return [...(BY_ID[id] ?? []), S.nordion];
}

export const ALL_SOURCES: Source[] = Object.values(S);
