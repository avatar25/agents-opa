import type { ReactNode } from "react";

// Pretty-printed JSON with light token colouring. No dependency needed.
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;

function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of json.matchAll(TOKEN)) {
    if (m.index > last) out.push(json.slice(last, m.index));
    const [text, str, colon, lit, n] = m;
    if (str && colon) out.push(<span key={i++} className="text-ink-2">{str}</span>, colon);
    else if (str) out.push(<span key={i++} className="text-allow">{str}</span>);
    else if (lit) out.push(<span key={i++} className="text-accent">{lit}</span>);
    else if (n) out.push(<span key={i++} className="text-approval">{n}</span>);
    else out.push(text);
    last = m.index + text.length;
  }
  out.push(json.slice(last));
  return out;
}

export function JsonBlock({ value, label, className = "" }: { value: unknown; label?: string; className?: string }) {
  return (
    <pre
      aria-label={label}
      tabIndex={0}
      className={`overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[12px] leading-relaxed text-muted ${className}`}
    >
      <code>{highlight(JSON.stringify(value, null, 2))}</code>
    </pre>
  );
}
