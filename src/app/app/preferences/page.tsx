import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "@/components/preferences-form";
import type { Preferences } from "@/types";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const { data: prefs } = await supabase
    .from("preferences")
    .select("*")
    .eq("couple_id", membership.couple_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const initial: Preferences =
    (prefs as Preferences) ??
    ({
      couple_id: membership.couple_id,
      user_id: user.id,
      w_commute: 70,
      w_mrt: 60,
      w_amenities: 50,
      w_price: 70,
      w_maturity: 40,
      max_price_sgd: null,
      unit_types: ["4-room", "5-room"],
      reconciliation: "average",
      updated_at: new Date().toISOString(),
    } as Preferences);

  return (
    <main className="px-6 md:px-10 py-10 max-w-3xl mx-auto">
      <p className="eyebrow mb-4">Your dials</p>
      <h1 className="font-display text-4xl tracking-tightest mb-3 text-balance">
        What matters to <span className="italic">you</span>?
      </h1>
      <p className="text-ink-soft mb-12 text-pretty">
        Each slider is independent of your partner's. We reconcile them when
        ranking — you can pick how (average, max-pain, or weighted) at the bottom.
      </p>
      <PreferencesForm initial={initial} />
    </main>
  );
}
