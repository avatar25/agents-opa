import type { ReactNode } from "react";
import { Chip } from "@/components/ui/Chip";

function Box({ x, y, w, label, accent = false }: { x: number; y: number; w: number; label: string; accent?: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={28}
        rx={6}
        className={accent ? "fill-accent-tint stroke-accent" : "fill-panel-deep stroke-line-node"}
        strokeWidth={1.2}
      />
      <text
        x={x + w / 2}
        y={y + 18}
        textAnchor="middle"
        className={`font-mono text-[10px] ${accent ? "fill-accent" : "fill-ink-2"}`}
      >
        {label}
      </text>
    </g>
  );
}

const line = "stroke-edge";

const TILES: { title: string; body: string; label: string; svg: ReactNode }[] = [
  {
    title: "Gateway",
    body: "One choke point for every tool call. OPA runs as a service beside it.",
    label: "Agent to gateway to tool, with the gateway asking OPA",
    svg: (
      <>
        <Box x={8} y={18} w={60} label="agent" />
        <Box x={90} y={18} w={60} label="gateway" />
        <Box x={172} y={18} w={60} label="tool" />
        <Box x={90} y={82} w={60} label="OPA" accent />
        <path d="M68 32 H86" className={line} strokeWidth={1.2} markerEnd="url(#dep-arrow)" />
        <path d="M150 32 H168" className={line} strokeWidth={1.2} markerEnd="url(#dep-arrow)" />
        <path d="M112 46 V78 M128 82 V50" className="stroke-accent" strokeWidth={1.2} />
      </>
    ),
  },
  {
    title: "Sidecar",
    body: "OPA in the same pod as each tool service. Decisions over localhost.",
    label: "Agent calling a pod that holds the tool and an OPA sidecar",
    svg: (
      <>
        <Box x={8} y={46} w={56} label="agent" />
        <rect x={84} y={8} width={150} height={104} rx={10} className="fill-none stroke-line-strong" strokeDasharray="4 4" />
        <text x={96} y={26} className="fill-muted font-mono text-[9px]">
          pod
        </text>
        <Box x={96} y={46} w={58} label="tool" />
        <Box x={166} y={46} w={58} label="OPA" accent />
        <path d="M64 60 H92" className={line} strokeWidth={1.2} markerEnd="url(#dep-arrow)" />
        <path d="M154 56 H166 M166 66 H154" className="stroke-accent" strokeWidth={1.2} />
        <text x={160} y={96} textAnchor="middle" className="fill-muted font-mono text-[9px]">
          localhost
        </text>
      </>
    ),
  },
  {
    title: "WebAssembly",
    body: "The policy compiled into the process: edge, browser, or this page.",
    label: "A process box holding the app and policy.wasm",
    svg: (
      <>
        <rect x={8} y={8} width={226} height={104} rx={10} className="fill-none stroke-line-strong" strokeDasharray="4 4" />
        <text x={20} y={26} className="fill-muted font-mono text-[9px]">
          one process
        </text>
        <Box x={22} y={46} w={70} label="app" />
        <Box x={128} y={46} w={92} label="policy.wasm" accent />
        <path d="M92 60 H124" className="stroke-accent" strokeWidth={1.2} />
        <text x={121} y={96} textAnchor="middle" className="fill-muted font-mono text-[9px]">
          no network hop
        </text>
      </>
    ),
  },
];

export function Deploy() {
  return (
    <section id="deploy" aria-labelledby="deploy-title" className="scroll-mt-20">
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent">Deploy</p>
      <h2 id="deploy-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Same policy, three places to run it
      </h2>

      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <marker id="dep-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8Z" className="fill-edge" />
          </marker>
        </defs>
      </svg>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TILES.map((t) => (
          <article key={t.title} className="rounded-2xl border border-line bg-panel p-5">
            <svg viewBox="0 0 242 120" role="img" aria-label={t.label} className="w-full">
              {t.svg}
            </svg>
            <h3 className="mt-4 font-display text-xl font-semibold">{t.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{t.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-line-strong px-5 py-4">
        <span className="mr-2 font-mono text-[12px] uppercase tracking-[0.08em] text-deny">Doesn&apos;t fix</span>
        {["intent", "prompt injection itself", "a runtime that lies about context"].map((t) => (
          <Chip key={t} dashed glyph={null}>
            {t}
          </Chip>
        ))}
      </div>
    </section>
  );
}
