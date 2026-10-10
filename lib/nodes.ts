import { inr, orgData, personFor } from "./scenarios";
import type { Decision, NodeId, PolicyResult, Scenario } from "./types";

/** Node boxes in canvas units: desktop (x, y, w, h) on 1104×440, mobile (mx, my, mw, mh) on 360×592. */
export const GEOMETRY: Record<NodeId, { x: number; y: number; w: number; h: number; mx: number; my: number; mw: number; mh: number }> = {
  person: { x: 24, y: 172, w: 152, h: 80, mx: 16, my: 16, mw: 160, mh: 72 },
  untrusted: { x: 248, y: 24, w: 152, h: 80, mx: 224, my: 128, mw: 120, mh: 72 },
  agent: { x: 248, y: 172, w: 152, h: 80, mx: 16, my: 128, mw: 160, mh: 72 },
  toolcall: { x: 472, y: 172, w: 152, h: 80, mx: 16, my: 240, mw: 160, mh: 72 },
  gateway: { x: 696, y: 172, w: 152, h: 80, mx: 16, my: 352, mw: 160, mh: 72 },
  opa: { x: 696, y: 332, w: 152, h: 80, mx: 224, my: 352, mw: 120, mh: 72 },
  "outcome:allow": { x: 920, y: 32, w: 160, h: 80, mx: 16, my: 492, mw: 104, mh: 84 },
  "outcome:needs_approval": { x: 920, y: 172, w: 160, h: 80, mx: 128, my: 492, mw: 104, mh: 84 },
  "outcome:deny": { x: 920, y: 312, w: 160, h: 80, mx: 240, my: 492, mw: 104, mh: 84 },
};

export const VERDICT: Record<Decision, { glyph: string; label: string; outcome: string; short: string }> = {
  allow: { glyph: "✓", label: "ALLOW", outcome: "Tool runs", short: "Allowed" },
  needs_approval: { glyph: "!", label: "NEEDS APPROVAL", outcome: "Human approval", short: "Held" },
  deny: { glyph: "✕", label: "DENY", outcome: "Blocked + logged", short: "Blocked" },
};

export function outcomeOf(id: NodeId): Decision | null {
  return id.startsWith("outcome:") ? (id.slice("outcome:".length) as Decision) : null;
}

export function toolSummary(s: Scenario): string {
  const { name, args } = s.input.tool;
  if (name === "send_email" && Array.isArray(args.to)) return `to ${args.to.join(", ")}`;
  if (name === "create_payment" && typeof args.amount_inr === "number") return `${inr(args.amount_inr)} → ${args.payee}`;
  const first = Object.entries(args)[0];
  return first ? `${first[0]}: ${String(first[1])}` : "no args";
}

export interface NodeInfo {
  kind: string;
  title: string;
  sub: string;
}

export function nodeInfo(id: NodeId, s: Scenario, result: PolicyResult | null): NodeInfo {
  const outcome = outcomeOf(id);
  if (outcome) {
    const v = VERDICT[outcome];
    return { kind: v.label, title: v.outcome, sub: v.short };
  }
  switch (id) {
    case "person": {
      const p = personFor(s);
      return { kind: "Person", title: p.name, sub: p.role };
    }
    case "untrusted":
      return { kind: "Untrusted input", title: s.untrusted?.label ?? "", sub: s.untrusted?.from ?? "" };
    case "agent": {
      const tools = orgData.agents[s.input.actor.id]?.tools.length ?? 0;
      return { kind: "Agent", title: s.input.actor.id, sub: `${tools} tools granted` };
    }
    case "toolcall":
      return { kind: "Tool call", title: s.input.tool.name, sub: toolSummary(s) };
    case "gateway":
      return { kind: "Gateway", title: "Tool gateway", sub: "token exchange" };
    case "opa":
      return {
        kind: "Policy · Wasm",
        title: "OPA",
        sub: result ? `= "${result.decision}"` : "evaluating…",
      };
  }
  return { kind: "", title: "", sub: "" };
}
