/**
 * Plain-language definitions for every property label in Polymer Finder.
 * Shown when a property name is clicked. Test standards named are the usual
 * ASTM / ISO methods behind datasheet values.
 */

export interface Definition {
  term: string;
  text: string;
  /** Optional practical note: how to use the number, common traps */
  tip?: string;
}

export const GLOSSARY = {
  contUse: {
    term: 'Max continuous use temperature',
    text: 'The highest temperature a material can sit at for long periods (thousands of hours) and still keep a useful share of its properties. Usually based on UL 746B relative thermal index (RTI) or the supplier’s long-term heat-aging data.',
    tip: 'A long-term aging limit, not a load-bearing limit. A part under stress can deform well below it, so also check HDT and creep data.',
  },
  hdt: {
    term: 'HDT @ 1.8 MPa (heat deflection temperature)',
    text: 'The temperature at which a standard bar loaded in bending to 1.8 MPa (264 psi) deflects a set amount (0.25 mm in ASTM D648) while being heated at 2 °C per minute. ISO 75 method A is the equivalent.',
    tip: 'A short-term softening indicator for comparing materials, not a service temperature. Fillers raise HDT a lot (nylon 66 goes from about 90 °C to about 250 °C with 30% glass) without raising the long-term heat-aging limit as much.',
  },
  tensile: {
    term: 'Tensile strength',
    text: 'The highest stress a standard dog-bone specimen carries when pulled (ASTM D638 / ISO 527), in MPa. For ductile plastics this is usually the yield strength; for brittle or fiber-filled grades it is the strength at break.',
    tip: 'Short-term, room-temperature value. Long-term loads, heat, moisture and weld lines all lower the stress a real part can carry.',
  },
  modulus: {
    term: 'Tensile modulus (stiffness)',
    text: 'Young’s modulus: the slope of the stress–strain curve at small strain, in GPa. A higher number means a stiffer material that deflects less under the same load.',
    tip: 'Plastics creep, so the effective modulus under a sustained load is lower, and it drops further as temperature rises toward Tg.',
  },
  hardness: {
    term: 'Hardness (Shore durometer)',
    text: 'Resistance to indentation measured with a durometer (ASTM D2240). Shore A is used for soft rubbers and Shore D for harder elastomers and plastics; each scale runs 0–100.',
    tip: 'The A and D scales overlap but are not exactly convertible. Compare within one scale.',
  },
  density: {
    term: 'Density',
    text: 'Mass per unit volume, in g/cm³ (ASTM D792 / ISO 1183). Water is 1.0, so materials below 1.0 (PP, PE, PMP) float.',
    tip: 'Resin is bought by weight but parts are sized by volume, so density directly affects part weight and material cost per part.',
  },
  cost: {
    term: 'Relative cost',
    text: 'An indicative resin price tier from $ (commodity, such as PP or PE) to $$$$$ (high-performance, such as PEEK or FFKM). Not a quote.',
    tip: 'Prices vary with grade, color, volume and region; processing cost (drying, hot molds, slow cycles) often matters as much as resin price.',
  },
  tgtm: {
    term: 'Tg / Tm (glass transition / melting)',
    text: 'Tg is where the amorphous (non-crystalline) regions change from glassy and rigid to rubbery. Tm is where crystals melt; only semi-crystalline polymers have one. Amorphous plastics lose most of their stiffness above Tg; semi-crystalline ones keep useful strength between Tg and Tm.',
    tip: 'A “—” for Tm means the polymer is amorphous (no crystalline melting point).',
  },
  elongation: {
    term: 'Elongation at break',
    text: 'How far a tensile specimen stretches before breaking, as a percentage of its original length. A rough measure of ductility.',
    tip: 'High elongation does not mean a part tolerates repeated straining; snap-fits are designed to a much lower allowable strain.',
  },
  water: {
    term: 'Water absorption (24 h)',
    text: 'Weight gained by a specimen after 24 hours immersed in water at 23 °C (ASTM D570 / ISO 62). Saturation values are much higher for absorbent polymers such as nylon.',
    tip: 'Absorbed water lowers stiffness and strength and makes parts grow. It also tells you which resins must be dried before molding.',
  },
  transparency: {
    term: 'Transparency',
    text: 'Whether the natural (uncolored) resin can be clear, translucent (lets light through but blurs it) or opaque.',
    tip: 'Semi-crystalline polymers are usually translucent or opaque because crystals scatter light; clarity also depends on wall thickness and mold finish.',
  },
  ul94: {
    term: 'UL94 flammability rating',
    text: 'Result of the UL 94 small-flame test. HB means slow burning in a horizontal bar. V-2, V-1 and V-0 are vertical tests where the flame must self-extinguish; V-0 is the strictest (fastest self-extinguishing, no flaming drips). 5VA / 5VB are more severe tests.',
    tip: 'Ratings belong to a specific grade at a specific thickness. “Base” means the typical unmodified resin; flame-retardant grades of most polymers exist.',
  },
  uv: {
    term: 'UV / weathering',
    text: 'How well the unstabilized resin resists sunlight and outdoor exposure: yellowing, chalking, loss of gloss and embrittlement.',
    tip: 'UV stabilizers, carbon black or a cap layer improve most polymers a lot. Check the grade if the part lives outdoors.',
  },
  steam: {
    term: 'Steam autoclave sterilization',
    text: 'Sterilization with pressurized saturated steam, typically 121 °C for about 15–30 minutes or 134 °C for a few minutes. “Yes” means suitable for repeated cycles; “Limited” means a few cycles or only specific grades.',
    tip: 'Repeated cycles combine heat, moisture and often detergents, so hydrolysis and stress cracking show up over time. Test with the real cycle count.',
  },
  gamma: {
    term: 'Gamma sterilization',
    text: 'Sterilization with ionizing radiation from a cobalt-60 source, typically 25–50 kGy. Radiation can break polymer chains (embrittlement) or crosslink them, and often causes yellowing.',
    tip: 'Acetal, PTFE and unstabilized PP are known to degrade. Radiation-stabilized grades of PP and PC exist; electron beam behaves similarly.',
  },
  eto: {
    term: 'Ethylene oxide (EtO) sterilization',
    text: 'Low-temperature gas sterilization (roughly 30–60 °C with humidity). Compatible with almost all polymers, which is why it is used for heat- and radiation-sensitive devices.',
    tip: 'Parts need aeration afterward to remove residual EtO, and long cycle times are the main drawback.',
  },
  chem: {
    term: 'Chemical resistance',
    text: 'How the material holds up to each chemical class at room temperature with short-to-moderate exposure and no applied stress. Excellent and Good mean usable; Fair means limited exposure only; Poor means not recommended.',
    tip: 'Stress plus chemicals together can crack parts (environmental stress cracking) at ratings that look fine here. Test molded parts under real strain.',
  },
  acids: { term: 'Dilute acids', text: 'Low-concentration acids such as dilute hydrochloric, sulfuric or acetic acid. Concentrated and oxidizing acids (nitric, hot sulfuric) are much more aggressive.' },
  bases: { term: 'Bases / alkalis', text: 'Alkaline solutions such as sodium hydroxide, ammonia and many alkaline detergents. Polyesters and polycarbonate hydrolyze in them, especially when hot.' },
  alcohols: { term: 'Alcohols', text: 'Isopropyl alcohol (IPA), ethanol and methanol, including common disinfectant wipes.' },
  bleach: { term: 'Bleach / oxidizers', text: 'Sodium hypochlorite (bleach), hydrogen peroxide and other oxidizing agents, common in cleaning and disinfection.' },
  oils: { term: 'Oils, fuels, greases', text: 'Hydrocarbon fluids: mineral and synthetic oils, gasoline, diesel and greases.' },
  ketones: { term: 'Ketones & esters', text: 'Polar solvents such as acetone, MEK and ethyl acetate. They dissolve or craze many amorphous plastics.' },
  aromatics: { term: 'Aromatic & chlorinated solvents', text: 'Solvents such as toluene, xylene, benzene, dichloromethane and chloroform. Among the most aggressive common solvents for plastics.' },
  structure: {
    term: 'Structure',
    text: 'Amorphous polymers have randomly arranged chains: they can be clear, shrink little and evenly, and soften gradually above Tg. Semi-crystalline polymers contain ordered crystals: better chemical, fatigue and wear resistance, but higher and less uniform shrinkage. Elastomers are lightly crosslinked or phase-separated rubbers that recover from large strains.',
  },
  grades: {
    term: 'Medical and food-contact grades',
    text: 'Whether grades are commonly sold with medical (ISO 10993 / USP Class VI biocompatibility testing) or food-contact (FDA 21 CFR, EU 10/2011) documentation.',
    tip: 'Compliance belongs to the specific grade and colorant, not the polymer family. Always get the supplier’s statement for the exact grade.',
  },
  processes: {
    term: 'Processing methods',
    text: 'The manufacturing routes commonly used for this material, such as injection molding, extrusion, machining from stock shapes or 3D printing.',
  },
  aka: { term: 'Also known as', text: 'Other abbreviations and well-known trade names for the same polymer family. Trade-name grades differ, so treat these as pointers, not equivalents.' },
  basis: {
    term: 'Data basis',
    text: 'The type of grade the numbers on this card represent. Values are typical, from datasheets and reference tables; real grades can differ by 20–50%.',
    tip: 'Use these numbers to shortlist, then design from the supplier datasheet for the exact grade.',
  },
  shrink: {
    term: 'Mold shrinkage',
    text: 'How much a molded part shrinks from the cavity size as it cools, as a linear percentage (ASTM D955 / ISO 294-4). The tool is cut oversize by this amount.',
    tip: 'Semi-crystalline and fiber-filled grades shrink differently along and across flow, which drives warpage. Wall thickness and packing change it too.',
  },
  drying: {
    term: 'Drying',
    text: 'Typical temperature and time in a desiccant dryer before melt processing. Moisture causes splay marks and, for polyesters, polycarbonate and nylons, hydrolysis that cuts molecular weight.',
    tip: 'Parts molded from wet resin can look fine and still be brittle. Check the supplier’s maximum moisture level.',
  },
  melt: {
    term: 'Melt temperature',
    text: 'The recommended temperature range of the molten plastic during injection molding or extrusion.',
    tip: 'Too hot or too long in the barrel degrades the polymer; too cold gives high stress and weak weld lines.',
  },
  cure: {
    term: 'Cure temperature',
    text: 'The temperature at which a rubber compound is vulcanized (crosslinked) in the mold. Cure time depends on temperature and section thickness.',
  },
  mold: {
    term: 'Mold temperature',
    text: 'The temperature of the tool surface. It controls cooling rate, and with it crystallinity, shrinkage, surface finish and residual stress.',
    tip: 'High-performance semi-crystalline resins (PEEK, PPS, PPA) need hot molds to crystallize fully; a cold mold gives parts that shrink and warp later in service.',
  },
  family: {
    term: 'Family',
    text: 'A rough grouping by performance and price: commodity, engineering, high-performance, fluoropolymer and elastomer.',
  },
} satisfies Record<string, Definition>;

export type TermKey = keyof typeof GLOSSARY;
