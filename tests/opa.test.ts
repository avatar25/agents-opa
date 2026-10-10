import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { createEvaluator, type Evaluator } from "@/lib/opa";
import { scenarios } from "@/lib/scenarios";
import type { PolicyInput } from "@/lib/types";

// The same public/policy.wasm the page fetches, with the same data.json.
let opa: Evaluator;

beforeAll(async () => {
  opa = await createEvaluator(readFileSync(new URL("../public/policy.wasm", import.meta.url)));
});

describe("policy.wasm", () => {
  it.each(scenarios.map((s) => [s.id, s] as const))("%s returns its expected decision", (_id, s) => {
    expect(opa.evaluate(s.input).decision).toBe(s.expected);
  });

  const table = {
    "poisoned-email": { decision: "deny", failed: ["args_ok"], needs_approval: true },
    "confused-deputy": { decision: "deny", failed: ["user_permitted"], needs_approval: false },
    "wrong-agent": { decision: "deny", failed: ["agent_granted"], needs_approval: false },
    "web-sets-amount": { decision: "needs_approval", failed: [], needs_approval: true },
    baseline: { decision: "allow", failed: [], needs_approval: false },
  } as const;

  it.each(Object.entries(table))("%s matches the failed-checks table", (id, want) => {
    const s = scenarios.find((x) => x.id === id)!;
    const r = opa.evaluate(s.input);
    expect({ decision: r.decision, failed: r.failed, needs_approval: r.needs_approval }).toEqual(want);
  });

  it("returns evidence the UI can render", () => {
    const r = opa.evaluate(scenarios.find((s) => s.id === "confused-deputy")!.input);
    expect(r.evidence.missing_permissions).toEqual(["payments.create"]);
    expect(r.evidence.amount_inr).toBe(40000);
    expect(r.evidence.payment_limit_inr).toBe(50000);
    expect(r.checks).toEqual({ agent_granted: true, user_permitted: false, args_ok: true });
  });

  it("denies by default and still returns a full result for empty input", () => {
    const r = opa.evaluate({} as PolicyInput);
    expect(r.decision).toBe("deny");
    expect(r.failed).toHaveLength(3);
    expect(r.evidence.recipients).toEqual([]);
  });

  it("follows data.json: raising the payment limit changes nothing in TS", async () => {
    const data = JSON.parse(readFileSync(new URL("../policy/data.json", import.meta.url), "utf8"));
    data.limits.payment_inr = 10000;
    const strict = await createEvaluator(readFileSync(new URL("../public/policy.wasm", import.meta.url)), data);
    const r = strict.evaluate(scenarios.find((s) => s.id === "web-sets-amount")!.input);
    expect(r.decision).toBe("deny");
    expect(r.failed).toEqual(["args_ok"]);
  });
});
