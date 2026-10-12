"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type TermKey } from "./glossary";

const OPEN_EVENT = "pf-term-open";
const WIDTH = 300;

type Pos = { left: number; top?: number; bottom?: number };

/**
 * A property name that shows its definition when clicked (or tapped).
 * Only one definition is open at a time; it closes on outside click or Escape,
 * and follows the label while the page scrolls.
 */
export default function Term({
  k,
  children,
  className = "",
  label,
}: {
  k: TermKey;
  children: ReactNode;
  className?: string;
  /** Accessible name when the visible content is just an icon */
  label?: string;
}) {
  const def = GLOSSARY[k];
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  const open = pos !== null;
  const close = useCallback(() => setPos(null), []);

  /** Position next to the button; null when the button has scrolled out of view. */
  const place = useCallback((): Pos | null => {
    const el = btn.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return null;
    const w = Math.min(WIDTH, vw - 16);
    const left = Math.max(8, Math.min(r.left, vw - w - 8));
    // Open below unless the button sits in the lower part of the screen.
    return r.bottom > vh * 0.6 ? { left, bottom: vh - r.top + 6 } : { left, top: r.bottom + 6 };
  }, []);

  const toggle = () => {
    if (pos) return close();
    const next = place();
    if (!next) return;
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    setPos(next);
  };

  useEffect(() => {
    if (!open) return;
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id) close();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btn.current?.contains(t) || pop.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btn.current?.focus();
      }
    };
    window.addEventListener(OPEN_EVENT, onOther);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // Follow the button while the page scrolls; close once it leaves the screen.
    const follow = () => setPos(place());
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOther);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [open, id, close, place]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-expanded={pos !== null}
        aria-controls={pos ? id : undefined}
        aria-label={label}
        title={label ? undefined : "What does this mean?"}
        className={`cursor-help text-left underline decoration-dotted decoration-[var(--faint)] underline-offset-[3px] hover:text-[var(--accent)] hover:decoration-[var(--accent)] ${className}`}
      >
        {children}
      </button>
      {pos &&
        createPortal(
          <div
            ref={pop}
            id={id}
            role="dialog"
            aria-label={def.term}
            style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, width: Math.min(WIDTH, window.innerWidth - 16), zIndex: 60 }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3.5 py-3 text-left text-[13px] font-normal normal-case leading-[1.55] tracking-normal text-[var(--muted)] shadow-[0_6px_24px_rgba(0,0,0,0.12)]"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <span className="text-[13px] font-bold text-[var(--foreground)]">{def.term}</span>
              <button type="button" onClick={close} aria-label="Close definition" className="-mr-1 -mt-0.5 px-1 text-[15px] leading-none text-[var(--subtle)] hover:text-[var(--foreground)]">
                ×
              </button>
            </div>
            <p>{def.text}</p>
            {"tip" in def && def.tip && (
              <p className="mt-1.5 text-[12px] text-[var(--subtle)]">
                <span className="font-semibold text-[var(--muted)]">In practice: </span>
                {def.tip}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
