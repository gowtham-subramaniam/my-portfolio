import type { Metadata } from "next";
import Link from "next/link";
import { profile, experience, skills, education } from "../../content";

export const metadata: Metadata = {
  title: `Resume — ${profile.name}`,
  description: `Full resume for ${profile.name}, ${profile.title}.`,
};

export default function Resume() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "0 1.25rem 6rem" }}>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 0", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--background)", zIndex: 10 }}>
        <Link href="/" style={{
          fontSize: 15, fontWeight: 700, color: "var(--accent)",
          background: "var(--accent-bg)", border: "2px solid var(--accent)",
          borderRadius: "50%", width: 36, height: 36, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          letterSpacing: "0.02em", textDecoration: "none",
        }}>GS</Link>
        <div className="nav-links" style={{ display: "flex", gap: "0.15rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {[["About", "/"], ["Resume", "/resume"], ["Blog", "/blog"], ["Contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{
              fontSize: 15, fontWeight: 500,
              color: href === "/resume" ? "var(--accent)" : "var(--subtle)",
              textDecoration: "none", padding: "5px 10px", borderRadius: 6,
              background: href === "/resume" ? "var(--accent-bg)" : "transparent",
            }}>{label}</Link>
          ))}
        </div>
      </nav>

      {/* Header */}
      <section className="resume-header" style={{ padding: "3rem 0 2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            {profile.name}
          </h1>
          <p style={{ fontSize: 16, color: "#2563a8", fontWeight: 600 }}>
            {profile.title} · {profile.location} · {profile.experience}
          </p>
        </div>
        <a href="/resume.pdf" download style={{
          background: "var(--btn-bg)", color: "var(--btn-text)",
          padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600,
          textDecoration: "none", whiteSpace: "nowrap",
        }}>
          Download PDF
        </a>
      </section>

      {/* Experience */}
      <Section label="Experience">
        {experience.map((job) => (
          <div key={job.dates} className="two-col" style={{
            display: "grid", gridTemplateColumns: "170px 1fr", gap: "2rem",
            paddingBottom: "2.5rem", marginBottom: "2.5rem",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ paddingTop: 3 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#2563a8", lineHeight: 1.7 }}>{job.dates}</p>
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)", marginTop: 2 }}>{job.location}</p>
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>
                {job.title}
              </h3>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--accent)", marginBottom: "1rem" }}>
                {job.company}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {job.bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.75, paddingLeft: 16, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, color: "var(--subtle)" }}>–</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </Section>

      {/* Skills */}
      <Section label="Skills & Tools">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {skills.map((group) => (
            <div key={group.category}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)", marginBottom: "0.6rem" }}>
                {group.category}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {group.items.map((item) => (
                  <span key={item} style={{
                    fontSize: 14, fontWeight: 500,
                    color: group.textColor,
                    background: group.color,
                    padding: "5px 14px", borderRadius: 20,
                    border: `1px solid ${group.color}`,
                  }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Education */}
      <Section label="Education">
        {education.map((edu) => (
          <div key={edu.year} className="two-col" style={{
            display: "grid", gridTemplateColumns: "170px 1fr", gap: "2rem", marginBottom: "1.5rem",
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#2563a8" }}>{edu.year}</p>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>{edu.degree}</h3>
              <p style={{ fontSize: 16, color: "var(--muted)" }}>{edu.school}</p>
            </div>
          </div>
        ))}
      </Section>

      {/* Footer */}
      <footer style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontSize: 13, color: "var(--subtle)" }}>© 2026 {profile.name}</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href={`mailto:${profile.email}`} style={{ fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>Email</a>
          <a href={profile.linkedin} style={{ fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>LinkedIn</a>
        </div>
      </footer>

    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: "2.5rem", marginBottom: "1.75rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ width: 4, height: 26, background: "#2563a8", borderRadius: 2 }}></div>
        <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", color: "#2563a8" }}>
          {label}
        </p>
      </div>
      {children}
    </section>
  );
}