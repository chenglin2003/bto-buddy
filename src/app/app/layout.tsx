import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find the user's couple
  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const { data: couple } = membership
    ? await supabase
        .from("couples")
        .select("name, invite_code")
        .eq("id", membership.couple_id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink/10 bg-paper/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 md:px-10 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/app" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tightest">
              BTO
            </span>
            <span className="font-display text-xl italic text-clay">Buddy</span>
            {couple && (
              <span className="ml-4 text-xs text-ink-muted">
                · {couple.name}
              </span>
            )}
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/app">Rankings</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/preferences">Preferences</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/locations">Locations</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/members">Members</Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
