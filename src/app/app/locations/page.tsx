import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LocationsManager } from "@/components/locations-manager";
import type { Location } from "@/types";

export default async function LocationsPage() {
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

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("couple_id", membership.couple_id)
    .eq("user_id", user.id)
    .order("created_at");

  return (
    <main className="px-6 md:px-10 py-10 max-w-3xl mx-auto">
      <p className="eyebrow mb-4">Where you go</p>
      <h1 className="font-display text-4xl tracking-tightest mb-3 text-balance">
        The places that <span className="italic">anchor</span> you.
      </h1>
      <p className="text-ink-soft mb-10 text-pretty">
        Add your workplace, parents' home, anywhere you go weekly. Weight each
        by how often you actually go there. We use OneMap to geocode and route.
      </p>
      <LocationsManager
        coupleId={membership.couple_id}
        userId={user.id}
        initial={(locations ?? []) as Location[]}
      />
    </main>
  );
}
