import { Chip } from "@/components/ui/Chip";
import { personFor } from "@/lib/scenarios";
import type { Scenario } from "@/lib/types";

/** A light "paper" mock of the email or web page, with the hidden instruction revealed. */
export function UntrustedDetail({ scenario }: { scenario: Scenario }) {
  const u = scenario.untrusted;
  if (!u) return null;
  const person = personFor(scenario).name;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start">
      <figure className="overflow-hidden rounded-xl border border-paper-line bg-paper text-paper-ink shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <figcaption className="sr-only">
          {u.kind === "email" ? "Mock email" : "Mock web page"} with a hidden instruction revealed
        </figcaption>
        {u.kind === "web" ? (
          <div className="flex items-center gap-2 border-b border-paper-line bg-[#ebe6db] px-3 py-2">
            <span aria-hidden="true" className="flex gap-1">
              <span className="size-2.5 rounded-full bg-[#d4cbb8]" />
              <span className="size-2.5 rounded-full bg-[#d4cbb8]" />
              <span className="size-2.5 rounded-full bg-[#d4cbb8]" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-md bg-paper px-2 py-0.5 font-mono text-[12px] text-paper-muted">
              https://{u.from}
            </span>
          </div>
        ) : null}
        <div className="space-y-3 p-5">
          {u.kind === "email" ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-paper-line pb-3 text-[13px]">
              <dt className="text-paper-muted">From</dt>
              <dd className="truncate font-mono">{u.from}</dd>
              <dt className="text-paper-muted">Subject</dt>
              <dd className="font-semibold">{u.subject}</dd>
            </dl>
          ) : (
            <p className="font-display text-lg font-semibold">{u.subject}</p>
          )}
          <p className="text-[15px] leading-relaxed">{u.visible}</p>
          <div className="rounded-lg border-2 border-dashed border-[#c2410c] bg-[#fff1e6] p-3">
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-[#9a3412]">
              {u.kind === "email" ? "Hidden: white text, 1px font" : "Hidden: display:none in the page"}
            </p>
            <p className="font-mono text-[13px] leading-relaxed text-[#7c2d12]">{u.hidden}</p>
          </div>
        </div>
      </figure>

      <div className="flex flex-col items-start gap-2">
        <Chip tone="neutral">invisible to {person} · visible to the model</Chip>
        <Chip tone="warn">sets untrusted_content_seen = true</Chip>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          The agent can&apos;t reliably tell data from instructions. The policy doesn&apos;t try to: it only needs to know that
          untrusted content was read.
        </p>
      </div>
    </div>
  );
}
