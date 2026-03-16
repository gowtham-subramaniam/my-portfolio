export const profile = {
  name: "Gowtham Subramaniam",
  title: "Mechanical Engineer",
  location: "San Diego, CA",
  experience: "9+ years",
  email: "gowtham.subramaniam.c@gmail.com",
  linkedin: "https://www.linkedin.com/in/gowthamsubramaniam/",
  photo: "/photo.jpeg",
  tagline:
    "Mechanical Engineer specializing in precision electromechanical systems — from molecular diagnostics to radiation detection platforms.",
  about: [
    "I build hardware that has to work — in regulated environments, under tight tolerances, and at the intersection of mechanical, electrical, and software systems. Over nine years I've owned problems end-to-end: from architecture definition and concept selection through detailed design, prototyping, and production.",
    "My work spans molecular diagnostics instruments at Cepheid, DARPA-funded radiation detection platforms at Silverside Detectors, and a growing interest in sharing engineering thinking through writing.",
  ],
};

export const experience = [
  {
    dates: "Jul 2022 – Present",
    location: "Sunnyvale, CA",
    title: "Mechanical Engineer III",
    company: "Cepheid · Molecular Diagnostics",
    bullets: [
      "Led mechanical architecture definition for an electromechanical subsystem — evaluated three concepts, owned detailed design and integration from concept through production.",
      "Designed a closed-loop servo actuation system with magnetic and optical position feedback for precise, repeatable motion under tolerance and environmental variation.",
      "Developed a voice-coil actuation concept as a cost-focused alternative, achieving a 60% unit cost reduction while meeting all performance targets.",
      "Built an automated XY positioning stage using piezoelectric drives and machine vision for high-accuracy reagent placement.",
      "Engineered magnetic capture mechanisms for sub-micron bead manipulation, optimizing mechanical and fluidic coupling.",
    ],
  },
  {
    dates: "Feb 2017 – Jul 2022",
    location: "Waltham, MA",
    title: "Mechanical Engineer",
    company: "Silverside Detectors · Radiation Security",
    bullets: [
      "Led mechanical design and system integration for two DARPA-funded radiation detection platforms — fixed and portable — integrating gamma/neutron sensors, cameras, and communications.",
      "Owned the portable platform end-to-end: VoC definition, concept generation, detailed design, prototyping, and customer training.",
      "Designed ruggedized architectures for portable operation with MIL-STD-810 compliant shock isolation and sealing strategies.",
      "Performed structural FEA on enclosure and mounting assemblies to validate stiffness, strength, and load paths.",
    ],
  },
];

export const skills = [
  {
    category: "Design & Integration",
    color: "#eef4fc",
    textColor: "#1a4a8a",
    items: ["SolidWorks", "Onshape", "GD&T", "Tolerance Analysis", "Sheet Metal", "Injection Molding", "3D Printing", "FEA (Abaqus, SimScale)"],
  },
  {
    category: "Manufacturing",
    color: "#f0faf0",
    textColor: "#1a5c2a",
    items: ["DFM", "DFA", "FMEA", "Lean Six Sigma", "Value Stream Mapping"],
  },
  {
    category: "Systems & Controls",
    color: "#fdf6ee",
    textColor: "#7a4010",
    items: ["Servo Actuation", "Closed-loop Control", "Fluidics", "Magnetic Systems"],
  },
  {
    category: "Programming",
    color: "#f5eef8",
    textColor: "#5a2080",
    items: ["Python", "MATLAB"],
  },
];

export const education = [
  {
    year: "Dec 2016",
    degree: "M.S. Mechanical Engineering",
    school: "Northeastern University · Boston, MA",
  },
  {
    year: "May 2014",
    degree: "B.E. Mechanical Engineering",
    school: "Anna University · Chennai, India",
  },
];