import type { ReactNode } from "react";
import { GLYPH, type Tone } from "@/lib/trace";

export type ChipTone = Tone | "accent";

const TONE: Record<ChipTone, string> = {
  neutral: "border-line-strong bg-panel-deep text-ink-2",
  pass: "border-allow/45 bg-allow-tint text-allow",
  fail: "border-deny/55 bg-deny-tint text-deny",
  warn: "border-approval/45 bg-approval-tint text-approval",
  accent: "border-accent/70 bg-accent-tint text-accent",
};

/** A small mono label. Non-neutral tones always carry a glyph so state never relies on colour alone. */
export function Chip({
  tone = "neutral",
  dashed = false,
  glyph,
  children,
  className = "",
}: {
  tone?: ChipTone;
  dashed?: boolean;
  glyph?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const g = glyph === undefined ? (tone === "accent" ? "" : GLYPH[tone]) : glyph;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[12px] leading-5 ${
        dashed ? "border-dashed" : ""
      } ${TONE[tone]} ${className}`}
    >
      <span className="min-w-0 break-words">{children}</span>
      {g ? (
        <span aria-hidden="true" className="font-semibold">
          {g}
        </span>
      ) : null}
      {g ? <span className="sr-only">{SR[tone as Tone] ?? ""}</span> : null}
    </span>
  );
}

const SR: Partial<Record<Tone, string>> = { pass: "(passes)", fail: "(fails)", warn: "(warning)" };

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted ${className}`}>{children}</p>;
}
