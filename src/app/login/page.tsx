"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="font-display text-xl tracking-tightest mb-12">
          BTO <span className="italic text-clay">Buddy</span>
        </p>
        <div className="h-12 w-32 bg-paper-dim animate-pulse rounded" />
      </div>
    </main>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block mb-12 font-display text-xl tracking-tightest"
        >
          BTO <span className="italic text-clay">Buddy</span>
        </Link>

        <h1 className="font-display text-4xl md:text-5xl tracking-tightest mb-3 text-balance">
          Welcome back.
        </h1>
        <p className="text-ink-muted mb-10 text-pretty">
          Sign in with your email — we'll send you a magic link. No passwords.
        </p>

        {status === "sent" ? (
          <div className="border border-leaf/40 bg-leaf/5 p-6">
            <p className="font-display text-xl mb-2">Check your inbox.</p>
            <p className="text-sm text-ink-soft">
              We sent a sign-in link to{" "}
              <span className="num">{email}</span>. It expires in an hour.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="clay"
              size="lg"
              disabled={status === "sending"}
              className="w-full"
            >
              {status === "sending" ? "Sending..." : "Send magic link →"}
            </Button>
          </form>
        )}

        <p className="mt-12 text-xs text-ink-faint">
          By signing in you agree to be a thoughtful flat-hunter.
        </p>
      </div>
    </main>
  );
}