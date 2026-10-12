/**
 * Where each material is used, why, and a few historical facts.
 * Every line comes from the linked page: mostly manufacturers' and stock-shape
 * makers' own application pages. "why" is filled only where the source states
 * the reason; otherwise the use is listed on its own.
 */

import type { Src } from "./guides";

export interface AppItem {
  use: string;
  why?: string;
  src: Src;
}
export interface FunFact {
  text: string;
  src: Src;
}

const ens = (slug: string, name: string): Src => ({
  label: `Ensinger, ${name} page`,
  url: `https://www.ensingerplastics.com/en/thermoplastic-materials/${slug}`,
});

const S = {
  peek: ens("peek-plastic", "PEEK"),
  pom: ens("pom-acetal", "POM (acetal)"),
  pa: ens("pa-polyamide", "PA (nylon)"),
  paExt: ens("extruded-nylon", "extruded PA"),
  pe: ens("pe-plastic", "PE"),
  ptfe: ens("ptfe-material", "PTFE"),
  pc: ens("pc-polycarbonate", "PC"),
  pei: ens("pei-plastic", "PEI"),
  pps: ens("pps-plastic", "PPS"),
  psu: ens("psu-plastic", "PSU"),
  ppsu: ens("ppsu-plastic", "PPSU"),
  pvdf: ens("pvdf-plastic", "PVDF"),
  abs: ens("abs-plastic", "ABS"),
  pp: ens("pp-plastic", "PP"),
  pet: ens("pet-polyester", "PET"),
  pbt: ens("pbt-material", "PBT"),
  lcp: ens("lcp-plastic", "LCP"),
  pai: ens("torlon-pai-polyamid-imide", "Torlon PAI"),
  pi: ens("pi-polyimide", "PI"),
  pekk: ens("pekk", "PEKK"),
  pes: ens("pes-plastic", "PES"),
  pmp: ens("pmp-plastic", "PMP"),
  ppa: ens("ppa-plastic", "PPA"),
  ppe: ens("ppe-plastic", "PPE"),
  san: ens("san-plastic", "SAN"),
  parker: { label: "Parker O-Ring Handbook (ORD 5700), section 2", url: "https://nfc.arizona.edu/sites/default/files/2022-02/parker_o-ring_handbook.pdf" },
  topas: { label: "TOPAS, medical-grade COC page", url: "https://topas.com/medical-grade-resin" },
  daikin: { label: "Daikin, fluoropolymers overview", url: "https://www.daikinchemicals.com/solutions/products/fluoropolymers.html" },
  natureworks: { label: "NatureWorks, Ingeo 3D printing page", url: "https://natureworksllc.com/applications/3d-printing" },
  pebax: { label: "Arkema, Pebax elastomer family page", url: "https://hpp.arkema.com/en/product-families/pebax-elastomer-family/" },
  uhmwJoint: { label: "MD+DI, Meeting the joint replacement challenge with UHMWPE (Kurtz et al.)", url: "https://www.mddionline.com/business/meeting-the-joint-replacement-challenge-with-uhmwpe" },
  ineosPF: { label: "INEOS Styrolution styrenics product portfolio (EMEA)", url: "https://www.ineos.com/globalassets/contentonthispageorblock/ineos-styrolution-styrenics-product-portfolio-emea.pdf" },
  eastmanRigid: { label: "Eastman, rigid medical packaging page", url: "https://eastman.com/Markets/Healthcare-Packaging/Pages/Rigid-Medical-Packaging.aspx" },
  pvcOrg: { label: "PVCEurope / ECVM, PVC applications", url: "https://pvc.org/pvc-applications" },
  roehmLamp: { label: "Röhm, Seeing and being seen (headlamp story)", url: "https://www.roehm.com/en/story/seeing-and-being-seen" },
  bayblend: { label: "Covestro, Bayblend for automotive interiors (2016)", url: "https://www.formerra.com/sites/default/files/2021-07/cov-bayblend-for-automotive-interiors-final-2016-06-20.pdf" },
  elastollan: { label: "BASF, Elastollan application portfolio", url: "https://plastics-rubber.basf.com/emea/en/performance_polymers/products/elastollan.html" },
  hytrelCvj: { label: "DuPont, Hytrel in CVJ boots: 30 trouble-free years", url: "https://www.pp.dupont.com/knowledge/hytrel-25-years.html" },
  santoprene: { label: "Celanese Santoprene TPV product guide (Entec)", url: "https://entecpolymers.com/resources/product-guides/celanese-santoprene-geolast-tpv-product-guide" },
  stanyl: { label: "Envalior, Stanyl TW341 property data", url: "https://plasticsfinder.envalior.com/api/document/tech/Stanyl%C2%AE%20TW341/wpuLu8amJ/en" },
  peekCA30: { label: "Victrex, PEEK 450CA30 datasheet", url: "https://cdn.victrex.com/en/downloads/datasheets/victrex-peek-450ca30" },
  ultradurG6: { label: "BASF, Ultradur B4300 G6 product page", url: "https://products-asia.basf.com/products/ultradur-b4300-g6-polybutylene-terephthalate" },
  ultramidLT: { label: "BASF, Ultramid A3WG6 LT BK product information", url: "https://download.basf.com/p1/8a8082587fd4b608017fd65c882559b5/en/ULTRAMID%253Csup%253E%25C2%25AE%253Csup%253E_A3WG6_LT_BLACK" },
  // History
  teflon: { label: "Chemours, Teflon history", url: "https://www.teflon.com/en/news-events/history" },
  pc70: { label: "Covestro, 70 years of polycarbonate", url: "https://www.covestro.com/en/company/covestro-worldwide/deutschland/covestro-in-deutschland/standorte/krefeld-uerdingen/70-jahre-polycarbonat" },
  rscPE: { label: "RSC Speciality Chemicals, polyethylene discovery", url: "https://rscspecialitychemicals.org.uk/polythethylene/" },
  acsNylon: { label: "ACS, Wallace Carothers historical resource (PDF)", url: "https://www.acs.org/content/dam/acsorg/education/whatischemistry/landmarks/carotherspolymers/modern-polymer-science-wallace-h-carothers-historical-resource.pdf" },
  ethwPP: { label: "ETHW, Giulio Natta and isotactic polypropylene", url: "https://ethw.org/Giulio_Natta_and_the_Isotactic_Polypropylene" },
  victrex40: { label: "Victrex, 40 years of PEEK", url: "https://www.victrex.com/news/2018/11/40-years-of-peek-success" },
  lego: { label: "LEGO, What LEGO bricks are made of", url: "https://www.lego.com/en-us/service/help-topics/article/what-lego-bricks-are-made-of" },
  evonikRoehm: { label: "Evonik history, Röhm", url: "https://history.evonik.com/en/predecessor-companies/roehm" },
  roehm90: { label: "Röhm, PLEXIGLAS turns 90", url: "https://www.roehm.com/en/detail/plexiglas-r-the-original-celebrates-its-90th-birthday" },
  rilsan70: { label: "Plastics Technology, one of the first biobased nylons turns 70", url: "https://www.ptonline.com/blog/post/one-of-the-first-biobased-nylons-turns-70" },
} satisfies Record<string, Src>;

const nylonUses: AppItem[] = [
  { use: "Automotive parts, industrial valves, railway sleeper insulation", why: "“combination of high strength, toughness and low weight” makes it a metal substitute", src: S.pa },
  { use: "Bearings and wear parts", why: "high wear resistance and a low coefficient of friction", src: S.pa },
  { use: "Gear wheels, roller wheels, pulleys, chain guides, fuel hoses, oil filters", src: S.paExt },
];

const APPS: Record<string, AppItem[]> = {
  pp: [
    { use: "Chemical equipment, sewage treatment, food transport boxes, fittings", why: "“excellent chemical resistance due to its non-polar nature”, very low moisture absorption, FDA food-grade options", src: S.pp },
    { use: "Medical trays, simple handles, mammography body-contact plates, car interiors", src: S.pp },
  ],
  hdpe: [
    { use: "Gas and drinking-water pipes; silo and conveyor-channel liners", src: S.pe },
    { use: "Guide pulleys and chain guides", why: "abrasion resistance increases with molecular weight", src: S.pe },
  ],
  ldpe: [
    { use: "Dielectric (insulating) parts", why: "minimal moisture absorption", src: S.pe },
  ],
  uhmwpe: [
    { use: "Hip and knee joint bearing surfaces", why: "low friction, low wear and biocompatibility", src: S.uhmwJoint },
    { use: "Chain guides, guide pulleys, silo and conveyor liners", why: "abrasion resistance rises with molecular weight, so UHMW grades wear best", src: S.pe },
  ],
  gpps: [
    { use: "Food service, packaging, refrigerator components, medical items", why: "transparency and heat resistance", src: S.ineosPF },
  ],
  hips: [
    { use: "Refrigerator inner and door liners (thermoformed sheet), injection-molded fridge parts", why: "good impact strength, chemical resistance and thermoformability", src: S.ineosPF },
    { use: "Toys and office supplies", src: S.ineosPF },
  ],
  pvc: [
    { use: "Water and sewage pipes", why: "service life of more than 100 years", src: S.pvcOrg },
    { use: "Wire and cable sheathing", why: "“prevent potentially fatal electrical accidents”", src: S.pvcOrg },
    { use: "Medical tubing", why: "“does not kink or break, and is easy to sterilise”", src: S.pvcOrg },
    { use: "Construction profiles, roofing membranes, car components", src: S.pvcOrg },
  ],
  abs: [
    { use: "Household appliances, toys, electronics housings, garden equipment, car parts", why: "flowability, impact strength, low-temperature toughness, high gloss", src: S.ineosPF },
    { use: "Mirror mounts, interior trim, handle parts", why: "cost-effective; bonds easily with cyanoacrylates, epoxies and structural acrylics", src: S.abs },
  ],
  pc: [
    { use: "Headlight lenses, rear and side windows, building glazing", why: "“Impact strength and UV/weather resistance also help polycarbonate replace glass”", src: S.pc },
    { use: "Electronics housings, CDs/DVDs, lenses and sight glasses, medical disposables", src: S.pc },
  ],
  pcabs: [
    { use: "Car interiors: bezels, air vents, airbag covers, consoles, armrests", why: "“high mechanical performance, surface quality and durability at high temperatures”", src: S.bayblend },
  ],
  pmma: [
    { use: "Headlamp indicators and lenses", why: "colorless, high light transmission that does not drop over time, faithful colors", src: S.roehmLamp },
  ],
  petg: [
    { use: "Clear rigid medical packaging (trays, blisters)", why: "clarity after sterilization, toughness, thermoformability and clean cutting", src: S.eastmanRigid },
  ],
  pet: [
    { use: "Electronics cases, switches, coil bodies; gears and sliding elements", why: "high strength, very low moisture absorption, good creep resistance", src: S.pet },
    { use: "Functional parts in drug-dosing systems; food-conveyor guides and rollers", src: S.pet },
  ],
  pbt: [
    { use: "Connector strips and insulating housings", why: "good electrical properties and dimensional stability", src: S.pbt },
    { use: "Food-processing parts, valves, pump housings", why: "resists chlorinated and corrosive cleaning solutions", src: S.pbt },
  ],
  pa6: nylonUses,
  pa66: nylonUses,
  pa12: [
    { use: "Flexible parts", why: "PA12 is the “soft and flexible” nylon", src: S.pa },
    ...nylonUses.slice(0, 1),
  ],
  pom: [
    { use: "Bearings, bushings, rollers, slide rails", why: "excellent wear resistance and sliding properties", src: S.pom },
    { use: "Snap hooks", why: "good elastic behaviour", src: S.pom },
    { use: "Food-processing parts", why: "copolymer (POM-C) is preferred where strong chlorinated cleaners are used", src: S.pom },
    { use: "Water-contact parts, electrical insulators, high-gloss visible parts", src: S.pom },
  ],
  pomh: [
    { use: "Bearings, gears and sliding parts", why: "homopolymer has slightly higher density, hardness, strength and melting point than POM-C", src: S.pom },
  ],
  ppe: [
    { use: "Electrical parts, home appliances, food processing, plant engineering", why: "extremely low moisture uptake and stable insulation across humidity and temperature", src: S.ppe },
  ],
  coc: [
    { use: "Prefilled syringes, cartridges and drug containers", why: "very low leachables and extractables, excellent moisture barrier, much less breakage than glass", src: S.topas },
    { use: "Microplates, cuvettes, microfluidic and PCR devices", why: "transparent to UV and visible light", src: S.topas },
  ],
  psu: [
    { use: "Connectors, lamp sockets, microwave dishes, inspection windows, pump housings", why: "very high hydrolysis resistance (repeated steam sterilisation) and creep resistance", src: S.psu },
  ],
  ppsu: [
    { use: "Trial implants for hip, knee and shoulder surgery; medical equipment handles", why: "survives repeated steam sterilisation and gamma / X-ray exposure; high impact strength", src: S.ppsu },
  ],
  pes: [
    { use: "Dialysis-system control panels, water-filtration membranes, face shields, pump housings", why: "tight tolerances with low dimensional change over a wide temperature range", src: S.pes },
  ],
  pei: [
    { use: "Aircraft interior components", why: "inherently flame retardant with low smoke (UL94 V-0)", src: S.pei },
    { use: "Coils, fuses, lab equipment, medical and food parts", why: "hydrolysis resistance allows repeated steam sterilisation", src: S.pei },
  ],
  pps: [
    { use: "Semiconductor CMP retaining rings, IC test sockets, PCB inspection fixtures", why: "dimensional stability, cleanliness and micro-hole machinability", src: S.pps },
    { use: "Under-hood, fuel and brake-system parts; chemical valves and pumps", why: "long-term use to 230 °C and chemical resistance broader than PEEK", src: S.pps },
  ],
  peek: [
    { use: "Back-up rings and gear wheels", why: "260 °C long-term service with low creep at temperature", src: S.peek },
    { use: "Dental healing caps, trauma surgery instruments", why: "withstands over 1,500 steam cycles at 134 °C; very good chemical resistance", src: S.peek },
    { use: "Semiconductor and aerospace parts", why: "very low metal-ion contamination; no outgassing concerns in vacuum", src: S.peek },
  ],
  peekcf: [
    { use: "Parts needing higher strength and stiffness in static or dynamic systems", why: "wear resistance, low friction and low thermal expansion", src: S.peekCA30 },
  ],
  pekk: [
    { use: "Aerospace, transport, oil and gas parts", why: "excellent flame retardancy, strength at high temperature, chemical resistance", src: S.pekk },
  ],
  lcp: [
    { use: "Small, flat electronic and medical parts in tight spaces", why: "very low melt viscosity fills very thin walls over long flow paths", src: S.lcp },
  ],
  pai: [
    { use: "Seals and bearings above 150 °C, compressor parts, labyrinth seals", why: "“the preferred solution for seals or for bearings exposed to temperatures above 150 °C”", src: S.pai },
    { use: "Semiconductor test sockets, aerospace fasteners", src: S.pai },
  ],
  pi: [
    { use: "Unlubricated bearings, bushings and piston rings", why: "low friction and wear even dry and at high pV loads", src: S.pi },
    { use: "Semiconductor and aerospace equipment, IC test sockets", why: "high purity and low outgassing", src: S.pi },
    { use: "Cryogenic parts and 300 °C sensor housings", why: "usable from −270 °C up to 300 °C long-term", src: S.pi },
  ],
  ppa: [
    { use: "Automotive pumps, fuel and cooling lines, headlight parts", why: "metal substitute with HDT above 280 °C and very low moisture uptake", src: S.ppa },
  ],
  pa46: [
    { use: "Hot-running wear parts", why: "Envalior describes TW341 as combining wear and friction properties with creep, fatigue strength and stiffness at high temperature", src: S.stanyl },
  ],
  pa11: [
    { use: "Automotive fuel lines and oil & gas applications", why: "became the reference material there for its “unique set of extreme performance properties”", src: S.rilsan70 },
    { use: "Lightweight sports equipment, 3D printing, metal replacement", src: S.rilsan70 },
  ],
  pa66gf: [
    { use: "Structural parts needing strength and stiffness", why: "glass fibres increase strength and stiffness of nylon", src: S.pa },
    { use: "Technical parts in laser-transparent black (A3WG6 LT)", src: S.ultramidLT },
  ],
  pbtgf: [
    { use: "Automotive connectors and electronic unit housings", why: "rigid technical parts with high hydrolysis resistance", src: S.ultradurG6 },
  ],
  ptfe: [
    { use: "Chemical-plant valves, pump parts, gaskets and seals", why: "extremely high chemical resistance", src: S.ptfe },
    { use: "Bearings, bushings, rollers and seal rings", why: "very low friction, electrical resistance and a non-stick surface", src: S.ptfe },
    { use: "Seal tape, wire insulation, tubing, filtration and apparel membranes", src: S.daikin },
  ],
  pvdf: [
    { use: "Chemical-plant pipe linings, valves and filter plates", why: "very good thermal and chemical resistance", src: S.pvdf },
    { use: "Piezoelectric microphones, hydrophones and actuators", why: "strong piezoelectric effect after polarisation", src: S.pvdf },
  ],
  fep: [{ use: "Wire and cable insulation, tubes, films, lining sheet", why: "chemical resistance and electrical properties on par with PTFE and PFA", src: S.daikin }],
  pfa: [{ use: "Semiconductor tubes and fittings, wire and cable", why: "same properties as PTFE", src: S.daikin }],
  etfe: [{ use: "Wire and cable, release film, roofing membranes", why: "superior mechanical properties (tensile and tear strength)", src: S.daikin }],
  pctfe: [{ use: "Seals, pump parts, tubes", why: "superior moisture barrier and mechanical properties", src: S.daikin }],
  san: [
    { use: "Water tanks, food containers, shower trays, cosmetic articles, medical devices", why: "transparency, chemical resistance and stiffness", src: S.ineosPF },
  ],
  asa: [
    { use: "Car grilles, mirror housings, pillars and spoilers; roof tiles, gutters, sidings", why: "UV resistance and colour fastness outdoors", src: S.ineosPF },
  ],
  pmp: [
    { use: "Lab ware, medical parts, microwave components, lightweight parts", why: "one of the lowest densities of any engineering material; good insulation", src: S.pmp },
  ],
  pla: [
    { use: "3D-printing filament", why: "sharp melting, very low emissions, low shrink, no heated chamber needed", src: S.natureworks },
    { use: "Food serviceware, packaging, fibers", src: S.natureworks },
  ],
  tpu: [
    { use: "Footwear, cable jackets, hoses, belts, films, winter-sports gear", why: "outstanding abrasion and wear resistance; resists oils and greases; flexible from −40 to +100 °C (hoses)", src: S.elastollan },
  ],
  tpv: [
    { use: "Automotive and EV seals, under-hood parts, cable jackets, food-contact parts", why: "“behaves like a rubber but processes like a thermoplastic”, and scrap can be recycled", src: S.santoprene },
  ],
  tpc: [
    { use: "Constant-velocity joint (CVJ) boots", why: "compared with rubber, allows thinner designs for tight spaces", src: S.hytrelCvj },
  ],
  peba: [
    { use: "Parts that need low weight and high rebound", why: "“an unmatched combination of light weight and energy return”", src: S.pebax },
    { use: "Antistatic and breathable films", src: S.pebax },
  ],
  nbr: [{ use: "Seals for petroleum oils, greases, diesel and fuel oils", why: "good oil and fuel resistance plus high wear resistance", src: S.parker }],
  hnbr: [{ use: "Seals needing more strength than NBR; vegetable oils, hot water", why: "high strength reduces extrusion and wear", src: S.parker }],
  epdm: [{ use: "Seals in phosphate-ester hydraulics and glycol brake systems", why: "“particularly useful when sealing phosphate-ester hydraulic fluids”; ozone and weather resistant", src: S.parker }],
  fkm: [{ use: "High-temperature seals for fuels, oils and aromatics", why: "resists heat to about 204 °C, ozone, oxygen and many solvents", src: S.parker }],
  ffkm: [{ use: "Seals in semiconductor chip manufacturing and jet engines", why: "highest temperature range and broadest chemical compatibility of the elastomers", src: S.parker }],
  cr: [{ use: "Refrigerant seals (ammonia, CO₂) and weather-exposed parts", why: "ozone, aging and weathering resistance better than nitrile", src: S.parker }],
  iir: [{ use: "Gas-tight seals, hot water and steam to 121 °C, glycol brake fluids", why: "“very low permeability rate and good electrical properties”", src: S.parker }],
  lsr: [{ use: "Seals for animal and vegetable oils; insulating parts", why: "ozone and weather resistance, insulation, “physiologically neutral”", src: S.parker }],
};

const FACTS: Record<string, FunFact[]> = {
  ptfe: [{ text: "Discovered on 6 April 1938, when Roy Plunkett found that a stored cylinder of tetrafluoroethylene gas had “polymerized spontaneously into a white, waxy solid”. Teflon products were first sold in 1946.", src: S.teflon }],
  fep: [{ text: "FEP was introduced under the Teflon name in 1960, 22 years after PTFE was discovered.", src: S.teflon }],
  pfa: [{ text: "PFA followed FEP in 1972.", src: S.teflon }],
  etfe: [{ text: "Tefzel ETFE was introduced in 1970.", src: S.teflon }],
  pc: [
    { text: "Invented by Hermann Schnell at Bayer’s Krefeld-Uerdingen laboratory; his patent dates to 16 October 1953.", src: S.pc70 },
    { text: "Ed White’s 1965 spacewalk helmet visor was a licensed polycarbonate, and the first pop CD pressed in Makrolon was ABBA’s “The Visitors” (1982).", src: S.pc70 },
  ],
  ldpe: [{ text: "First isolated as a “waxy solid” at ICI Winnington on 27 March 1933 by Gibson and Fawcett, from ethylene at 2,000 atmospheres. Its first big job was insulating wartime RADAR.", src: S.rscPE }],
  pp: [{ text: "Isotactic polypropylene was first made by Giulio Natta’s group in Milan on 11 March 1954; Natta shared the 1963 Nobel Prize in Chemistry.", src: S.ethwPP }],
  uhmwpe: [{ text: "John Charnley’s earliest hip replacements (1958) used PTFE; in 1962 he moved to UHMWPE as the alternative.", src: S.uhmwJoint }],
  pa66: [{ text: "Nylon’s first product was toothbrush bristles (1938). When nylon stockings went on sale nationwide on 15 May 1940, nearly 800,000 pairs sold on the first day.", src: S.acsNylon }],
  cr: [{ text: "Neoprene, from DuPont, was the first synthetic rubber made in the United States (1932).", src: S.acsNylon }],
  peek: [{ text: "The first batch of PEEK was made at ICI on 19 November 1978. Victrex now counts it in about 4 billion phones and 9 million implantable devices.", src: S.victrex40 }],
  abs: [{ text: "Most LEGO pieces have been made of ABS since 1963, for its “clutch power”, high gloss and colours.", src: S.lego }],
  pmma: [
    { text: "Otto Röhm registered the PLEXIGLAS trademark on 9 August 1933. Molding granules were used for car tail lights from 1935.", src: S.evonikRoehm },
    { text: "Today it glazes giant aquariums and deep-sea submarines.", src: S.roehm90 },
  ],
  pa11: [{ text: "Made 100 % from castor beans. First produced in 1947 in a converted spinning mill in Serquigny, France; in the 1950s it was used for the fuel lines of the Citroën DS.", src: S.rilsan70 }],
  pla: [{ text: "NatureWorks says Ingeo is “made from greenhouse gases” and has a very low carbon footprint.", src: S.natureworks }],
  petg: [{ text: "Eastar 6763 has been “the standard for clear rigid medical packaging for more than 20 years”.", src: S.eastmanRigid }],
  tpc: [{ text: "Hytrel CVJ boots won the SPE Hall of Fame Award in 2014, given to one part in continuous production for at least 15 years.", src: S.hytrelCvj }],
};

export function applicationsFor(id: string): AppItem[] {
  return APPS[id] ?? [];
}
export function funFactsFor(id: string): FunFact[] {
  return FACTS[id] ?? [];
}
