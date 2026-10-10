import { VERDICT } from "@/lib/nodes";
import type { Decision } from "@/lib/types";

const STYLE: Record<Decision, string> = {
  allow: "border-allow/50 bg-allow-tint text-allow",
  needs_approval: "border-approval/50 bg-approval-tint text-approval",
  deny: "border-deny/60 bg-deny-tint text-deny",
};

/** Verdict = colour + glyph + text label, never colour alone. */
export function VerdictPill({
  decision,
  size = "sm",
  pending = "evaluating…",
}: {
  decision: Decision | null | undefined;
  size?: "sm" | "lg";
  pending?: string;
}) {
  const sizing = size === "lg" ? "px-4 py-2 text-base gap-2.5" : "px-2 py-0.5 text-[11px] gap-1.5";
  if (!decision) {
    return (
      <span className={`inline-flex items-center rounded-full border border-dashed border-line-strong font-mono text-faint ${sizing}`}>
        {pending}
      </span>
    );
  }
  const v = VERDICT[decision];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-mono font-semibold tracking-wide ${sizing} ${STYLE[decision]}`}
    >
      <span aria-hidden="true">{v.glyph}</span>
      {v.label}
    </span>
  );
}
