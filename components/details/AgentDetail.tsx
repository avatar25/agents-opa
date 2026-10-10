import { Chip, Label } from "@/components/ui/Chip";
import { orgData, personFor } from "@/lib/scenarios";
import type { PolicyResult, Scenario } from "@/lib/types";

export function AgentDetail({ scenario, result }: { scenario: Scenario; result: PolicyResult | null }) {
  const called = scenario.input.tool.name;
  const tools = result?.evidence.agent_tools ?? orgData.agents[scenario.input.actor.id]?.tools ?? [];
  const granted = result?.checks.agent_granted;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Label>Granted tools · {scenario.input.actor.id}</Label>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <Chip key={t} tone={t === called ? "accent" : "neutral"} glyph={t === called ? "← called" : null}>
              {t}
            </Chip>
          ))}
          {granted === false ? (
            <Chip tone="fail" dashed>
              {called} (not granted)
            </Chip>
          ) : null}
        </div>
      </div>
      <div>
        <Label>In its context</Label>
        <div className="flex flex-wrap gap-2">
          <Chip tone="neutral" glyph={null}>
            {personFor(scenario).name}: “{scenario.prompt}”
          </Chip>
          {scenario.untrusted ? (
            <Chip tone="warn">
              {scenario.untrusted.label} · {scenario.untrusted.from}
            </Chip>
          ) : null}
        </div>
      </div>
    </div>
  );
}
