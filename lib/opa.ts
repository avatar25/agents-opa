import { loadPolicy } from "@open-policy-agent/opa-wasm";
import policyData from "@/policy/data.json";
import type { PolicyInput, PolicyResult } from "./types";

export const ENTRYPOINT = "agent/authz/result";

export interface Evaluator {
  evaluate(input: PolicyInput): PolicyResult;
  wasmBytes: number;
}

/** Instantiate the compiled policy and load data.json into it. */
export async function createEvaluator(
  wasm: ArrayBuffer | Uint8Array,
  data: object = policyData,
): Promise<Evaluator> {
  const policy = await loadPolicy(wasm as BufferSource);
  policy.setData(data);
  return {
    wasmBytes: wasm.byteLength,
    evaluate(input) {
      const resultSet = policy.evaluate(input, ENTRYPOINT);
      const result = Array.isArray(resultSet) ? resultSet[0]?.result : undefined;
      if (result == null) {
        throw new Error(`policy returned no value for ${ENTRYPOINT}`);
      }
      return result as PolicyResult;
    },
  };
}

let cached: Promise<Evaluator> | null = null;

/** Fetch /policy.wasm once per page load. A failed load is not cached, so retry works. */
export function loadEvaluator(url = "/policy.wasm"): Promise<Evaluator> {
  cached ??= fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
      return createEvaluator(await res.arrayBuffer());
    })
    .catch((err: unknown) => {
      cached = null;
      throw err;
    });
  return cached;
}
