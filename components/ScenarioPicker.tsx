"use client";

import { VerdictPill } from "@/components/ui/VerdictPill";
import type { Decision, Scenario } from "@/lib/types";

export function ScenarioPicker({
  scenarios,
  selected,
  decisions,
  failed,
  onSelect,
}: {
  scenarios: Scenario[];
  selected: string;
  decisions: Record<string, Decision> | null;
  failed: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
      {scenarios.map((s, i) => {
        const active = s.id === selected;
        return (
          <li key={s.id} className={i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(s.id)}
              className={`group flex h-full w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors lg:flex-col lg:items-start lg:gap-2 lg:py-4 ${
                active
                  ? "border-accent bg-accent-tint"
                  : "border-line bg-panel hover:border-line-strong hover:bg-panel-deep"
              }`}
            >
              <span className={`font-mono text-[13px] ${active ? "text-accent" : "text-muted"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{s.tag}</span>
                <span className="block font-semibold leading-snug text-ink">{s.title}</span>
              </span>
              <VerdictPill decision={decisions?.[s.id]} pending={failed ? "no verdict" : "evaluating…"} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
