"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InviteCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-2 border-clay/30 bg-clay-wash/30 p-8">
      <p className="eyebrow mb-3">Invite code</p>
      <div className="flex items-center justify-between gap-4">
        <p className="num text-4xl md:text-5xl tracking-tightest text-clay select-all">
          {code}
        </p>
        <Button onClick={copy} variant={copied ? "outline" : "clay"} size="sm">
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy
            </>
          )}
        </Button>
      </div>
      <p className="mt-6 text-sm text-ink-soft text-pretty">
        Your partner enters this on the onboarding page after they sign in with
        their own email.
      </p>
    </div>
  );
}
