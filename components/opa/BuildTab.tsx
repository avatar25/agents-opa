import { Chip, Label } from "@/components/ui/Chip";
import pkg from "@/package.json";
import summary from "@/public/test-summary.json";
import { RegoBlock } from "./Rego";

const ANATOMY: { title: string; lines: string[]; reads: string }[] = [
  {
    title: "Lines in a block → AND",
    lines: ["all_checks if {", "\tagent_granted", "\tuser_permitted", "\targs_ok", "}"],
    reads: "agent_granted ∧ user_permitted ∧ args_ok",
  },
  {
    title: "Same rule name twice → OR",
    lines: ["args_ok if { …send_email… }", "args_ok if { …create_payment… }", "args_ok if not constrained_tools[…]"],
    reads: "any body that holds makes args_ok true",
  },
  {
    title: "every → all items must pass",
    lines: ["every r in input.tool.args.to {", '\tendswith(r, "@corp.example")', "}"],
    reads: "one external recipient fails it. Empty list passes, hence count(…) > 0",
  },
  {
    title: "No match → default",
    lines: ['default decision := "deny"'],
    reads: "unknown agent, user or tool: rules stay undefined, deny wins",
  },
];

export function BuildTab({ wasmBytes }: { wasmBytes: number | null }) {
  const allPass = summary.passed === summary.total;
  const steps: { cmd: string; out: React.ReactNode }[] = [
    { cmd: "policy/authz.rego", out: <Chip>Rego v1 · agent.authz</Chip> },
    {
      cmd: "opa test",
      out: (
        <Chip tone={allPass ? "pass" : "fail"}>
          {summary.passed}/{summary.total} pass
        </Chip>
      ),
    },
    { cmd: "opa build -t wasm", out: <Chip>-e agent/authz/result</Chip> },
    {
      cmd: "policy.wasm",
      out: <Chip tone="accent">runs in this page{wasmBytes ? ` · ${Math.round(wasmBytes / 1024)} KB` : ""}</Chip>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Label>
          Pipeline · OPA {summary.opa_version} · opa-wasm {pkg.dependencies["@open-policy-agent/opa-wasm"]}
        </Label>
        <ol className="grid gap-3 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.cmd} className="relative rounded-xl border border-line bg-panel-deep p-4">
              <p className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</p>
              <p className={`mt-1 font-mono text-[14px] font-semibold ${i === 3 ? "text-accent" : "text-ink"}`}>{s.cmd}</p>
              <div className="mt-3">{s.out}</div>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 font-mono text-edge md:block"
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">
          CI rebuilds the Wasm from <code className="font-mono text-ink-2">policy/</code> and fails if the committed file
          differs, so the page always runs the tested policy. Nothing is sent to a server.
        </p>
      </div>

      <div>
        <Label>Reading Rego</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {ANATOMY.map((a) => (
            <div key={a.title} className="flex flex-col rounded-xl border border-line bg-panel-deep p-4">
              <h4 className="mb-3 font-display text-[16px] font-semibold text-ink">{a.title}</h4>
              <RegoBlock lines={a.lines} label={a.title} />
              <p className="mt-3 text-[13px] leading-snug text-muted">{a.reads}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
