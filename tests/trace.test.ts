import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { createEvaluator, type Evaluator } from "@/lib/opa";
import { scenarios } from "@/lib/scenarios";
import { buildTrace, DECISION_RULES } from "@/lib/trace";
import type { PolicyInput } from "@/lib/types";

const source = new Set(readFileSync(new URL("../policy/authz.rego", import.meta.url), "utf8").split("\n"));

let opa: Evaluator;
beforeAll(async () => {
  opa = await createEvaluator(readFileSync(new URL("../public/policy.wasm", import.meta.url)));
});

// Scenarios cover send_email and create_payment; add an unconstrained tool for the third args_ok body.
const readFile: PolicyInput = {
  subject: { id: "asha@corp.example" },
  actor: { id: "inbox-assistant" },
  tool: { name: "read_file", args: { path: "q3-summary.pdf" } },
  context: { untrusted_content_seen: true },
};
const inputs = [...scenarios.map((s) => s.input), readFile];

describe("trace", () => {
  it("shows only lines that exist verbatim in policy/authz.rego", () => {
    const shown = new Set<string>();
    for (const input of inputs) for (const card of buildTrace(input, opa.evaluate(input))) for (const l of card.lines) shown.add(l.code);
    for (const rule of DECISION_RULES) for (const l of rule.lines) shown.add(l);
    const missing = [...shown].filter((l) => !source.has(l));
    expect(missing).toEqual([]);
  });

  it("colours cards from result.checks and result.needs_approval", () => {
    for (const input of inputs) {
      const r = opa.evaluate(input);
      const cards = Object.fromEntries(buildTrace(input, r).map((c) => [c.rule, c.value]));
      expect(cards).toEqual({ ...r.checks, needs_approval: r.needs_approval });
    }
  });

  it("renders resolved values from evidence", () => {
    const s = scenarios.find((x) => x.id === "poisoned-email")!;
    const cards = buildTrace(s.input, opa.evaluate(s.input));
    const chips = cards.flatMap((c) => c.lines.flatMap((l) => l.chips));
    expect(chips).toContainEqual({ text: '"send_email" in [send_email, read_file, create_payment]', tone: "pass" });
    expect(chips).toContainEqual({ text: 'drop@evil.example ends with "@corp.example"', tone: "fail" });
    expect(chips).toContainEqual({ text: "untrusted_content_seen = true", tone: "warn" });
  });
});
