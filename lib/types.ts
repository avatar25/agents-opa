export type Decision = "allow" | "needs_approval" | "deny";

export type CheckName = "agent_granted" | "user_permitted" | "args_ok";

/** The `input` document OPA evaluates. */
export interface PolicyInput {
  subject: { id: string };
  actor: { id: string };
  tool: { name: string; args: Record<string, unknown> };
  context: { untrusted_content_seen: boolean };
}

/** `result.evidence`: every value the UI displays comes from here. */
export interface Evidence {
  agent_tools: string[];
  required: string[];
  user_permissions: string[];
  missing_permissions: string[];
  recipients: string[];
  recipient_checks: { to: string; internal: boolean }[];
  constrained_tools: string[];
  amount_inr: number | null;
  payment_limit_inr: number;
  org_domain: string;
  untrusted_content_seen: boolean;
  side_effects: boolean;
}

/** `data.agent.authz.result`, the Wasm entrypoint. */
export interface PolicyResult {
  decision: Decision;
  checks: Record<CheckName, boolean>;
  all_checks: boolean;
  needs_approval: boolean;
  failed: CheckName[];
  evidence: Evidence;
}

export interface UntrustedSource {
  kind: "email" | "web";
  label: string;
  from: string;
  subject: string;
  visible: string;
  hidden: string;
}

export interface Scenario {
  id: string;
  title: string;
  tag: string;
  prompt: string;
  untrusted: UntrustedSource | null;
  input: PolicyInput;
  expected: Decision;
}

/** policy/data.json */
export interface OrgData {
  org: { domain: string };
  limits: { payment_inr: number };
  agents: Record<string, { tools: string[] }>;
  users: Record<string, { name: string; role: string; permissions: string[] }>;
  tools: Record<string, { requires: string[]; side_effects: boolean }>;
}

export type OutcomeNode = `outcome:${Decision}`;

export type NodeId =
  | "person"
  | "untrusted"
  | "agent"
  | "toolcall"
  | "gateway"
  | "opa"
  | OutcomeNode;
