import { Chip, Label } from "@/components/ui/Chip";
import { orgData, personFor } from "@/lib/scenarios";
import type { PolicyResult, Scenario } from "@/lib/types";

export function PromptBubble({ scenario }: { scenario: Scenario }) {
  return (
    <p className="inline-block max-w-full rounded-2xl rounded-tl-sm border border-line-strong bg-panel-deep px-4 py-2 text-[15px] text-ink">
      “{scenario.prompt}”
    </p>
  );
}

export function PersonDetail({ scenario, result }: { scenario: Scenario; result: PolicyResult | null }) {
  const p = personFor(scenario);
  const perms = result?.evidence.user_permissions ?? orgData.users[p.id]?.permissions ?? [];
  const required = new Set(result?.evidence.required ?? []);
  const missing = result?.evidence.missing_permissions ?? [];

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 flex-none place-items-center rounded-full bg-line-strong font-display text-2xl font-semibold text-ink"
        >
          {p.initial}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold">{p.name}</p>
          <p className="truncate font-mono text-[13px] text-muted">{p.id}</p>
          <p className="text-sm text-ink-2">{p.role}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Holds · {required.size > 0 ? "highlighted = this tool needs it" : "this tool needs nothing"}</Label>
          <div className="flex flex-wrap gap-2">
            {perms.map((perm) => (
              <Chip key={perm} tone={required.has(perm) ? "pass" : "neutral"}>
                {perm}
              </Chip>
            ))}
            {missing.map((perm) => (
              <Chip key={perm} tone="fail" dashed>
                missing {perm}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Asked the agent</Label>
          <PromptBubble scenario={scenario} />
        </div>
      </div>
    </div>
  );
}
