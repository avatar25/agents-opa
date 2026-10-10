"use client";

import { AgentDetail } from "@/components/details/AgentDetail";
import { GatewayDetail } from "@/components/details/GatewayDetail";
import { OpaDetail } from "@/components/details/OpaDetail";
import { OutcomeDetail } from "@/components/details/OutcomeDetail";
import { PersonDetail } from "@/components/details/PersonDetail";
import { ToolCallDetail } from "@/components/details/ToolCallDetail";
import { UntrustedDetail } from "@/components/details/UntrustedDetail";
import { nodeInfo, outcomeOf } from "@/lib/nodes";
import type { NodeId, PolicyResult, Scenario } from "@/lib/types";

function StepButton({ label, glyph, onClick, disabled }: { label: string; glyph: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-lg border border-line-strong bg-panel-deep font-mono text-ink-2 transition-colors hover:border-edge hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}

export function DetailPanel({
  scenario,
  result,
  selected,
  path,
  onSelect,
  wasmBytes,
}: {
  scenario: Scenario;
  result: PolicyResult | null;
  selected: NodeId;
  path: NodeId[];
  onSelect: (id: NodeId) => void;
  wasmBytes: number | null;
}) {
  const info = nodeInfo(selected, scenario, result);
  const outcome = outcomeOf(selected);
  const index = path.indexOf(selected);
  const total = result ? path.length : path.length + 1;
  const kind = outcome ? "Outcome" : info.kind;
  const title = outcome ? info.title : selected === "opa" ? "OPA · agent.authz" : info.title;

  return (
    <section aria-labelledby="detail-title" className="rounded-2xl border border-line bg-panel">
      <header className="flex items-center gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{kind}</p>
          <h3 id="detail-title" className="break-words font-display text-xl font-semibold sm:text-2xl">
            {title}
          </h3>
        </div>
        <nav aria-label="Walk the path" className="flex flex-none items-center gap-2">
          <StepButton
            label="Previous step"
            glyph="‹"
            disabled={index === 0}
            onClick={() => onSelect(index < 0 ? path[path.length - 1] : path[index - 1])}
          />
          <span className="min-w-12 text-center font-mono text-[13px] text-ink-2" aria-live="polite">
            <span className="sr-only">Step </span>
            {index >= 0 ? index + 1 : "–"} / {total}
          </span>
          <StepButton
            label="Next step"
            glyph="›"
            disabled={index >= path.length - 1}
            onClick={() => onSelect(index < 0 ? path[0] : path[index + 1])}
          />
        </nav>
      </header>

      <div className="px-5 py-6 sm:px-6">
        {selected === "person" && <PersonDetail scenario={scenario} result={result} />}
        {selected === "untrusted" && <UntrustedDetail scenario={scenario} />}
        {selected === "agent" && <AgentDetail scenario={scenario} result={result} />}
        {selected === "toolcall" && <ToolCallDetail scenario={scenario} result={result} />}
        {selected === "gateway" && <GatewayDetail scenario={scenario} />}
        {selected === "opa" && <OpaDetail scenario={scenario} result={result} wasmBytes={wasmBytes} />}
        {outcome && <OutcomeDetail outcome={outcome} scenario={scenario} result={result} />}
      </div>
    </section>
  );
}
