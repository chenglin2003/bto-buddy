"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Preferences, Reconciliation } from "@/types";

const UNIT_TYPES = ["2-room", "3-room", "4-room", "5-room", "3-Gen"];

const RECONCILIATION_HELP: Record<Reconciliation, string> = {
  average: "Take the simple mean of both partners' scores.",
  max_pain: "Use the lower score — if one partner hates it, it ranks lower.",
  weighted: "Tilt toward the partner who feels stronger about each factor.",
};

export function PreferencesForm({ initial }: { initial: Preferences }) {
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function set<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    const supabase = createClient();
    const { error } = await supabase.from("preferences").upsert({
      couple_id: prefs.couple_id,
      user_id: prefs.user_id,
      w_commute: prefs.w_commute,
      w_mrt: prefs.w_mrt,
      w_amenities: prefs.w_amenities,
      w_price: prefs.w_price,
      w_maturity: prefs.w_maturity,
      max_price_sgd: prefs.max_price_sgd,
      unit_types: prefs.unit_types,
      reconciliation: prefs.reconciliation,
    });
    if (!error) {
      setSaved(true);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-12">
      {/* Five sliders */}
      <section className="space-y-7">
        <h2 className="font-display text-2xl mb-1">Priorities</h2>
        <p className="text-sm text-ink-muted -mt-4">
          Each slider 0–100. Higher means more important.
        </p>
        <SliderRow
          label="Commute"
          hint="Travel time to your workplaces and parents"
          value={prefs.w_commute}
          onChange={(v) => set("w_commute", v)}
        />
        <SliderRow
          label="MRT access"
          hint="Walking distance to nearest MRT/LRT station"
          value={prefs.w_mrt}
          onChange={(v) => set("w_mrt", v)}
        />
        <SliderRow
          label="Amenities"
          hint="Schools, malls, parks, hawker centres nearby"
          value={prefs.w_amenities}
          onChange={(v) => set("w_amenities", v)}
        />
        <SliderRow
          label="Price"
          hint="How tightly the median price fits your budget cap"
          value={prefs.w_price}
          onChange={(v) => set("w_price", v)}
        />
        <SliderRow
          label="Estate maturity"
          hint="Established towns vs. newer estates"
          value={prefs.w_maturity}
          onChange={(v) => set("w_maturity", v)}
        />
      </section>

      <div className="rule" />

      {/* Budget cap */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Budget cap</h2>
        <div className="flex items-center gap-3 max-w-sm">
          <span className="text-ink-muted">S$</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="600000"
            value={prefs.max_price_sgd ?? ""}
            onChange={(e) =>
              set(
                "max_price_sgd",
                e.target.value ? parseInt(e.target.value, 10) : null,
              )
            }
            className="num"
          />
        </div>
        <p className="text-xs text-ink-muted">
          Optional hard ceiling on median unit price. Leave empty for no cap.
        </p>
      </section>

      <div className="rule" />

      {/* Unit types */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Unit types</h2>
        <p className="text-sm text-ink-muted">
          Projects without your preferred types are filtered out.
        </p>
        <div className="flex flex-wrap gap-2">
          {UNIT_TYPES.map((u) => {
            const active = prefs.unit_types.includes(u);
            return (
              <button
                key={u}
                type="button"
                onClick={() =>
                  set(
                    "unit_types",
                    active
                      ? prefs.unit_types.filter((t) => t !== u)
                      : [...prefs.unit_types, u],
                  )
                }
                className={`stamp transition-colors ${
                  active
                    ? "bg-ink text-paper border-ink"
                    : "border-ink/20 text-ink-muted hover:border-ink"
                }`}
              >
                {u}
              </button>
            );
          })}
        </div>
      </section>

      <div className="rule" />

      {/* Reconciliation */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl">When you disagree</h2>
        <p className="text-sm text-ink-muted">
          How to combine your scores with your partner's.
        </p>
        <div className="space-y-2">
          {(["average", "max_pain", "weighted"] as const).map((mode) => (
            <label
              key={mode}
              className={`block border p-4 cursor-pointer transition-colors ${
                prefs.reconciliation === mode
                  ? "border-clay bg-clay-wash/30"
                  : "border-ink/15 hover:border-ink/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="reconciliation"
                  checked={prefs.reconciliation === mode}
                  onChange={() => set("reconciliation", mode)}
                  className="accent-clay"
                />
                <span className="font-display text-lg capitalize">
                  {mode.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-1 ml-7">
                {RECONCILIATION_HELP[mode]}
              </p>
            </label>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4 pt-6 sticky bottom-0 bg-paper/90 backdrop-blur-sm border-t border-ink/10 py-4 -mx-6 px-6">
        <Button onClick={save} variant="clay" disabled={isPending}>
          {isPending ? "Saving..." : "Save preferences"}
        </Button>
        {saved && (
          <span className="text-sm text-leaf">Saved — rankings refreshed.</span>
        )}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <Label className="block mb-0.5 text-ink normal-case tracking-normal text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-ink-faint">{hint}</p>
      </div>
      <div className="col-span-6">
        <Slider
          value={[value]}
          min={0}
          max={100}
          step={5}
          onValueChange={(v) => onChange(v[0])}
        />
      </div>
      <div className="col-span-1 text-right">
        <span className="num text-sm text-ink-muted">{value}</span>
      </div>
    </div>
  );
}
