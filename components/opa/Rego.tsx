import type { ReactNode } from "react";

// Minimal Rego colouring: strings, keywords, comments. Enough to read, no dependency.
const TOKEN = /(#.*$)|("(?:\\.|[^"\\])*")|\b(if|every|in|not|default|some|contains|package|import|else)\b|(:=|==|<=|>=)/g;

export function RegoLine({ code }: { code: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [text, comment, str, kw, op] = m;
    const cls = comment ? "text-faint" : str ? "text-allow" : kw ? "text-accent" : op ? "text-muted" : "";
    out.push(
      <span key={i++} className={cls}>
        {text}
      </span>,
    );
    last = m.index + text.length;
  }
  out.push(code.slice(last));
  return <>{out}</>;
}

export function RegoBlock({ lines, className = "", label }: { lines: string[]; className?: string; label?: string }) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className={`overflow-x-auto rounded-lg border border-line bg-code px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-ink-2 ${className}`}
    >
      <code>
        {lines.map((l, i) => (
          <span key={i} className="block">
            <RegoLine code={l} />
          </span>
        ))}
      </code>
    </pre>
  );
}
