"use client";

import BlogPost from "../../../components/blog/BlogPost";

export default function HowPlasticsFail() {
  return (
    <BlogPost>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0.5rem 0 1rem" }}>
        {["Materials", "DMA", "Polymers", "Viscoelasticity"].map((tag) => (
          <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: "#1a4a8a", background: "#eef4fc", padding: "3px 10px", borderRadius: 20, border: "1px solid #bdd4f4" }}>{tag}</span>
        ))}
      </div>

      <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
        How Plastics and Elastomers Fail Over Time
      </h1>
      <p style={{ fontSize: 14, color: "var(--subtle)", fontWeight: 500, marginBottom: "2rem" }}>
        Gowtham Subramaniam · March 21, 2026
      </p>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", lineHeight: 1.85, fontSize: 16, color: "var(--muted)" }}>

        <p>Plastics and elastomers fail in ways metals don&apos;t, because they&apos;re fundamentally different in structure.</p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "2rem 0 0.75rem", letterSpacing: "-0.01em" }}>Viscoelastic Materials</h2>
        <p>Plastics and elastomers are classified as <strong>viscoelastic materials</strong>. That is, these materials have both elastic and viscous properties; this depends on the temperature — above and below a critical point the material changes from viscous (damping) to elastic (hard/strong), and this temperature is called the <strong>glass transition temperature (Tg)</strong>. In general, plastics are used in applications where the operating temperature is below their Tg, where the material is hard and strong. Whereas elastomers have a Tg generally lower than room temperature, so in their application the material is soft and compliant.</p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "2rem 0 0.75rem", letterSpacing: "-0.01em" }}>Molecular Structure</h2>
        <p>One more difference is the molecular structure. Plastics are multiples of monomers connected to form a polymer, linked together like a long chain. A piece of plastic has thousands of these polymer chains and none of them are connected to each other. In elastomers the polymer chains are interconnected with each other and these connections are called <strong>crosslinks</strong>. These crosslinks act as anchors, preventing chains from permanently sliding past each other — which is why elastomers recover from deformation while plastics are more prone to permanent creep.</p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "2rem 0 0.75rem", letterSpacing: "-0.01em" }}>Time-Dependent Failure</h2>
        <p>Metals do not have the same failure modes as viscoelastic materials; their properties not only change with respect to temperature (for metals this is true) but also with respect to time. The Young&apos;s modulus of a metal changes with respect to temperature but not with respect to time. Whereas for viscoelastic materials this changes with respect to both time and temperature. This leads to two failure modes: creep and stress relaxation.</p>
        <p style={{ marginTop: "1rem" }}><strong>Creep</strong> is when a part is subjected to a constant stress and the material deforms over time. This is commonly noticeable in snap fits, where the snap arms are subjected to constant stress against the capture features, but over time the snap arms creep into a &quot;new&quot; shape, losing their clamp force.</p>
        <p style={{ marginTop: "1rem" }}><strong>Stress relaxation</strong>, on the other hand, is when the strain in the part is kept constant but the resultant stress/force reduces over time. You can notice this in O-ring compression. The gasket is compressed to a set height, resulting in a compression force to seal a part. Over time the gasket relaxes and loses its sealing force.</p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "2rem 0 0.75rem", letterSpacing: "-0.01em" }}>Dynamic Mechanical Analysis (DMA)</h2>
        <p>This demands special attention when an engineer designs and manufactures a part. Engineers need to know whether the part will last for the cycles and duration it is rated for. How can engineers determine this? The most straightforward approach is to subject the part to its operating temperatures and wait for the entire duration of its lifetime. Is this practical? No — companies do not have the luxury of waiting 20 years to launch a product.</p>
        <p style={{ marginTop: "1rem" }}>The test can be accelerated by increasing the temperature, which leads to a reduced test duration. How is it done? It is done with the help of <strong>Dynamic Mechanical Analysis (DMA)</strong>. A material is subjected to cyclical load with varying frequency and temperature. This is carried out using an instrument where the cyclical load is applied as strain and the instrument measures the resulting stress. If the material is purely elastic, the time at which max strain is applied is when the max stress will be — no lag. If the material is purely viscous, the stress response will lag the strain input by 90 degrees. Real polymers fall somewhere in between. This lag is called the <strong>phase lag</strong>. Since the input is sinusoidal, the phase lag is represented in degrees. The closer the phase lag is to 0°, the more elastic the material behaves; the closer to 90°, the more viscous.</p>
        <p style={{ marginTop: "1rem" }}>The measured stress and input strain are used to calculate the modulus, called the <strong>complex modulus</strong>. It is the resultant of storage modulus (E&apos;) and loss modulus (E&apos;&apos;). Loss modulus tells how much the material will dampen the output — that is, energy dissipated in the form of heat. Storage modulus tells how much energy is stored when the material is deformed.</p>
        <p style={{ marginTop: "1rem" }}>Imagine this as a right angle triangle. The complex modulus is the hypotenuse. Since storage modulus has no phase lag, it is the cosine component of the complex modulus. Loss modulus, which is 90° out of phase, is the sine component. The angle used in both functions is the phase lag δ.</p>
        <p style={{ marginTop: "1rem" }}>tan(δ) is calculated as the ratio of E&apos;&apos;/E&apos;. If tan(δ) is greater than 1 the material is behaving more viscously (damping dominant), and if the value is less than 1 the material is behaving more elastically (stiffness dominant). Tg can be identified from DMA when the storage modulus drops sharply and tan(δ) reaches a peak. The temperature at this peak is taken as the Tg of the material.</p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", margin: "2rem 0 0.75rem", letterSpacing: "-0.01em" }}>Building the Master Curve</h2>
        <p>The goal now is to get a master curve that shows storage/loss modulus over time, which can be used to estimate creep and stress relaxation.</p>
        <p style={{ marginTop: "1rem" }}>Using the DMA instrument, based on the strain amplitude, frequency range, and temperature range, the stress values are measured and the corresponding complex, storage, and loss moduli are calculated. This produces a separate curve for each temperature. The next step is to stitch these curves together to get the master curve.</p>
        <p style={{ marginTop: "1rem" }}>A reference temperature is selected and plotted. A shift factor is then calculated for each remaining temperature using the <strong>WLF equation</strong>:</p>

        <div style={{ background: "#eef4fc", border: "1px solid #bdd4f4", borderRadius: 8, padding: "1rem 1.5rem", margin: "1.25rem 0", fontFamily: "monospace", fontSize: 15, color: "#1a4a8a", textAlign: "center" }}>
          log(a<sub>T</sub>) = −C₁(T − T<sub>ref</sub>) / (C₂ + (T − T<sub>ref</sub>))
        </div>

        <p>C1 and C2 are material properties. Tref is the reference temperature, T is the temperature being fitted, and aT is the shift factor that determines how much to shift the curve. Note that this equation is valid only between Tg and Tg + 100°C; outside this range, an Arrhenius relationship is used instead.</p>
        <p style={{ marginTop: "1rem" }}>Once log(aT) is found, it is used to calculate the reduced frequency:</p>

        <div style={{ background: "#eef4fc", border: "1px solid #bdd4f4", borderRadius: 8, padding: "1rem 1.5rem", margin: "1.25rem 0", fontFamily: "monospace", fontSize: 15, color: "#1a4a8a", textAlign: "center" }}>
          ω<sub>r</sub> = ω · a<sub>T</sub>
        </div>

        <p>This gives the reduced frequency. Based on this, each curve is shifted to the left or the right until the edges of adjacent curves overlap smoothly. When this is repeated for all temperatures we get the master curve.</p>

      </div>
    </BlogPost>
  );
}
