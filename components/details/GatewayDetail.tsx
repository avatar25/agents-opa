import { Label } from "@/components/ui/Chip";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { orgData, personFor } from "@/lib/scenarios";
import type { Scenario } from "@/lib/types";

export function GatewayDetail({ scenario }: { scenario: Scenario }) {
  const person = personFor(scenario);
  const rows: [string, string, string][] = [
    ["sub", scenario.input.subject.id, `the person · ${person.name}`],
    ["act.sub", scenario.input.actor.id, "the agent acting for them"],
    ["aud", `tools.${orgData.org.domain}`, "the tool gateway"],
  ];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div>
        <Label>Delegated token · RFC 8693 token exchange</Label>
        <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-code font-mono text-[13px]">
          {rows.map(([k, v, note]) => (
            <div key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 px-4 py-2.5">
              <dt className="text-accent">{k}</dt>
              <dd className="min-w-0">
                <span className="block truncate text-ink">{v}</span>
                <span className="block font-sans text-[12px] text-muted">{note}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Two identities in one token. The gateway never lets the agent act as itself alone.
        </p>
      </div>
      <div aria-hidden="true" className="self-center justify-self-center font-mono text-2xl text-accent lg:pt-6">
        <span className="hidden lg:inline">→</span>
        <span className="lg:hidden">↓</span>
      </div>
      <div>
        <Label>OPA input</Label>
        <JsonBlock value={scenario.input} label="OPA input document" />
      </div>
    </div>
  );
}
