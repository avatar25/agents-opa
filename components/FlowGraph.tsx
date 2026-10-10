"use client";

import type { CSSProperties } from "react";
import { GEOMETRY, nodeInfo, outcomeOf, VERDICT } from "@/lib/nodes";
import { OUTCOMES, personFor } from "@/lib/scenarios";
import type { Decision, NodeId, PolicyResult, Scenario } from "@/lib/types";

type Dir = "r" | "l" | "d" | "u";
type Tone = "dim" | "on" | "accent" | "injected" | Decision;

interface EdgeDef {
  d: string;
  head?: [number, number, Dir];
  label?: { x: number; y: number; text: string; anchor: "start" | "middle" | "end" };
}

interface Layout {
  viewBox: string;
  person: EdgeDef;
  injected: EdgeDef;
  agentTool: EdgeDef;
  toolGateway: EdgeDef;
  input: EdgeDef;
  verdict: EdgeDef;
  fanBase: EdgeDef[];
  fan: (to: Decision) => EdgeDef;
}

// Desktop 1104×440: the main row runs along y=212.
const OUT_Y: Record<Decision, number> = { allow: 72, needs_approval: 212, deny: 352 };
const H: Layout = {
  viewBox: "0 0 1104 440",
  person: { d: "M176 212 H246", head: [248, 212, "r"] },
  injected: { d: "M324 104 V170", head: [324, 172, "d"], label: { x: 333, y: 142, text: "injected", anchor: "start" } },
  agentTool: { d: "M400 212 H470", head: [472, 212, "r"] },
  toolGateway: { d: "M624 212 H694", head: [696, 212, "r"] },
  input: { d: "M747 252 V330", head: [747, 332, "d"], label: { x: 739, y: 296, text: "input", anchor: "end" } },
  verdict: { d: "M797 332 V254", head: [797, 252, "u"], label: { x: 805, y: 296, text: "verdict", anchor: "start" } },
  fanBase: [
    { d: "M848 212 H884" },
    { d: "M884 72 V352" },
    ...OUTCOMES.map((o): EdgeDef => ({ d: `M884 ${OUT_Y[o]} H918`, head: [920, OUT_Y[o], "r"] })),
  ],
  fan: (o) => ({ d: `M848 212 H884 V${OUT_Y[o]} H918`, head: [920, OUT_Y[o], "r"] }),
};

// Mobile 360×592: main column at x=96, outcomes as a row of three.
const OUT_X: Record<Decision, number> = { allow: 68, needs_approval: 180, deny: 292 };
const V: Layout = {
  viewBox: "0 0 360 592",
  person: { d: "M96 88 V126", head: [96, 128, "d"] },
  injected: { d: "M224 164 H178", head: [176, 164, "l"], label: { x: 200, y: 157, text: "injected", anchor: "middle" } },
  agentTool: { d: "M96 200 V238", head: [96, 240, "d"] },
  toolGateway: { d: "M96 312 V350", head: [96, 352, "d"] },
  input: { d: "M176 376 H222", head: [224, 376, "r"], label: { x: 200, y: 369, text: "input", anchor: "middle" } },
  verdict: { d: "M224 400 H178", head: [176, 400, "l"], label: { x: 200, y: 416, text: "verdict", anchor: "middle" } },
  fanBase: [
    { d: "M96 424 V458" },
    { d: "M68 458 H292" },
    ...OUTCOMES.map((o): EdgeDef => ({ d: `M${OUT_X[o]} 458 V490`, head: [OUT_X[o], 492, "d"] })),
  ],
  fan: (o) => ({ d: `M96 424 V458 H${OUT_X[o]} V490`, head: [OUT_X[o], 492, "d"] }),
};

function arrow([x, y, dir]: [number, number, Dir]): string {
  const a = 7;
  const b = 4;
  switch (dir) {
    case "r":
      return `M${x - a} ${y - b} L${x} ${y} L${x - a} ${y + b}Z`;
    case "l":
      return `M${x + a} ${y - b} L${x} ${y} L${x + a} ${y + b}Z`;
    case "d":
      return `M${x - b} ${y - a} L${x} ${y} L${x + b} ${y - a}Z`;
    case "u":
      return `M${x - b} ${y + a} L${x} ${y} L${x + b} ${y + a}Z`;
  }
}

function Edge({ e, tone, step, animate }: { e: EdgeDef; tone: Tone; step?: number; animate: boolean }) {
  const anim = animate && step !== undefined;
  const style = anim ? ({ "--i": step } as CSSProperties) : undefined;
  return (
    <g>
      <path d={e.d} className={`edge ${anim ? "draw" : ""}`} data-tone={tone} pathLength={anim ? 1 : undefined} style={style} />
      {e.head ? <path d={arrow(e.head)} className={`head ${anim ? "pop" : ""}`} data-tone={tone} style={style} /> : null}
      {e.label ? (
        <text x={e.label.x} y={e.label.y} textAnchor={e.label.anchor} className="elabel" data-tone={tone}>
          {e.label.text}
        </text>
      ) : null}
    </g>
  );
}

function Edges({ layout, className, hasUntrusted, decision }: { layout: Layout; className: string; hasUntrusted: boolean; decision: Decision | null }) {
  // Animate once per scenario, when OPA's answer arrives. Before that, draw statically.
  const animate = decision !== null;
  return (
    <svg className={className} viewBox={layout.viewBox} aria-hidden="true" focusable="false">
      {layout.fanBase.map((e, i) => (
        <Edge key={i} e={e} tone="dim" animate={false} />
      ))}
      {hasUntrusted ? <Edge e={layout.injected} tone="injected" step={0} animate={animate} /> : null}
      <Edge e={layout.person} tone="on" step={0} animate={animate} />
      <Edge e={layout.agentTool} tone="on" step={1} animate={animate} />
      <Edge e={layout.toolGateway} tone="on" step={2} animate={animate} />
      <Edge e={layout.input} tone="accent" step={3} animate={animate} />
      <Edge e={layout.verdict} tone={decision ? "accent" : "dim"} step={4} animate={animate} />
      {decision ? <Edge e={layout.fan(decision)} tone={decision} step={5} animate={animate} /> : null}
    </svg>
  );
}

export function FlowGraph({
  scenario,
  result,
  selected,
  onSelect,
}: {
  scenario: Scenario;
  result: PolicyResult | null;
  selected: NodeId;
  onSelect: (id: NodeId) => void;
}) {
  const decision = result?.decision ?? null;
  const hasUntrusted = scenario.untrusted !== null;
  const nodes: NodeId[] = [
    "person",
    ...(hasUntrusted ? (["untrusted"] as const) : []),
    "agent",
    "toolcall",
    "gateway",
    "opa",
    ...OUTCOMES.map((o) => `outcome:${o}` as const),
  ];

  return (
    <div className="graph-wrap">
      <div className="graph-canvas" key={`${scenario.id}:${decision ?? "pending"}`}>
        <Edges layout={H} className="edges-h" hasUntrusted={hasUntrusted} decision={decision} />
        <Edges layout={V} className="edges-v" hasUntrusted={hasUntrusted} decision={decision} />
        {nodes.map((id) => {
          const g = GEOMETRY[id];
          const info = nodeInfo(id, scenario, result);
          const outcome = outcomeOf(id);
          const state = outcome ? (outcome === decision ? "taken" : "dim") : "on";
          const style = {
            "--x": g.x,
            "--y": g.y,
            "--w": g.w,
            "--h": g.h,
            "--mx": g.mx,
            "--my": g.my,
            "--mw": g.mw,
            "--mh": g.mh,
          } as CSSProperties;
          return (
            <button
              key={id}
              type="button"
              className="gnode"
              style={style}
              data-kind={outcome ? "outcome" : id}
              data-outcome={outcome ?? undefined}
              data-state={state}
              aria-pressed={selected === id}
              onClick={() => onSelect(id)}
            >
              <span className="gk">{info.kind}</span>
              <span className="gt">
                {id === "person" ? (
                  <span className="gavatar" aria-hidden="true">
                    {personFor(scenario).initial}
                  </span>
                ) : null}
                {outcome ? (
                  <span className="gglyph font-mono" aria-hidden="true">
                    {VERDICT[outcome].glyph}
                  </span>
                ) : null}
                <span className={outcome ? "min-w-0" : "min-w-0 truncate"}>{info.title}</span>
              </span>
              {outcome ? (
                <span className="sr-only">{state === "taken" ? "(this request)" : "(not taken)"}</span>
              ) : (
                <span className="gs">{info.sub}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
