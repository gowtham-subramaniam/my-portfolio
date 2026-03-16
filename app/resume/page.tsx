import type { Metadata } from "next";
import Link from "next/link";
import { profile, experience, skills, education } from "../../content";

export const metadata: Metadata = {
  title: `Resume — ${profile.name}`,
  description: `Full resume for ${profile.name}, ${profile.title}.`,
};

export default function Resume() {
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.25rem 6rem" }}>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.25rem", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--background)", zIndex: 10, margin: "0 -1.25rem" }}>
        <Link href="/" style={{
          borderRadius: "50%", width: 36, height: 36, flexShrink: 0,
          display: "block", overflow: "hidden",
          border: "2px solid var(--accent)", textDecoration: "none",
        }}>
          <img
            src="/photo.jpeg"
            alt="Gowtham Subramaniam"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Link>
        <div style={{ display: "flex", gap: "0.15rem" }}>
          {[["About", "/"], ["Resume", "/resume"], ["Blog", "/blog"], ["Contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{
              fontSize: 15,
              fontWeight: href === "/resume" ? 700 : 500,
              color: href === "/resume" ? "var(--accent)" : "var(--subtle)",
              textDecoration: "none",
              padding: "5px 8px",
              borderRadius: 6,
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
        {experience.map((job, index) => (
          <div key={job.dates} className="two-col" style={{
            display: "grid", gridTemplateColumns: "170px 1fr", gap: "2rem",
            paddingBottom: "2.5rem", marginBottom: "2.5rem",
            borderBottom: index === experience.length - 1 ? "none" : "1px solid var(--border)",
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
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <a href={`mailto:${profile.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            Email
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
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