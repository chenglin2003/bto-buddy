import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rankProjects } from "@/lib/ranking";
import { Button } from "@/components/ui/button";
import type {
  BtoProject,
  CoupleMember,
  Location,
  Preferences,
  RankedProject,
} from "@/types";
import { ProjectCard } from "@/components/project-card";

export default async function RankingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find membership
  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return <OnboardingPrompt />;
  }

  const coupleId = membership.couple_id;

  // Fetch everything in parallel
  const [
    { data: members },
    { data: locations },
    { data: preferences },
    { data: projects },
    { data: cachedScores },
  ] = await Promise.all([
    supabase.from("couple_members").select("*").eq("couple_id", coupleId),
    supabase.from("locations").select("*").eq("couple_id", coupleId),
    supabase.from("preferences").select("*").eq("couple_id", coupleId),
    supabase.from("bto_projects").select("*").order("launch"),
    supabase.from("scores").select("*").eq("couple_id", coupleId),
  ]);

  const ms = (members ?? []) as CoupleMember[];
  const ls = (locations ?? []) as Location[];
  const ps = (preferences ?? []) as Preferences[];
  const projs = (projects ?? []) as BtoProject[];

  const partners = ms.map((m) => ({
    userId: m.user_id,
    displayName: m.display_name,
    preferences:
      ps.find((p) => p.user_id === m.user_id) ??
      ({
        couple_id: coupleId,
        user_id: m.user_id,
        w_commute: 70,
        w_mrt: 60,
        w_amenities: 50,
        w_price: 70,
        w_maturity: 40,
        max_price_sgd: null,
        unit_types: ["4-room", "5-room"],
        reconciliation: "average",
        updated_at: new Date().toISOString(),
      } as Preferences),
    locations: ls.filter((l) => l.user_id === m.user_id),
  }));

  const ranked = rankProjects(projs, partners);

  // Hydrate LLM reasoning from cache if available
  const scoreMap = new Map((cachedScores ?? []).map((s) => [s.project_id, s]));
  const hydrated: RankedProject[] = ranked.map((r) => ({
    ...r,
    llm_reasoning: scoreMap.get(r.id)?.llm_reasoning ?? null,
  }));

  // Group by launch
  const byLaunch = hydrated.reduce<Record<string, RankedProject[]>>(
    (acc, p) => {
      (acc[p.launch] ??= []).push(p);
      return acc;
    },
    {},
  );

  return (
    <main className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <p className="eyebrow mb-3">Your shortlist</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tightest mb-3 text-balance">
            {hydrated.length > 0
              ? `${hydrated.length} projects, ranked.`
              : "No matches yet."}
          </h1>
          <p className="text-ink-soft max-w-2xl text-pretty">
            {partners.length === 1
              ? "Invite your partner to refine these rankings — disagreements will surface here."
              : `Reconciled across ${partners.length} partners using the ${partners[0]?.preferences.reconciliation} strategy.`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/preferences">Adjust preferences</Link>
          </Button>
          <Button asChild variant="clay" size="sm">
            <Link href="/app/explain">Generate AI rationale</Link>
          </Button>
        </div>
      </div>

      {/* Quick summary strip */}
      {hydrated.length > 0 && (
        <div className="mb-12 grid grid-cols-2 md:grid-cols-4 border border-ink/10 divide-x divide-ink/10">
          <Stat label="Top score" value={`${hydrated[0].score.toFixed(0)}/100`} />
          <Stat label="Top pick" value={hydrated[0].project_name} mono={false} />
          <Stat
            label="Avg commute score"
            value={`${avg(hydrated.map((p) => p.breakdown.commute.partner_a)).toFixed(0)}`}
          />
          <Stat label="Total to rank" value={`${hydrated.length}`} />
        </div>
      )}

      {/* Group by launch */}
      {Object.entries(byLaunch).map(([launch, items]) => (
        <section key={launch} className="mb-16">
          <div className="flex items-baseline gap-4 mb-6 pb-3 border-b border-ink/15">
            <h2 className="font-display text-2xl">{launch}</h2>
            <span className="num text-sm text-ink-muted">
              {items.length} project{items.length !== 1 ? "s" : ""}
            </span>
            {items.some((p) => p.swt) && (
              <span className="stamp border-leaf/40 text-leaf">
                Some SWT
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                rank={hydrated.indexOf(p) + 1}
                partnerNames={partners.map((pt) => pt.displayName)}
              />
            ))}
          </div>
        </section>
      ))}

      {hydrated.length === 0 && <EmptyState />}
    </main>
  );
}

function Stat({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-4 py-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className={mono ? "num text-2xl text-ink" : "text-2xl font-display text-ink"}>
        {value}
      </p>
    </div>
  );
}

function OnboardingPrompt() {
  return (
    <main className="px-6 md:px-10 py-20 max-w-3xl mx-auto text-center">
      <p className="eyebrow mb-6">Welcome</p>
      <h1 className="font-display text-5xl tracking-tightest mb-6 text-balance">
        Let's set up your <span className="italic">couple</span>.
      </h1>
      <p className="text-ink-soft mb-10 max-w-xl mx-auto text-pretty">
        Create a shared space where you and your partner can each set preferences
        independently. We'll reconcile them into one ranking.
      </p>
      <Button asChild variant="clay" size="lg">
        <Link href="/onboarding">Create your couple →</Link>
      </Button>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="border border-ink/10 p-12 text-center">
      <p className="font-display text-2xl mb-3">No projects matched your filters.</p>
      <p className="text-ink-muted mb-6">
        Try broadening your unit type preferences or raising the budget cap.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/app/preferences">Adjust preferences</Link>
      </Button>
    </div>
  );
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
