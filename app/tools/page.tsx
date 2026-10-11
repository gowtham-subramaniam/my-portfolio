import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import { profile } from "../../content";

export const metadata: Metadata = {
  title: `Tools — ${profile.name}`,
  description: "Free, browser-based engineering tools for mechanical and medical-device engineers.",
};

// Add new tools here.
const tools = [
  {
    href: "/tools/polymer-finder",
    title: "Polymer Finder",
    summary:
      "Describe your part in plain language and screen 33 engineering polymers for temperature, sterilization, chemical resistance and cost. Compare candidates side by side.",
    tags: ["Materials", "Polymers", "AI search"],
  },
];

export default function ToolsPage() {
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.25rem 4rem" }}>
      <SiteNav />
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", margin: "2rem 0 0.5rem" }}>Tools</h1>
      <p style={{ fontSize: 15, color: "var(--subtle)", marginBottom: "2rem" }}>
        Free, browser-based tools for mechanical and medical-device engineers. Nothing to install, and your inputs stay on your device.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.6rem" }}>
                {tool.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: "#1a4a8a", background: "#eef4fc", padding: "2px 9px", borderRadius: 20, border: "1px solid #bdd4f4" }}>{tag}</span>
                ))}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", marginBottom: "0.4rem" }}>{tool.title}</h2>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: "0.6rem" }}>{tool.summary}</p>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>Open tool →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
