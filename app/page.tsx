import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "../content";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.title}`,
  description: profile.tagline,
};

export default function Home() {
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.25rem 5rem" }}>

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
              fontWeight: href === "/" ? 700 : 500,
              color: href === "/" ? "var(--accent)" : "var(--subtle)",
              textDecoration: "none",
              padding: "5px 8px",
              borderRadius: 6,
            }}>{label}</Link>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-row" style={{ padding: "3.5rem 0 2.5rem", display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
        <img
          src={profile.photo}
          alt={profile.name}
          style={{
            width: 120, height: 120, borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid var(--accent)",
            flexShrink: 0,
            display: "block",
          }}
        />
        <div>
          <h1 style={{
            fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 700,
            color: "var(--foreground)", lineHeight: 1.15,
            letterSpacing: "-0.03em", marginBottom: "0.75rem",
          }}>
            {profile.name}
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.7, maxWidth: 480, marginBottom: "0.75rem", fontWeight: 400 }}>
            {profile.tagline}
          </p>
          <p style={{ fontSize: 15, color: "#2563a8", fontWeight: 600 }}>
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