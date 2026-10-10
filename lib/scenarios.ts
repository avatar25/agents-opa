import rawData from "@/policy/data.json";
import rawScenarios from "@/scenarios/scenarios.json";
import type { Decision, NodeId, OrgData, Scenario } from "./types";

export const scenarios = rawScenarios.scenarios as Scenario[];
export const orgData = rawData as OrgData;

export const OUTCOMES: Decision[] = ["allow", "needs_approval", "deny"];

/** The nodes a request passes through, in order. The outcome is known only once OPA has answered. */
export function pathFor(s: Scenario, decision: Decision | null): NodeId[] {
  const path: NodeId[] = ["person"];
  if (s.untrusted) path.push("untrusted");
  path.push("agent", "toolcall", "gateway", "opa");
  if (decision) path.push(`outcome:${decision}`);
  return path;
}

export function personFor(s: Scenario) {
  const id = s.input.subject.id;
  const user = orgData.users[id];
  const name = user?.name ?? id;
  return { id, name, role: user?.role ?? "Unknown user", initial: name.charAt(0).toUpperCase() };
}

/** Indian-grouped rupees: 40000 → "₹40,000". */
export function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
