import { Chip, Label } from "@/components/ui/Chip";
import { orgData } from "@/lib/scenarios";
import type { PolicyResult, Scenario } from "@/lib/types";

export function ToolCallDetail({ scenario, result }: { scenario: Scenario; result: PolicyResult | null }) {
  const { name, args } = scenario.input.tool;
  const tool = orgData.tools[name];
  const required = result?.evidence.required ?? tool?.requires ?? [];
  const sideEffects = result?.evidence.side_effects ?? tool?.side_effects ?? false;
  const entries = Object.entries(args);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <pre
        tabIndex={0}
        aria-label={`${name} call`}
        className="overflow-x-auto rounded-lg border border-line bg-code p-4 font-mono text-[14px] leading-7 text-ink-2"
      >
        <code>
          <span className="text-accent">{name}</span>(
          {entries.map(([k, v], i) => (
            <span key={k} className="block pl-5">
              <span className="text-muted">{k}</span> = <span className="text-allow">{JSON.stringify(v)}</span>
              {i < entries.length - 1 ? "," : ""}
            </span>
          ))}
          )
        </code>
      </pre>
      <div className="space-y-5">
        <div>
          <Label>Requires</Label>
          <div className="flex flex-wrap gap-2">
            {required.length ? required.map((p) => <Chip key={p}>{p}</Chip>) : <Chip>nothing</Chip>}
          </div>
        </div>
        <div>
          <Label>Effect</Label>
          {sideEffects ? <Chip tone="warn">Side effect · can&apos;t be undone</Chip> : <Chip tone="pass">Read-only</Chip>}
        </div>
      </div>
    </div>
  );
}
