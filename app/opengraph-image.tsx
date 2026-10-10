import { ImageResponse } from "next/og";

export const alt = "Who is your AI agent acting for? Authorizing AI agents with OPA.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  bg: "#0C0E12",
  panel: "#11141A",
  node: "#2E3544",
  ink: "#ECEAE4",
  ink2: "#C4C9D2",
  muted: "#A3AAB6",
  edge: "#8C95A6",
  accent: "#F5B841",
  accentTint: "#221C0F",
  deny: "#FB923C",
  denyTint: "#2A1A10",
};

const TITLE = "Who is your AI agent acting for?";
const EYEBROW = "AI SECURITY × IAM · OPEN POLICY AGENT";

// Satori needs TTF/OTF; Google Fonts serves those to non-browser user agents.
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

function Node({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "14px 20px",
        borderRadius: 12,
        border: `2px solid ${accent ? C.accent : C.node}`,
        background: accent ? C.accentTint : C.panel,
        color: accent ? C.accent : C.ink2,
        fontSize: 24,
      }}
    >
      {label}
    </div>
  );
}

function Arrow() {
  return (
    <svg width="40" height="16" viewBox="0 0 40 16">
      <path d="M2 8 H32" stroke={C.edge} strokeWidth="2.5" />
      <path d="M30 2 L38 8 L30 14 Z" fill={C.edge} />
    </svg>
  );
}

export default async function Image() {
  const [display, mono] = await Promise.all([
    googleFont("Bricolage+Grotesque", 800, TITLE),
    googleFont("JetBrains+Mono", 600, `${EYEBROW}PersonAgentsend_emailOPADENYagents.shiben.dev`),
  ]);
  const fonts = [
    ...(display ? [{ name: "Display", data: display, weight: 800 as const, style: "normal" as const }] : []),
    ...(mono ? [{ name: "Mono", data: mono, weight: 600 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: C.bg,
          padding: "72px 80px",
          color: C.ink,
          fontFamily: "Mono",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: C.accent, fontSize: 24, letterSpacing: 3 }}>{EYEBROW}</div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontFamily: "Display",
              fontSize: 92,
              lineHeight: 1,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            {TITLE}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Node label="Person" />
          <Arrow />
          <Node label="Agent" />
          <Arrow />
          <Node label="send_email" />
          <Arrow />
          <Node label="OPA" accent />
          <Arrow />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 26px",
              borderRadius: 999,
              border: `2px solid ${C.deny}`,
              background: C.denyTint,
              color: C.deny,
              fontSize: 28,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22">
              <path d="M4 4 L18 18 M18 4 L4 18" stroke={C.deny} strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            DENY
          </div>
        </div>

        <div style={{ display: "flex", color: C.muted, fontSize: 22 }}>agents.shiben.dev</div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
