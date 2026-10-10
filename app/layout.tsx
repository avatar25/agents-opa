import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-bricolage",
  display: "swap",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

const description =
  "Five AI agent tool calls, each followed through a real OPA policy compiled to WebAssembly and running in your browser: allowed, held for approval, or blocked.";

export const metadata: Metadata = {
  metadataBase: new URL("https://agents.shiben.dev"),
  title: "Authorizing AI Agents with OPA",
  description,
  alternates: { canonical: "/" },
  authors: [{ name: "Shiben", url: "https://shiben.dev" }],
  openGraph: {
    title: "Authorizing AI Agents with OPA",
    description,
    url: "/",
    siteName: "agents.shiben.dev",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Authorizing AI Agents with OPA", description },
};

export const viewport: Viewport = {
  themeColor: "#0C0E12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        {/* Start fetching the policy while the page hydrates. */}
        <link rel="preload" href="/policy.wasm" as="fetch" type="application/wasm" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh bg-bg text-ink">{children}</body>
    </html>
  );
}
