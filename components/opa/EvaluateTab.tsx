import { Chip, Label } from "@/components/ui/Chip";
import { VerdictPill } from "@/components/ui/VerdictPill";
import { buildTrace, DECISION_RULES, GLYPH, type Tone, type TraceCard } from "@/lib/trace";
import type { CheckName, PolicyResult, Scenario } from "@/lib/types";
import { RegoLine } from "./Rego";

const CARD_BORDER: Record<Tone, string> = {
  pass: "border-allow/40",
  fail: "border-deny/55",
  warn: "border-approval/45",
  neutral: "border-line",
};

const VALUE_PILL: Record<Tone, string> = {
  pass: "border-allow/50 bg-allow-tint text-allow",
  fail: "border-deny/60 bg-deny-tint text-deny",
  warn: "border-approval/50 bg-approval-tint text-approval",
  neutral: "border-line-strong bg-panel text-ink-2",
};

function ValuePill({ value, tone }: { value: boolean; tone: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[12px] font-semibold ${VALUE_PILL[tone]}`}>
      = {String(value)}
      {GLYPH[tone] ? <span aria-hidden="true">{GLYPH[tone]}</span> : null}
    </span>
  );
}

function BlockCard({ card }: { card: TraceCard }) {
  const id = `card-${card.rule}`;
  return (
    <article aria-labelledby={id} className={`overflow-hidden rounded-xl border bg-panel-deep ${CARD_BORDER[card.tone]}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <h4 id={id} className="font-mono text-[14px] font-semibold text-ink">
          {card.rule}
        </h4>
        <p className="order-last min-w-0 basis-full text-[14px] text-muted sm:order-none sm:basis-0 sm:flex-1">
          {card.question}
        </p>
        <span className="ml-auto sm:ml-0">
          <ValuePill value={card.value} tone={card.tone} />
        </span>
      </header>
      <div tabIndex={0} role="group" aria-label={`${card.rule} source and resolved values`} className="overflow-x-auto px-4 py-3">
        <div className="min-w-max font-mono text-[12.5px] leading-relaxed">
          {card.lines.map((line, i) => {
            const indent = line.code.match(/^\t*/)?.[0].length ?? 0;
            return (
              <div key={i}>
                <div className="whitespace-pre text-ink-2">
                  <RegoLine code={line.code} />
                </div>
                {line.chips.length ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-2" style={{ paddingLeft: `${indent * 2 + 1}ch` }}>
                    <span aria-hidden="true" className="text-faint">
                      ↳
                    </span>
                    {line.chips.map((c, j) => (
                      <Chip key={j} tone={c.tone} dashed={c.dashed} className="text-[11.5px]">
                        {c.text}
                      </Chip>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {card.note ? <p className="border-t border-line px-4 py-2 text-[12px] text-muted">{card.note}</p> : null}
    </article>
  );
}

const CHECKS: CheckName[] = ["agent_granted", "user_permitted", "args_ok"];

function Arrow() {
  return (
    <span aria-hidden="true" className="self-center font-mono text-xl text-edge">
      <span className="hidden md:inline">→</span>
      <span className="md:hidden">↓</span>
    </span>
  );
}

export function EvaluateTab({ scenario, result }: { scenario: Scenario; result: PolicyResult }) {
  const cards = buildTrace(scenario.input, result);
  const { input } = scenario;
  const matched = DECISION_RULES.find((r) => r.decision === result.decision)!;

  return (
    <div className="space-y-6">
      <div>
        <Label>Input</Label>
        <div className="flex flex-wrap gap-2">
          <Chip>subject.id = {input.subject.id}</Chip>
          <Chip>actor.id = {input.actor.id}</Chip>
          <Chip>tool.name = {input.tool.name}</Chip>
          <Chip tone={input.context.untrusted_content_seen ? "warn" : "neutral"}>
            untrusted_content_seen = {String(input.context.untrusted_content_seen)}
          </Chip>
        </div>
      </div>

      <div className="grid gap-4">
        {cards.map((c) => (
          <BlockCard key={c.rule} card={c} />
        ))}
      </div>

      <div>
        <Label>Decision</Label>
        <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-panel-deep p-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1.5">
            {CHECKS.map((name) => (
              <Chip key={name} tone={result.checks[name] ? "pass" : "fail"}>
                {name}
              </Chip>
            ))}
          </div>
          <Arrow />
          <div
            className="grid h-14 w-16 place-items-center rounded-r-full rounded-l-md border-2 border-accent bg-accent-tint font-mono text-[12px] font-semibold text-accent"
            role="img"
            aria-label="AND gate"
          >
            AND
          </div>
          <Arrow />
          <div className="flex flex-col gap-1.5">
            <Chip tone={result.all_checks ? "pass" : "fail"}>all_checks = {String(result.all_checks)}</Chip>
            <Chip tone={result.needs_approval ? "warn" : "neutral"}>needs_approval = {String(result.needs_approval)}</Chip>
          </div>
          <Arrow />
          <div className="flex flex-col items-start gap-2 rounded-xl border border-line-strong bg-panel px-5 py-4">
            <VerdictPill decision={result.decision} size="lg" />
            <code className="font-mono text-[12px] text-muted">decision = &quot;{result.decision}&quot;</code>
          </div>
        </div>
      </div>

      <div>
        <Label>Which decision rule matched</Label>
        <div className="grid gap-3 md:grid-cols-3">
          {DECISION_RULES.map((rule) => {
            const hit = rule === matched;
            return (
              <div
                key={rule.decision}
                className={`rounded-lg border bg-code px-3 py-2.5 font-mono text-[12.5px] leading-relaxed ${
                  hit ? "border-accent" : "border-line"
                }`}
              >
                {rule.lines.map((l, i) => (
                  <div key={i} className="whitespace-pre text-ink-2">
                    <RegoLine code={l} />
                  </div>
                ))}
                <p className={`mt-2 text-[11px] ${hit ? "text-accent" : "text-faint"}`}>
                  {hit ? "✓ matched" : "not matched"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
