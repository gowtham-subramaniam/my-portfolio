"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Single source of truth for the site navigation. Add new top-level pages here.
const LINKS: [label: string, href: string][] = [
  ["About", "/"],
  ["Resume", "/resume"],
  ["Blog", "/blog"],
  ["Tools", "/tools"],
  ["Contact", "/contact"],
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.25rem", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--background)", zIndex: 10, margin: "0 -1.25rem", gap: "0.75rem" }}>
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <img src="/Logo.svg" alt="Gowtham Subramaniam" className="nav-logo" style={{ height: 48, width: "auto", display: "block" }} />
      </Link>
      <div className="nav-links" style={{ display: "flex", gap: "0.15rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {LINKS.map(([label, href]) => {
          const active = isActive(pathname, href);
          return (
            <Link key={label} href={href} aria-current={active ? "page" : undefined} style={{
              fontSize: 15,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--accent)" : "var(--subtle)",
              textDecoration: "none",
              padding: "5px 8px",
              borderRadius: 6,
            }}>{label}</Link>
          );
        })}
      </div>
    </nav>
  );
}
