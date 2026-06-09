import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 md:px-10 py-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tightest text-ink">
            BTO
          </span>
          <span className="font-display text-2xl italic text-clay">
            Buddy
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="#how"
            className="hidden sm:block text-sm text-ink-muted hover:text-ink transition-colors"
          >
            How it works
          </Link>
          <Link
            href="#data"
            className="hidden sm:block text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Data sources
          </Link>
          {user ? (
            <Button asChild size="sm" variant="clay">
              <Link href="/app">Open app</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="clay">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </header>

      {/* Hero — editorial split */}
      <section className="px-6 md:px-10 pt-12 md:pt-20 pb-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-end">
          <div className="md:col-span-7">
            <p className="eyebrow mb-6">Vol. 1 · For Singapore couples</p>
            <h1 className="font-display text-[3rem] md:text-[5.5rem] leading-[0.95] tracking-tightest text-ink text-balance">
              The flat hunt,
              <br />
              <span className="italic text-clay">reconciled.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-ink-soft leading-relaxed text-pretty">
              You want a short commute. Your partner wants close to their parents.
              You both want a hawker centre downstairs. BTO Buddy ranks every
              upcoming launch against what actually matters — for{" "}
              <em className="font-display italic">both of you</em>.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" variant="clay">
                <Link href="/login">Start planning →</Link>
              </Button>
              <Link
                href="#how"
                className="text-sm text-ink-muted hover:text-ink transition-colors underline-offset-4 hover:underline"
              >
                See a sample ranking
              </Link>
            </div>
          </div>

          {/* Side stat panel — Bloomberg terminal energy */}
          <aside className="md:col-span-5 md:pl-8 md:border-l border-ink/10">
            <p className="eyebrow mb-4">February 2026 exercise · in numbers</p>
            <dl className="space-y-5">
              <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-ink/10">
                <dt className="text-sm text-ink-muted">Flats launched</dt>
                <dd className="num text-3xl text-ink">9,012</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-ink/10">
                <dt className="text-sm text-ink-muted">2026 total launches</dt>
                <dd className="num text-3xl text-ink">19,600</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-ink/10">
                <dt className="text-sm text-ink-muted">SWT flats (&lt;3 yr wait)</dt>
                <dd className="num text-3xl text-clay">4,000+</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-ink-muted">Sales exercises remaining</dt>
                <dd className="num text-3xl text-ink">2</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className="rule mx-6 md:mx-10" />

      {/* How it works */}
      <section id="how" className="px-6 md:px-10 py-20 max-w-7xl mx-auto">
        <p className="eyebrow mb-6">How it works</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tightest mb-16 max-w-3xl text-balance">
          Four steps from <span className="italic">indecision</span> to a
          ranked shortlist.
        </h2>

        <ol className="grid md:grid-cols-2 gap-x-12 gap-y-12">
          {[
            {
              n: "01",
              title: "Pair up",
              body: "Create a couple account. Invite your partner with a shareable code. You each set your own preferences.",
            },
            {
              n: "02",
              title: "Mark your places",
              body: "Drop pins on your workplaces, parents' homes, and anywhere else you visit weekly. Weight each by how much you actually go there.",
            },
            {
              n: "03",
              title: "Tune the dials",
              body: "Five sliders: commute, MRT, amenities, price, estate maturity. Set a hard budget cap. Pick unit types.",
            },
            {
              n: "04",
              title: "See it reconciled",
              body: "Every BTO launch ranked, with sub-scores per partner and a written rationale for the top picks. Disagreements surfaced, not buried.",
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-6">
              <span className="num text-clay text-sm pt-1 shrink-0">
                {step.n}
              </span>
              <div>
                <h3 className="font-display text-2xl mb-2">{step.title}</h3>
                <p className="text-ink-soft leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="rule mx-6 md:mx-10" />

      {/* Data sources */}
      <section id="data" className="px-6 md:px-10 py-20 max-w-7xl mx-auto">
        <p className="eyebrow mb-6">Built on official data</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tightest mb-12 max-w-3xl text-balance">
          No guesses. Just <span className="italic">data.gov.sg</span> and OneMap.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              src: "HDB",
              detail:
                "BTO launch schedule, project locations, unit mix, price guidance — straight from press releases and data.gov.sg.",
            },
            {
              src: "OneMap",
              detail:
                "Singapore Land Authority's national map. Real public-transport routing, nearest MRT, amenity counts within walking distance.",
            },
            {
              src: "Claude",
              detail:
                "Anthropic's LLM writes a short, grounded explanation of why each top pick ranks where it does — referencing your specific preferences.",
            },
          ].map((s) => (
            <div key={s.src} className="border border-ink/10 p-6">
              <p className="font-display text-xl mb-3">{s.src}</p>
              <p className="text-sm text-ink-soft leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-12 border-t border-ink/10 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-ink-muted">
          <p>
            BTO Buddy is an independent tool. Not affiliated with HDB, SLA, or
            the Singapore government.
          </p>
          <p className="num">
            Made in Singapore · v0.1
          </p>
        </div>
      </footer>
    </main>
  );
}
