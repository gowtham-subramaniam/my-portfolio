import { Resend } from "resend";
import { NextResponse } from "next/server";
import { POLYMERS } from "../../../components/tools/polymer-finder/polymers";
import { FIELD_NOTE_CATEGORIES } from "../../../components/tools/polymer-finder/fieldNotes";

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX = { note: 1500, name: 80, role: 120, email: 160 };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (str(body.website, 200)) return NextResponse.json({ success: true });

  const polymer = POLYMERS.find((p) => p.id === body.polymerId);
  const category = FIELD_NOTE_CATEGORIES.find((c) => c === body.category);
  const note = str(body.note, MAX.note);
  const name = str(body.name, MAX.name);
  const role = str(body.role, MAX.role);
  const email = str(body.email, MAX.email);
  const publishName = body.publishName === true;

  if (!polymer || !category || note.length < 20) {
    return NextResponse.json({ error: "Please choose a category and write at least 20 characters." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }

  const attribution = publishName && name ? [name, role].filter(Boolean).join(", ") : role || undefined;
  const entry = {
    polymerId: polymer.id,
    category,
    note,
    ...(attribution ? { attribution } : {}),
    date: new Date().toISOString().slice(0, 7),
  };

  try {
    // Resend reports failures in the returned object rather than by throwing.
    const { error } = await resend.emails.send({
      from: "Polymer Finder <onboarding@resend.dev>",
      to: "gowtham.subramaniam.c@gmail.com",
      ...(email ? { replyTo: email } : {}),
      subject: `[Polymer Finder] Field note: ${polymer.abbr} · ${category}`,
      html: `
        <h2>New field note for ${escapeHtml(polymer.name)} (${escapeHtml(polymer.abbr)})</h2>
        <p><strong>Category:</strong> ${escapeHtml(category)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name || "—")} ${publishName ? "(OK to publish name)" : "(do not publish name)"}</p>
        <p><strong>Role / industry:</strong> ${escapeHtml(role || "—")}</p>
        <p><strong>Email:</strong> ${escapeHtml(email || "—")} (never published)</p>
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(note)}</p>
        <hr />
        <p>To publish, review and paste into <code>components/tools/polymer-finder/fieldNotes.ts</code>:</p>
        <pre>${escapeHtml(JSON.stringify(entry, null, 2))},</pre>
      `,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send right now. Please try again later." }, { status: 500 });
  }
}
