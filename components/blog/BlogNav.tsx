"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BlogNav() {
  const pathname = usePathname();

  return (
    <nav style={{ borderBottom: "1px solid var(--border)", marginBottom: "2rem", paddingBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <img src="/Logo.svg" alt="Gowtham Subramaniam" style={{ height: 48, width: "auto", display: "block" }} />
      </Link>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        {[["About", "/"], ["Resume", "/resume"], ["Blog", "/blog"], ["Contact", "/contact"]].map(([label, href]) => (
          <Link key={href} href={href} style={{ fontSize: 14, fontWeight: pathname === href ? 700 : 500, color: pathname === href ? "var(--accent)" : "var(--subtle)", textDecoration: "none" }}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}