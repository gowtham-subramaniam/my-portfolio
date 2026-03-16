"use client";

import { useState } from "react";
import Link from "next/link";

export default function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", company: "", subject: "", message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", company: "", subject: "", message: "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 15,
    color: "var(--foreground)",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    outline: "none",
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: 6,
    display: "block" as const,
  };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "0 2rem 6rem" }}>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 0", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--background)", zIndex: 10 }}>
        <Link href="/" style={{
          fontSize: 15, fontWeight: 700, color: "var(--accent)",
          background: "var(--accent-bg)", border: "2px solid var(--accent)",
          borderRadius: "50%", width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          letterSpacing: "0.02em", textDecoration: "none",
        }}>GS</Link>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {[["About", "/"], ["Resume", "/resume"], ["Blog", "/blog"], ["Contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{
              fontSize: 15, fontWeight: 500,
              color: href === "/contact" ? "var(--accent)" : "var(--subtle)",
              textDecoration: "none", padding: "5px 12px", borderRadius: 6,
              background: href === "/contact" ? "var(--accent-bg)" : "transparent",
            }}>{label}</Link>
          ))}
        </div>
      </nav>

      {/* Header */}
      <section style={{ padding: "3rem 0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
          <div style={{ width: 4, height: 26, background: "#2563a8", borderRadius: 2 }}></div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2563a8", letterSpacing: "-0.01em" }}>
            Get in touch
          </h1>
        </div>
        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.7 }}>
          Have a project, opportunity, or just want to connect? Fill out the form and I&apos;ll get back to you.
        </p>
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Status messages — top of form */}
        {status === "success" && (
          <div style={{
            fontSize: 15, color: "#1a5c2a", fontWeight: 500,
            background: "#f0faf0", padding: "16px 20px",
            borderRadius: 8, border: "1px solid #c0e8c0",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✓</span>
            Message sent! I&apos;ll get back to you soon.
          </div>
        )}
        {status === "error" && (
          <div style={{
            fontSize: 15, color: "#8b1a1a", fontWeight: 500,
            background: "#fdf0f0", padding: "16px 20px",
            borderRadius: 8, border: "1px solid #e8c0c0",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✗</span>
            Something went wrong. Please email me directly at gowtham.subramaniam.c@gmail.com
          </div>
        )}

        {/* Name + Company */}
        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              required placeholder="Gowtham Subramaniam"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input
              name="company" value={form.company} onChange={handleChange}
              placeholder="Abbott Laboratories"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email *</label>
          <input
            name="email" type="email" value={form.email} onChange={handleChange}
            required placeholder="you@email.com"
            style={inputStyle}
          />
        </div>

        {/* Subject */}
        <div>
          <label style={labelStyle}>Subject *</label>
          <input
            name="subject" value={form.subject} onChange={handleChange}
            required placeholder="Collaboration opportunity"
            style={inputStyle}
          />
        </div>

        {/* Message */}
        <div>
          <label style={labelStyle}>Message *</label>
          <textarea
            name="message" value={form.message} onChange={handleChange}
            required placeholder="Tell me about your project or opportunity..."
            rows={6}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "sending"}
          style={{
            background: status === "sending" ? "var(--subtle)" : "var(--btn-bg)",
            color: "var(--btn-text)",
            padding: "12px 28px",
            borderRadius: 8, fontSize: 15, fontWeight: 600,
            border: "none", cursor: status === "sending" ? "not-allowed" : "pointer",
            alignSelf: "flex-start",
            fontFamily: "var(--font-geist-sans), Arial, sans-serif",
          }}
        >
          {status === "sending" ? "Sending..." : "Send message"}
        </button>

      </form>

      {/* Footer */}
      <footer style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontSize: 13, color: "var(--subtle)" }}>© 2026 Gowtham Subramaniam</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href="mailto:gowtham.subramaniam.c@gmail.com" style={{ fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>Email</a>
          <a href="https://linkedin.com/in/yourprofile" style={{ fontSize: 13, color: "var(--subtle)", textDecoration: "none" }}>LinkedIn</a>
        </div>
      </footer>

    </main>
  );
}