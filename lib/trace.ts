// Maps the policy's own output onto the Rego source shown in the Evaluate tab.
// Formatting only: every value and every pass/fail comes from result.evidence
// or result.checks. If a display needs a decision the policy didn't return,
// add it to `evidence` in authz.rego instead of computing it here.
// Each `code` string is a verbatim line of policy/authz.rego (tests enforce this).

import type { Decision, PolicyInput, PolicyResult } from "./types";

export type Tone = "pass" | "fail" | "warn" | "neutral";

export interface TraceChip {
  text: string;
  tone: Tone;
  dashed?: boolean;
}

export interface TraceLine {
  code: string;
  chips: TraceChip[];
}

export interface TraceCard {
  rule: "agent_granted" | "user_permitted" | "args_ok" | "needs_approval";
  question: string;
  value: boolean;
  tone: Tone;
  lines: TraceLine[];
  note?: string;
}

export const GLYPH: Record<Tone, string> = { pass: "✓", fail: "✕", warn: "!", neutral: "" };

const list = (xs: readonly (string | number)[]) => `[${xs.join(", ")}]`;
const quote = (s: string) => `"${s}"`;
const num = (n: number | null) => (n == null ? "undefined" : n.toLocaleString("en-IN"));
const verdict = (ok: boolean): Tone => (ok ? "pass" : "fail");
const flag = (on: boolean): Tone => (on ? "warn" : "neutral");
const code = (line: string, ...chips: TraceChip[]): TraceLine => ({ code: line, chips });

export function buildTrace(input: PolicyInput, result: PolicyResult): TraceCard[] {
  const e = result.evidence;
  const c = result.checks;
  const tool = input.tool.name;

  const agentGranted: TraceCard = {
    rule: "agent_granted",
    question: "Was this agent given this tool?",
    value: c.agent_granted,
    tone: verdict(c.agent_granted),
    lines: [
      code("agent_granted if input.tool.name in data.agents[input.actor.id].tools", {
        text: `${quote(tool)} in ${list(e.agent_tools)}`,
        tone: verdict(c.agent_granted),
      }),
    ],
  };

  const userPermitted: TraceCard = {
    rule: "user_permitted",
    question: "Does the person hold every permission the tool needs?",
    value: c.user_permitted,
    tone: verdict(c.user_permitted),
    lines: [
      code("user_permitted if {"),
      code("\trequired := data.tools[input.tool.name].requires", {
        text: `required = ${list(e.required)}`,
        tone: "neutral",
      }),
      code("\tperms := data.users[input.subject.id].permissions", {
        text: `perms = ${list(e.user_permissions)}`,
        tone: "neutral",
      }),
      code("\tevery p in required {"),
      code(
        "\t\tp in perms",
        { text: `${list(e.required)} ⊆ perms`, tone: verdict(c.user_permitted) },
        ...e.missing_permissions.map((p): TraceChip => ({ text: `missing ${p}`, tone: "fail", dashed: true })),
      ),
      code("\t}"),
      code("}"),
    ],
  };

  const argsOk: TraceCard = {
    rule: "args_ok",
    question: "Are the arguments inside the limits?",
    value: c.args_ok,
    tone: verdict(c.args_ok),
    lines: argsLines(tool, result),
    note: "1 of 3 args_ok bodies is shown, the one for this tool. Same rule name, so OPA ORs the bodies.",
  };

  const needsApproval: TraceCard = {
    rule: "needs_approval",
    question: "Did untrusted content come before a call that changes something?",
    value: result.needs_approval,
    tone: flag(result.needs_approval),
    lines: [
      code("needs_approval if {"),
      code("\tinput.context.untrusted_content_seen == true", {
        text: `untrusted_content_seen = ${e.untrusted_content_seen}`,
        tone: flag(e.untrusted_content_seen),
      }),
      code("\tdata.tools[input.tool.name].side_effects == true", {
        text: `side_effects = ${e.side_effects}`,
        tone: flag(e.side_effects),
      }),
      code("}"),
    ],
  };

  return [agentGranted, userPermitted, argsOk, needsApproval];
}

function argsLines(tool: string, result: PolicyResult): TraceLine[] {
  const e = result.evidence;
  const ok = verdict(result.checks.args_ok);

  if (tool === "send_email") {
    return [
      code("args_ok if {"),
      code('\tinput.tool.name == "send_email"', { text: `tool = ${quote(tool)}`, tone: "neutral" }),
      code("\tcount(input.tool.args.to) > 0", { text: `count(to) = ${e.recipients.length}`, tone: "neutral" }),
      code("\tevery r in input.tool.args.to {", { text: `to = ${list(e.recipients)}`, tone: "neutral" }),
      code(
        '\t\tendswith(r, concat("", ["@", data.org.domain]))',
        ...e.recipient_checks.map((r): TraceChip => ({
          text: `${r.to} ends with "@${e.org_domain}"`,
          tone: verdict(r.internal),
        })),
      ),
      code("\t}"),
      code("}"),
    ];
  }

  if (tool === "create_payment") {
    return [
      code("args_ok if {"),
      code('\tinput.tool.name == "create_payment"', { text: `tool = ${quote(tool)}`, tone: "neutral" }),
      code("\tinput.tool.args.amount_inr <= data.limits.payment_inr", {
        text: `${num(e.amount_inr)} <= ${num(e.payment_limit_inr)}`,
        tone: ok,
      }),
      code("}"),
    ];
  }

  return [
    code("args_ok if not constrained_tools[input.tool.name]", {
      text: `${quote(tool)} ∉ {${e.constrained_tools.join(", ")}}`,
      tone: ok,
    }),
  ];
}

/** The three decision rules, verbatim, keyed by the decision each one produces. */
export const DECISION_RULES: { decision: Decision; lines: string[] }[] = [
  { decision: "allow", lines: ['decision := "allow" if {', "\tall_checks", "\tnot needs_approval", "}"] },
  { decision: "needs_approval", lines: ['decision := "needs_approval" if {', "\tall_checks", "\tneeds_approval", "}"] },
  { decision: "deny", lines: ['default decision := "deny"'] },
];
