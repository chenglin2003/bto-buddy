"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { error: createErr } = await supabase
        .from("couples")
        .insert({ name, created_by: user.id });
      if (createErr) throw createErr;

      router.push("/app/members");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create couple");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: couple, error: findErr } = await supabase
        .from("couples")
        .select("id")
        .eq("invite_code", inviteCode.trim().toLowerCase())
        .maybeSingle();

      if (findErr || !couple) {
        throw new Error("Invalid invite code");
      }

      const { error: joinErr } = await supabase
        .from("couple_members")
        .insert({
          couple_id: couple.id,
          user_id: user.id,
          display_name: displayName,
        });
      if (joinErr) throw joinErr;

      router.push("/app");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-4">Step one</p>
        <h1 className="font-display text-4xl tracking-tightest mb-3 text-balance">
          Are you <span className="italic">starting</span> or{" "}
          <span className="italic">joining</span>?
        </h1>
        <p className="text-ink-soft mb-8 text-pretty">
          One of you creates the couple, the other joins with the invite code.
        </p>

        <div className="flex gap-2 mb-8 border border-ink/15 p-1">
          {(["create", "join"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === m ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
              }`}
            >
              {m === "create" ? "Create a couple" : "Join existing"}
            </button>
          ))}
        </div>

        {mode === "create" ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Couple name</Label>
              <Input
                id="name"
                placeholder="The Tan-Lim household"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
                {error}
              </p>
            )}
            <Button
              onClick={handleCreate}
              variant="clay"
              size="lg"
              disabled={!name || busy}
              className="w-full"
            >
              {busy ? "Creating..." : "Create couple →"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                placeholder="abc12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="num"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display">Your name (what your partner calls you)</Label>
              <Input
                id="display"
                placeholder="Sarah"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
                {error}
              </p>
            )}
            <Button
              onClick={handleJoin}
              variant="clay"
              size="lg"
              disabled={!inviteCode || !displayName || busy}
              className="w-full"
            >
              {busy ? "Joining..." : "Join couple →"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
