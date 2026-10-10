package agent.authz

# ---------- decision ----------

default decision := "deny"

decision := "allow" if {
	all_checks
	not needs_approval
}

decision := "needs_approval" if {
	all_checks
	needs_approval
}

all_checks if {
	agent_granted
	user_permitted
	args_ok
}

# ---------- layer 1: agent grant ----------
# The agent may only call tools it was explicitly given.

agent_granted if input.tool.name in data.agents[input.actor.id].tools

# ---------- layer 2: on whose behalf ----------
# The person the agent acts for must hold every permission the tool needs.
# (Stops the agent becoming a confused deputy.)

user_permitted if {
	required := data.tools[input.tool.name].requires
	perms := data.users[input.subject.id].permissions
	every p in required {
		p in perms
	}
}

# ---------- layer 3: arguments ----------

constrained_tools := {"send_email", "create_payment"}

args_ok if {
	input.tool.name == "send_email"
	count(input.tool.args.to) > 0
	every r in input.tool.args.to {
		endswith(r, concat("", ["@", data.org.domain]))
	}
}

args_ok if {
	input.tool.name == "create_payment"
	input.tool.args.amount_inr <= data.limits.payment_inr
}

args_ok if not constrained_tools[input.tool.name]

# ---------- layer 4: provenance ----------
# If the agent has read untrusted content this session, any call with
# side effects needs a human to approve it.

needs_approval if {
	input.context.untrusted_content_seen == true
	data.tools[input.tool.name].side_effects == true
}

# ---------- explanation output (drives the UI) ----------

default check_agent_granted := false

check_agent_granted if agent_granted

default check_user_permitted := false

check_user_permitted if user_permitted

default check_args_ok := false

check_args_ok if args_ok

default check_all := false

check_all if all_checks

default check_needs_approval := false

check_needs_approval if needs_approval

checks := {
	"agent_granted": check_agent_granted,
	"user_permitted": check_user_permitted,
	"args_ok": check_args_ok,
}

failed := [name | some name, ok in checks; ok == false]

# Evidence must always be defined, even for malformed input, so every
# lookup goes through object.get with a default.

_tool := object.get(input, ["tool", "name"], "")

_actor := object.get(input, ["actor", "id"], "")

_subject := object.get(input, ["subject", "id"], "")

_required := object.get(data.tools, [_tool, "requires"], [])

_user_permissions := object.get(data.users, [_subject, "permissions"], [])

_recipients := object.get(input, ["tool", "args", "to"], [])

evidence := {
	"agent_tools": object.get(data.agents, [_actor, "tools"], []),
	"required": _required,
	"user_permissions": _user_permissions,
	"missing_permissions": [p | some p in _required; not p in _user_permissions],
	"recipients": _recipients,
	"recipient_checks": [{"to": r, "internal": endswith(r, concat("", ["@", data.org.domain]))} | some r in _recipients],
	"constrained_tools": constrained_tools,
	"amount_inr": object.get(input, ["tool", "args", "amount_inr"], null),
	"payment_limit_inr": data.limits.payment_inr,
	"org_domain": data.org.domain,
	"untrusted_content_seen": object.get(input, ["context", "untrusted_content_seen"], false),
	"side_effects": object.get(data.tools, [_tool, "side_effects"], false),
}

result := {
	"decision": decision,
	"checks": checks,
	"all_checks": check_all,
	"needs_approval": check_needs_approval,
	"failed": failed,
	"evidence": evidence,
}
