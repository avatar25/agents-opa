"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DetailPanel } from "@/components/DetailPanel";
import { FlowGraph } from "@/components/FlowGraph";
import { ScenarioPicker } from "@/components/ScenarioPicker";
import { PromptBubble } from "@/components/details/PersonDetail";
import { loadEvaluator } from "@/lib/opa";
import { outcomeOf } from "@/lib/nodes";
import { pathFor, personFor, scenarios } from "@/lib/scenarios";
import type { Decision, NodeId, PolicyResult } from "@/lib/types";

type PolicyState =
  | { status: "loading" }
  | { status: "ready"; results: Record<string, PolicyResult>; wasmBytes: number }
  | { status: "error"; message: string };

export function Explorer() {
  const [policy, setPolicy] = useState<PolicyState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [selected, setSelected] = useState<NodeId>("opa");

  // Load the compiled policy once and evaluate every scenario with it.
  // There is deliberately no fallback: if the Wasm can't load, there is no verdict.
  useEffect(() => {
    let live = true;
    loadEvaluator()
      .then((opa) => {
        const results = Object.fromEntries(scenarios.map((s) => [s.id, opa.evaluate(s.input)]));
        if (live) setPolicy({ status: "ready", results, wasmBytes: opa.wasmBytes });
      })
      .catch((err: unknown) => {
        if (live) setPolicy({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  // Deep link: ?s=<scenario-id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("s");
    if (id && scenarios.some((s) => s.id === id)) setScenarioId(id);
  }, []);

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
  const result = policy.status === "ready" ? policy.results[scenario.id] : null;
  const decision = result?.decision ?? null;
  const path = useMemo(() => pathFor(scenario, decision), [scenario, decision]);

  // A scenario without untrusted input has no such node to show.
  const shown: NodeId = selected === "untrusted" && !scenario.untrusted ? "agent" : selected;

  const results = policy.status === "ready" ? policy.results : null;
  const pickScenario = useCallback(
    (id: string) => {
      setScenarioId(id);
      // Keep the same kind of node selected; an outcome follows to the new scenario's outcome.
      setSelected((prev) => {
        if (!outcomeOf(prev)) return prev;
        const next = results?.[id]?.decision;
        return next ? `outcome:${next}` : "opa";
      });
      const url = new URL(window.location.href);
      url.searchParams.set("s", id);
      window.history.replaceState(null, "", url);
    },
    [results],
  );

  const decisions =
    policy.status === "ready"
      ? (Object.fromEntries(Object.entries(policy.results).map(([id, r]) => [id, r.decision])) as Record<string, Decision>)
      : null;
  const person = personFor(scenario);

  return (
    <div className="space-y-5">
      <ScenarioPicker
        scenarios={scenarios}
        selected={scenario.id}
        decisions={decisions}
        failed={policy.status === "error"}
        onSelect={pickScenario}
      />

      <section aria-label="Request flow" className="rounded-2xl border border-line bg-panel">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <span
            aria-hidden="true"
            className="grid size-9 flex-none place-items-center rounded-full bg-line-strong font-display font-semibold"
          >
            {person.initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="sr-only">{person.name} asks the agent:</p>
            <PromptBubble scenario={scenario} />
          </div>
          <p className="hidden font-mono text-[12px] text-muted sm:block">Click any node</p>
        </header>

        <div className="relative px-3 py-5 sm:px-6">
          <FlowGraph scenario={scenario} result={result} selected={shown} onSelect={setSelected} />
          {policy.status === "error" ? (
            <div
              role="alert"
              className="absolute inset-3 grid place-items-center rounded-xl border border-dashed border-deny/60 bg-panel/95 p-6 text-center sm:inset-6"
            >
              <div className="max-w-md space-y-3">
                <p className="font-display text-xl font-semibold text-deny">
                  <span aria-hidden="true">✕ </span>policy.wasm didn&apos;t load
                </p>
                <p className="text-sm text-ink-2">
                  Every verdict on this page comes from the compiled policy, so there&apos;s nothing to show without it.
                </p>
                <p className="font-mono text-[12px] text-muted">{policy.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPolicy({ status: "loading" });
                    setAttempt((n) => n + 1);
                  }}
                  className="rounded-lg border border-line-strong bg-panel-deep px-4 py-2 text-sm font-semibold text-ink hover:border-edge"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <DetailPanel
        scenario={scenario}
        result={result}
        selected={shown}
        path={path}
        onSelect={setSelected}
        wasmBytes={policy.status === "ready" ? policy.wasmBytes : null}
      />
    </div>
  );
}
