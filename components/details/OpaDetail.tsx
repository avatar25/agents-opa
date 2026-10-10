"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { BuildTab } from "@/components/opa/BuildTab";
import { EvaluateTab } from "@/components/opa/EvaluateTab";
import type { PolicyResult, Scenario } from "@/lib/types";

const TABS = [
  { id: "evaluate", label: "Evaluate" },
  { id: "build", label: "Build" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function OpaDetail({ scenario, result, wasmBytes }: { scenario: Scenario; result: PolicyResult | null; wasmBytes: number | null }) {
  const [tab, setTab] = useState<TabId>("evaluate");
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA tabs: arrow keys move between tabs, Home/End jump.
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      e.key === "ArrowRight" ? (index + 1) % TABS.length
      : e.key === "ArrowLeft" ? (index - 1 + TABS.length) % TABS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? TABS.length - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="OPA views" className="mb-5 inline-flex rounded-lg border border-line bg-panel-deep p-1">
        {TABS.map((t, i) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${base}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                active ? "bg-accent text-bg" : "text-ink-2 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={tab !== t.id}
          tabIndex={0}
          className="focus-visible:rounded-md"
        >
          {tab === t.id ? (
            t.id === "evaluate" ? (
              result ? (
                <EvaluateTab scenario={scenario} result={result} />
              ) : (
                <p className="text-muted">Loading policy.wasm…</p>
              )
            ) : (
              <BuildTab wasmBytes={wasmBytes} />
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}
