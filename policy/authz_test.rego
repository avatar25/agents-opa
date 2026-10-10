package agent.authz_test

import data.agent.authz

# ---------- helpers ----------

scenario(id) := s if {
	some s in data.scenarios
	s.id == id
}

result_for(id) := r if {
	s := scenario(id)
	r := authz.result with input as s.input
}

# A known-good request. Edge cases patch one field of it.
base := {
	"subject": {"id": "asha@corp.example"},
	"actor": {"id": "inbox-assistant"},
	"tool": {"name": "send_email", "args": {"to": ["cfo@corp.example"]}},
	"context": {"untrusted_content_seen": false},
}

patched(patch) := object.union(base, patch)

# ---------- 1. scenario-driven ----------
# scenarios/scenarios.json is the single source of truth for expected verdicts.

mismatches contains msg if {
	some s in data.scenarios
	got := authz.decision with input as s.input
	got != s.expected
	msg := sprintf("%s: expected %s, got %s", [s.id, s.expected, got])
}

test_every_scenario_matches_expected if {
	count(data.scenarios) == 5
	print("scenario mismatches:", mismatches)
	count(mismatches) == 0
}

# ---------- 2. per-scenario failed checks and approval flag ----------

test_poisoned_email if {
	r := result_for("poisoned-email")
	r.decision == "deny"
	r.failed == ["args_ok"]
	r.needs_approval == true
}

test_confused_deputy if {
	r := result_for("confused-deputy")
	r.decision == "deny"
	r.failed == ["user_permitted"]
	r.needs_approval == false
	r.evidence.missing_permissions == ["payments.create"]
}

test_wrong_agent if {
	r := result_for("wrong-agent")
	r.decision == "deny"
	r.failed == ["agent_granted"]
	r.needs_approval == false
}

test_web_sets_amount if {
	r := result_for("web-sets-amount")
	r.decision == "needs_approval"
	r.failed == []
	r.needs_approval == true
	r.all_checks == true
}

test_baseline if {
	r := result_for("baseline")
	r.decision == "allow"
	r.failed == []
	r.needs_approval == false
	r.all_checks == true
}

# ---------- 3. edge cases ----------

test_base_request_is_allowed if {
	authz.decision == "allow" with input as base
}

# Deny by default: unknown principals and tools leave rules undefined.

test_unknown_agent_denied if {
	r := authz.result with input as patched({"actor": {"id": "rogue-agent"}})
	r.decision == "deny"
	r.failed == ["agent_granted"]
}

test_unknown_user_denied if {
	r := authz.result with input as patched({"subject": {"id": "mallory@corp.example"}})
	r.decision == "deny"
	r.failed == ["user_permitted"]
}

# run_tests requires nothing, so `every` over [] is true. The user must still exist.
test_unknown_user_denied_for_tool_with_no_requirements if {
	inp := {
		"subject": {"id": "mallory@corp.example"},
		"actor": {"id": "code-helper"},
		"tool": {"name": "run_tests", "args": {}},
		"context": {"untrusted_content_seen": false},
	}
	r := authz.result with input as inp
	r.decision == "deny"
	r.failed == ["user_permitted"]
}

test_unknown_tool_denied if {
	r := authz.result with input as patched({"tool": {"name": "delete_repo", "args": {}}})
	r.decision == "deny"
	"agent_granted" in r.failed
	"user_permitted" in r.failed
}

# Even if an agent is granted a tool, the tool must exist in the catalogue.
test_granted_but_uncatalogued_tool_denied if {
	r := authz.result with input as patched({"tool": {"name": "delete_repo", "args": {}}})
		with data.agents as {"inbox-assistant": {"tools": ["delete_repo"]}}
	r.decision == "deny"
	r.failed == ["user_permitted"]
}

# `every` over an empty array is true: the count guard must stop this.
test_empty_recipients_denied if {
	r := authz.result with input as patched({"tool": {"args": {"to": []}}})
	r.decision == "deny"
	r.failed == ["args_ok"]
}

test_missing_recipients_denied if {
	inp := {
		"subject": {"id": "asha@corp.example"},
		"actor": {"id": "inbox-assistant"},
		"tool": {"name": "send_email", "args": {"subject": "hi"}},
		"context": {"untrusted_content_seen": false},
	}
	r := authz.result with input as inp
	r.decision == "deny"
	r.failed == ["args_ok"]
}

test_mixed_recipients_denied if {
	r := authz.result with input as patched({"tool": {"args": {"to": ["cfo@corp.example", "x@evil.example"]}}})
	r.decision == "deny"
	r.failed == ["args_ok"]
	r.evidence.recipient_checks == [
		{"to": "cfo@corp.example", "internal": true},
		{"to": "x@evil.example", "internal": false},
	]
}

# The "@" in the suffix stops look-alike domains.
test_lookalike_domain_denied if {
	r := authz.result with input as patched({"tool": {"args": {"to": ["cfo@evilcorp.example"]}}})
	r.decision == "deny"
}

payment(amount) := {
	"subject": {"id": "asha@corp.example"},
	"actor": {"id": "inbox-assistant"},
	"tool": {"name": "create_payment", "args": {"payee": "vendor-0042", "amount_inr": amount}},
	"context": {"untrusted_content_seen": false},
}

test_payment_at_limit_allowed if {
	authz.args_ok with input as payment(50000)
	authz.decision == "allow" with input as payment(50000)
}

test_payment_one_rupee_over_denied if {
	r := authz.result with input as payment(50001)
	r.decision == "deny"
	r.failed == ["args_ok"]
}

test_payment_without_amount_denied if {
	r := authz.result with input as patched({"tool": {"name": "create_payment", "args": {"payee": "vendor-0042"}}})
	r.decision == "deny"
}

# No side effects, so untrusted content does not force a human in the loop.
test_read_file_after_untrusted_content_allowed if {
	inp := patched({
		"tool": {"name": "read_file", "args": {"path": "q3-summary.pdf"}},
		"context": {"untrusted_content_seen": true},
	})
	r := authz.result with input as inp
	r.decision == "allow"
	r.needs_approval == false
}

test_run_tests_by_code_helper_allowed if {
	inp := {
		"subject": {"id": "ravi@corp.example"},
		"actor": {"id": "code-helper"},
		"tool": {"name": "run_tests", "args": {}},
		"context": {"untrusted_content_seen": false},
	}
	authz.decision == "allow" with input as inp
}

# A human approval never rescues a request that already failed a check.
test_approval_does_not_rescue_failed_checks if {
	inp := patched({
		"tool": {"args": {"to": ["x@evil.example"]}},
		"context": {"untrusted_content_seen": true},
	})
	r := authz.result with input as inp
	r.decision == "deny"
	r.needs_approval == true
}

# The UI reads `result` only, so it must be defined for any input.
test_result_defined_for_empty_input if {
	r := authz.result with input as {}
	r.decision == "deny"
	count(r.failed) == 3
	r.evidence.recipients == []
	r.evidence.amount_inr == null
}
