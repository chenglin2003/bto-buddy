"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Location, LocationKind } from "@/types";
import { Trash2, MapPin } from "lucide-react";

interface Props {
  coupleId: string;
  userId: string;
  initial: Location[];
}

export function LocationsManager({ coupleId, userId, initial }: Props) {
  const [locations, setLocations] = useState<Location[]>(initial);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<LocationKind>("workplace");
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState(5);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function addLocation() {
    setError(null);
    setAdding(true);
    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error("Geocoding failed");
      const geo = await res.json();
      if (!geo || geo.error) {
        setError("Couldn't find that address. Try a postal code or building name.");
        return;
      }

      const supabase = createClient();
      const { data, error: insertErr } = await supabase
        .from("locations")
        .insert({
          couple_id: coupleId,
          user_id: userId,
          label: label || geo.address.split(",")[0],
          kind,
          address: geo.address,
          postal_code: geo.postal,
          lat: geo.lat,
          lng: geo.lng,
          weight,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      setLocations([...locations, data as Location]);
      setLabel("");
      setQuery("");
      setWeight(5);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function removeLocation(id: string) {
    const supabase = createClient();
    await supabase.from("locations").delete().eq("id", id);
    setLocations(locations.filter((l) => l.id !== id));
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-10">
      {/* Existing locations */}
      <section className="space-y-3">
        {locations.length === 0 ? (
          <p className="text-ink-muted text-sm italic">
            No locations yet — add your first below.
          </p>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-start gap-4 border border-ink/10 p-4 group"
            >
              <MapPin className="w-4 h-4 mt-1 text-clay shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-medium truncate">{loc.label}</p>
                  <span className="stamp border-ink/15 text-ink-muted">
                    {loc.kind}
                  </span>
                </div>
                <p className="text-xs text-ink-muted truncate">{loc.address}</p>
                <p className="text-xs text-ink-faint num mt-1">
                  weight {loc.weight}/10
                </p>
              </div>
              <button
                onClick={() => removeLocation(loc.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-rust transition-all p-1"
                aria-label="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </section>

      {/* Add form */}
      <section className="border border-ink/15 p-6 bg-paper-dim/30">
        <h2 className="font-display text-2xl mb-6">Add a location</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="query">Address or postal code</Label>
            <Input
              id="query"
              placeholder="e.g. 510423 or Marina Bay Sands"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                placeholder="Work, Mum's place..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kind">Kind</Label>
              <select
                id="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as LocationKind)}
                className="flex h-11 w-full border border-ink/15 bg-paper px-4 py-2 text-sm rounded focus-visible:outline-none focus-visible:border-clay"
              >
                <option value="workplace">Workplace</option>
                <option value="parents">Parents</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weight — how often you go (1 = rarely, 10 = daily)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[weight]}
                min={1}
                max={10}
                step={1}
                onValueChange={(v) => setWeight(v[0])}
                className="flex-1"
              />
              <span className="num text-sm w-8 text-right">{weight}</span>
            </div>
          </div>
          {error && (
            <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
              {error}
            </p>
          )}
          <Button onClick={addLocation} disabled={!query || adding} variant="clay">
            {adding ? "Looking up..." : "Add location"}
          </Button>
        </div>
      </section>
    </div>
  );
}
