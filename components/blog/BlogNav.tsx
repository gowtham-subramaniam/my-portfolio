"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BlogNav() {
  const pathname = usePathname();

  return (
    <nav style={{ borderBottom: "1px solid var(--border)", marginBottom: "2rem", paddingBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Link href="/" style={{ fontSize: 14, color: "var(--subtle)", textDecoration: "none", fontWeight: 500 }}>← Back to portfolio</Link>
      <Link href="/blog" style={{ fontSize: 14, color: pathname === "/blog" ? "var(--accent)" : "var(--subtle)", textDecoration: "none", fontWeight: 500 }}>Blog</Link>
    </nav>
  );
}
