"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BlogNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.25rem", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--background)", zIndex: 10, margin: "0 -1.25rem" }}>
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <img src="/Logo.svg" alt="Gowtham Subramaniam" style={{ height: 48, width: "auto", display: "block" }} />
      </Link>
      <div style={{ display: "flex", gap: "0.15rem" }}>
        {[["About", "/"], ["Resume", "/resume"], ["Blog", "/blog"], ["Contact", "/contact"]].map(([label, href]) => (
          <Link key={label} href={href} style={{
            fontSize: 15,
            fontWeight: pathname === href ? 700 : 500,
            color: pathname === href ? "var(--accent)" : "var(--subtle)",
            textDecoration: "none",
            padding: "5px 8px",
            borderRadius: 6,
          }}>{label}</Link>
        ))}
      </div>
    </nav>
  );
}