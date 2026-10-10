import { Deploy } from "@/components/Deploy";
import { Explorer } from "@/components/Explorer";

const REPO = "https://github.com/avatar25/agents-opa";

export default function Page() {
  return (
    <>
      <a
        href="#scenarios"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to scenarios
      </a>

      <header className="border-b border-line/70">
        <nav aria-label="Main" className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-4 sm:px-6">
          <a href="/" className="mr-auto flex items-center gap-2 font-mono text-[14px] font-semibold text-ink">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            agents.shiben.dev
          </a>
          <a href="#scenarios" className="hidden text-sm text-ink-2 hover:text-ink sm:inline">
            Scenarios
          </a>
          <a href="#deploy" className="text-sm text-ink-2 hover:text-ink">
            Deploy
          </a>
          <a href={REPO} className="text-sm text-ink-2 hover:text-ink">
            Source
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <section aria-labelledby="hero-title" className="pb-10 pt-14 sm:pb-12 sm:pt-20">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent">
            AI security × IAM · Open Policy Agent
          </p>
          <h1
            id="hero-title"
            className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,7vw,4.75rem)] font-extrabold leading-[0.98] tracking-tight"
          >
            Who is your AI agent acting for?
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2 sm:text-xl">
            Five tool calls. Follow each one through the policy and watch it get allowed, held or blocked.
          </p>
        </section>

        <section id="scenarios" aria-labelledby="scenarios-title" className="scroll-mt-6">
          <h2 id="scenarios-title" className="sr-only">
            Scenarios
          </h2>
          <Explorer />
        </section>

        <div className="py-20">
          <Deploy />
        </div>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <div className="mr-auto">
            <p className="font-display text-lg font-semibold">Shiben</p>
            <p className="text-sm text-muted">IAM engineer. Runs OPA as a service on Kubernetes in production.</p>
          </div>
          <ul className="flex gap-5 text-sm">
            <li>
              <a href="https://shiben.dev" className="text-ink-2 hover:text-ink">
                shiben.dev
              </a>
            </li>
            <li>
              <a href={REPO} className="text-ink-2 hover:text-ink">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/shibenc/" className="text-ink-2 hover:text-ink">
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
