import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "../content";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.title}`,
  description: profile.tagline,
};

export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "0 2rem 5rem" }}>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 0", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--background)", zIndex: 10 }}>
        <span style={{
  fontSize: 15, fontWeight: 700, color: "var(--accent)",
  background: "var(--accent-bg)",
  border: "2px solid var(--accent)",
  borderRadius: "50%",
  width: 36, height: 36,
  display: "flex", alignItems: "center", justifyContent: "center",
  letterSpacing: "0.02em",
}}>GS</span>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {[["About", "/"], ["Resume", "/resume"], ["Blog", "/blog"]].map(([label, href]) => (
            <Link key={label} href={href} style={{
              fontSize: 15,
              fontWeight: 500,
              color: href === "/" ? "var(--accent)" : "var(--subtle)",
              textDecoration: "none",
              padding: "5px 12px",
              borderRadius: 6,
              background: href === "/" ? "var(--accent-bg)" : "transparent",
            }}>{label}</Link>
          ))}
        </div>
      </nav>

    {/* Hero */}
<section style={{ padding: "4rem 0 3rem", display: "flex", alignItems: "center", gap: "2.5rem", flexWrap: "wrap" }}>

  <img
    src={profile.photo}
    alt={profile.name}
    style={{
      width: 170, height: 170, borderRadius: "20%",
      objectFit: "cover",
      border: "3px solid var(--accent)",
      flexShrink: 0,
      display: "block",
    }}
  />

  <div>
    <h1 style={{
      fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700,
      color: "var(--foreground)", lineHeight: 1.15,
      letterSpacing: "-0.03em", marginBottom: "0.75rem",
    }}>
      {profile.name}
    </h1>
    <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.7, maxWidth: 480, marginBottom: "0.75rem", fontWeight: 400 }}>
      {profile.tagline}
    </p>
    <p style={{ fontSize: 16, color: "#2563a8", fontWeight: 600 }}>
      {profile.location} · {profile.experience} experience
    </p>
  </div>

</section>

      {/* About */}
      <section style={{ padding: "2.5rem 0", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <div style={{ width: 4, height: 26, background: "#2563a8", borderRadius: 2 }}></div>
          <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", color: "#2563a8" }}>About</p>
        </div>
        {profile.about.map((para, i) => (
          <p key={i} style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.85, maxWidth: 620, marginBottom: "1.1rem" }}>
            {para}
          </p>
        ))}
      </section>

      {/* CTA */}
      <section style={{ padding: "2.5rem 0", borderTop: "1px solid var(--border)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/resume" style={{
          background: "var(--btn-bg)", color: "var(--btn-text)",
          padding: "11px 24px", borderRadius: 8, fontSize: 15, fontWeight: 600,
          textDecoration: "none", letterSpacing: "-0.01em",
        }}>View resume →</Link>
        <Link href="/blog" style={{
          background: "transparent", color: "var(--muted)",
          padding: "11px 24px", borderRadius: 8, fontSize: 15, fontWeight: 500,
          textDecoration: "none", border: "1px solid var(--border)",
        }}>Read the blog →</Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontSize: 13, color: "var(--subtle)" }}>© 2026 {profile.name}</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href={`mailto:${profile.email}`} style={{ fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>Email</a>
          <a href={profile.linkedin} style={{ fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>LinkedIn</a>
        </div>
      </footer>

    </main>
  );
}