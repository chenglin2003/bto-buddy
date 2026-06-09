export type LocationKind = "workplace" | "parents" | "other";

export interface Couple {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  invite_code: string;
}

export interface CoupleMember {
  couple_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
}

export interface Location {
  id: string;
  couple_id: string;
  user_id: string;
  label: string;
  kind: LocationKind;
  address: string;
  postal_code: string | null;
  lat: number;
  lng: number;
  weight: number;
  created_at: string;
}

export type Reconciliation = "average" | "max_pain" | "weighted";

export interface Preferences {
  couple_id: string;
  user_id: string;
  w_commute: number;
  w_mrt: number;
  w_amenities: number;
  w_price: number;
  w_maturity: number;
  max_price_sgd: number | null;
  unit_types: string[];
  reconciliation: Reconciliation;
  updated_at: string;
}

export interface UnitMix {
  [unitType: string]: number;
}

export interface PriceRange {
  [unitType: string]: [number, number];
}

export interface AmenitySummary {
  schools: number;
  malls: number;
  parks: number;
  hawker: number;
}

export interface BtoProject {
  id: string;
  launch: string;
  town: string;
  project_name: string;
  classification: string | null;
  lat: number;
  lng: number;
  unit_mix: UnitMix;
  est_price_range: PriceRange | null;
  swt: boolean;
  nearest_mrt: string | null;
  nearest_mrt_distance_m: number | null;
  amenity_summary: AmenitySummary | null;
  created_at: string;
}

export interface ScoreBreakdown {
  commute: { partner_a: number; partner_b: number };
  mrt: number;
  amenities: number;
  price: number;
  maturity: number;
}

export interface Score {
  couple_id: string;
  project_id: string;
  score: number;
  breakdown: ScoreBreakdown;
  llm_reasoning: string | null;
  computed_at: string;
}

export interface RankedProject extends BtoProject {
  score: number;
  breakdown: ScoreBreakdown;
  llm_reasoning: string | null;
}
