import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteCard } from "@/components/invite-card";
import type { CoupleMember } from "@/types";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find membership
  const { data: membership, error: membershipErr } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");
  // Fetch the couple directly — avoids any PostgREST embed shape quirks
  const { data: couple, error: coupleErr } = await supabase
    .from("couples")
    .select("id, name, invite_code")
    .eq("id", membership.couple_id)
    .maybeSingle();

  if (!couple) {
    return (
      <main className="px-6 md:px-10 py-10 max-w-3xl mx-auto">
        <p className="eyebrow mb-4 text-rust">Error</p>
        <h1 className="font-display text-3xl tracking-tightest mb-3">
          Couldn't load couple data
        </h1>
        <p className="text-ink-soft text-sm">
          Membership ID: {membership.couple_id}
          {coupleErr && <><br />Error: {coupleErr.message}</>}
        </p>
      </main>
    );
  }

  const { data: members } = await supabase
    .from("couple_members")
    .select("*")
    .eq("couple_id", membership.couple_id)
    .order("joined_at");

  const memberList = (members ?? []) as CoupleMember[];

  return (
    <main className="px-6 md:px-10 py-10 max-w-3xl mx-auto">
      <p className="eyebrow mb-4">Your couple</p>
      <h1 className="font-display text-4xl tracking-tightest mb-3 text-balance">
        {couple.name}
      </h1>
      <p className="text-ink-soft mb-10 text-pretty">
        Share the invite code below with your partner so they can join.
      </p>

      <InviteCard code={couple.invite_code} />

      <section className="mt-12">
        <h2 className="font-display text-2xl mb-6">Members</h2>
        <ul className="space-y-3">
          {memberList.map((m) => (
            <li
              key={m.user_id}
              className="border border-ink/10 p-4 flex items-baseline justify-between"
            >
              <div>
                <p className="font-medium">{m.display_name}</p>
                {m.user_id === user.id && (
                  <p className="text-xs text-clay">You</p>
                )}
              </div>
              <p className="num text-xs text-ink-muted">
                joined {new Date(m.joined_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
        {memberList.length === 1 && (
          <p className="mt-6 text-sm text-ink-muted italic">
            Just you so far. Share the invite code above to add your partner.
          </p>
        )}
      </section>
    </main>
  );
}
