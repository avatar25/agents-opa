import { Chip, Label } from "@/components/ui/Chip";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { VerdictPill } from "@/components/ui/VerdictPill";
import { VERDICT, toolSummary } from "@/lib/nodes";
import { personFor } from "@/lib/scenarios";
import type { Decision, PolicyResult, Scenario } from "@/lib/types";

const HOW_TO_REACH: Record<Decision, string> = {
  allow: "all three checks pass and no untrusted content came before a side-effecting call",
  needs_approval: "all three checks pass, but untrusted content came before a side-effecting call",
  deny: "any check fails, or nothing matches and the default applies",
};

function decisionLog(s: Scenario, r: PolicyResult) {
  return {
    decision: r.decision,
    subject: s.input.subject.id,
    actor: s.input.actor.id,
    tool: s.input.tool.name,
    failed: r.failed,
  };
}

export function OutcomeDetail({ outcome, scenario, result }: { outcome: Decision; scenario: Scenario; result: PolicyResult | null }) {
  if (!result) return <p className="text-muted">Waiting for the policy…</p>;

  if (result.decision !== outcome) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-ink-2">
        <span className="font-mono text-faint">Not taken.</span>
        <span>
          This request ended at <VerdictPill decision={result.decision} />.
        </span>
        <span className="text-muted">
          {VERDICT[outcome].outcome} happens when {HOW_TO_REACH[outcome]}.
        </span>
      </div>
    );
  }

  const tool = scenario.input.tool.name;
  const log = <JsonBlock value={decisionLog(scenario, result)} label="Decision log entry" />;

  if (outcome === "needs_approval") {
    return (
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
        <figure className="rounded-xl border border-paper-line bg-paper p-5 text-paper-ink shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <figcaption className="sr-only">Mock approval prompt shown to {personFor(scenario).name}</figcaption>
          <p className="font-mono text-[11px] uppercase tracking-wider text-paper-muted">Approval needed</p>
          <p className="mt-2 font-display text-lg font-semibold">
            {scenario.input.actor.id} wants to run {tool}
          </p>
          <p className="mt-1 font-mono text-[14px]">{toolSummary(scenario)}</p>
          <p className="mt-1 text-sm text-paper-muted">on behalf of {personFor(scenario).name}</p>
          <div aria-hidden="true" className="mt-4 flex gap-2">
            <span className="rounded-md border border-paper-line px-4 py-1.5 text-sm font-semibold">Reject</span>
            <span className="rounded-md bg-paper-ink px-4 py-1.5 text-sm font-semibold text-paper">Approve</span>
          </div>
        </figure>
        <div className="space-y-4">
          {scenario.untrusted ? <Chip tone="warn">after reading: {scenario.untrusted.label}</Chip> : null}
          <p className="text-sm leading-relaxed text-muted">
            Every check passed, so this isn&apos;t a deny. But the agent read untrusted content before a call that
            can&apos;t be undone, so a person confirms it first.
          </p>
          {log}
        </div>
      </div>
    );
  }

  const allowed = outcome === "allow";
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
      <div
        className={`rounded-xl border p-5 ${allowed ? "border-allow/50 bg-allow-tint" : "border-deny/60 bg-deny-tint"}`}
      >
        <p className={`font-display text-2xl font-extrabold ${allowed ? "text-allow" : "text-deny"}`}>
          <span aria-hidden="true">{VERDICT[outcome].glyph} </span>
          {allowed ? "Executed" : "Blocked"}
        </p>
        <p className="mt-2 text-ink-2">
          {allowed ? (
            <>
              <span className="font-mono">{tool}</span> ran: {toolSummary(scenario)}.
            </>
          ) : (
            <>
              <span className="font-mono">{tool}</span> never ran. The agent gets a policy error back, and the attempt
              is logged.
            </>
          )}
        </p>
        {!allowed && result.failed.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.failed.map((f) => (
              <Chip key={f} tone="fail">
                {f}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <Label>Decision log</Label>
        {log}
      </div>
    </div>
  );
}
