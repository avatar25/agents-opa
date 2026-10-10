#!/usr/bin/env bash
# fmt → check → test → build wasm → copy to public/
# The outputs in public/ are committed; CI re-runs this and fails if they drift.
set -euo pipefail
cd "$(dirname "$0")/.."

# Pinned: a different compiler version can emit a different policy.wasm,
# which would make CI's staleness check fail. Override the binary with OPA=…
OPA_VERSION="1.21.1"
OPA="${OPA:-opa}"
opa_version="$("$OPA" version | awk '/^Version:/ {print $2}')"
if [[ "$opa_version" != "$OPA_VERSION" ]]; then
  echo "error: need OPA $OPA_VERSION, found $opa_version at $(command -v "$OPA")" >&2
  echo "       download it from https://github.com/open-policy-agent/opa/releases/tag/v$OPA_VERSION and set OPA=/path/to/opa" >&2
  exit 1
fi

"$OPA" fmt --fail policy/
"$OPA" check --strict policy/ scenarios/scenarios.json
"$OPA" test policy/ scenarios/scenarios.json -v

rm -rf dist && mkdir -p dist
"$OPA" build -t wasm -e agent/authz/result -o dist/bundle.tar.gz policy/authz.rego
# The tarball stores the module as "/policy.wasm"; tar strips the leading slash.
tar -xzf dist/bundle.tar.gz -C dist /policy.wasm
cp dist/policy.wasm public/policy.wasm

# Deterministic summary for the Build tab (no durations, so it diffs cleanly).
"$OPA" test policy/ scenarios/scenarios.json --format=json \
  | jq --arg v "$opa_version" '{
      opa_version: $v,
      total: length,
      passed: [.[] | select((.fail // false) == false and .error == null and (.skip // false) == false)] | length,
      tests: [.[] | .name] | sort
    }' > public/test-summary.json

echo "policy.wasm: $(wc -c < public/policy.wasm | tr -d ' ') bytes, $(jq -r '"\(.passed)/\(.total)"' public/test-summary.json) tests passed"
