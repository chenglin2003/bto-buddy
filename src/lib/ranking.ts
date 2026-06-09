import type {
  BtoProject,
  Location,
  Preferences,
  RankedProject,
  ScoreBreakdown,
} from "@/types";

/**
 * Haversine distance in metres between two lat/lng points.
 * Used as a fast proxy when we don't have OneMap routing data cached.
 */
export function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Convert a metric value into a 0–100 sub-score using a piecewise curve.
 * The "ideal" value scores 100; "tolerable" scores 50; "bad" scores 0.
 */
function curveScore(value: number, ideal: number, tolerable: number, bad: number): number {
  if (value <= ideal) return 100;
  if (value >= bad) return 0;
  if (value <= tolerable) {
    // Linear from 100 → 50 between ideal and tolerable
    return 100 - ((value - ideal) / (tolerable - ideal)) * 50;
  }
  // Linear from 50 → 0 between tolerable and bad
  return 50 - ((value - tolerable) / (bad - tolerable)) * 50;
}

/** Commute score: lower is better. Tuned for Singapore public transport. */
function commuteScore(distanceM: number): number {
  // Straight-line distance proxy. Real routing will refine this.
  // 5km ≈ ~25 min PT, 15km ≈ ~50 min PT (rough but workable).
  return curveScore(distanceM, 3000, 8000, 18000);
}

/** MRT score: distance from project to nearest MRT. */
function mrtScore(distanceM: number | null): number {
  if (distanceM == null) return 50; // unknown
  return curveScore(distanceM, 300, 800, 1800);
}

/** Amenity score from counts within radius. */
function amenityScore(amenities: {
  schools: number;
  malls: number;
  parks: number;
  hawker: number;
} | null): number {
  if (!amenities) return 50;
  // Weighted sum; cap at 100
  const raw =
    amenities.schools * 8 +
    amenities.malls * 15 +
    amenities.parks * 6 +
    amenities.hawker * 10;
  return Math.min(100, raw);
}

/** Price score against a couple's budget cap. */
function priceScore(
  unitMix: Record<string, number>,
  estPriceRange: Record<string, [number, number]> | null,
  preferredUnits: string[],
  maxPriceSgd: number | null,
): number {
  if (!maxPriceSgd) return 70; // No cap set; assume neutral-positive
  if (!estPriceRange) return 60;

  const availableTargets = preferredUnits.filter(
    (u) => (unitMix[u] ?? 0) > 0 && estPriceRange[u],
  );
  if (availableTargets.length === 0) return 30;

  // Use the lowest median across preferred unit types
  const medians = availableTargets.map((u) => {
    const [lo, hi] = estPriceRange[u];
    return (lo + hi) / 2;
  });
  const bestMedian = Math.min(...medians);

  if (bestMedian <= maxPriceSgd * 0.85) return 100;
  if (bestMedian <= maxPriceSgd) return 80;
  if (bestMedian <= maxPriceSgd * 1.15) return 50;
  return 15;
}

/**
 * Maturity / classification score.
 * Plus & Prime estates are more mature with better amenities but come with restrictions.
 * Standard estates are typically newer towns.
 */
function maturityScore(classification: string | null, town: string): number {
  const matureTowns = new Set([
    "Ang Mo Kio", "Bedok", "Bishan", "Bukit Merah", "Clementi",
    "Geylang", "Kallang", "Marine Parade", "Pasir Ris", "Queenstown",
    "Serangoon", "Tampines", "Toa Payoh", "Bukit Timah", "Central",
  ]);
  let base = matureTowns.has(town) ? 80 : 50;
  if (classification === "Prime") base = Math.max(base, 85);
  if (classification === "Plus") base = Math.max(base, 70);
  return base;
}

interface PartnerContext {
  userId: string;
  preferences: Preferences;
  locations: Location[];
}

/**
 * Score one partner's view of one project.
 * Returns sub-scores in 0–100.
 */
function scoreForPartner(
  project: BtoProject,
  partner: PartnerContext,
): {
  commute: number;
  mrt: number;
  amenities: number;
  price: number;
  maturity: number;
  weighted: number;
} {
  const projLoc = { lat: project.lat, lng: project.lng };

  // Commute: weighted average over partner's locations (workplaces, parents, etc.)
  let commute = 50;
  if (partner.locations.length > 0) {
    let totalW = 0;
    let totalScore = 0;
    for (const loc of partner.locations) {
      const d = haversineM(projLoc, { lat: loc.lat, lng: loc.lng });
      totalScore += commuteScore(d) * loc.weight;
      totalW += loc.weight;
    }
    commute = totalW > 0 ? totalScore / totalW : 50;
  }

  const mrt = mrtScore(project.nearest_mrt_distance_m);
  const amenities = amenityScore(project.amenity_summary);
  const price = priceScore(
    project.unit_mix,
    project.est_price_range,
    partner.preferences.unit_types,
    partner.preferences.max_price_sgd,
  );
  const mat = maturityScore(project.classification, project.town);

  const p = partner.preferences;
  const totalW = p.w_commute + p.w_mrt + p.w_amenities + p.w_price + p.w_maturity || 1;
  const weighted =
    (commute * p.w_commute +
      mrt * p.w_mrt +
      amenities * p.w_amenities +
      price * p.w_price +
      mat * p.w_maturity) /
    totalW;

  return { commute, mrt, amenities, price, maturity: mat, weighted };
}

/**
 * Reconcile two partners' scores into a single couple score.
 * - average: simple mean (egalitarian)
 * - max_pain: take the lower score (no flat gets picked if one partner hates it)
 * - weighted: average weighted by each partner's preference intensity
 */
function reconcile(a: number, b: number | null, mode: string): number {
  if (b == null) return a;
  if (mode === "max_pain") return Math.min(a, b);
  if (mode === "weighted") return 0.55 * Math.max(a, b) + 0.45 * Math.min(a, b);
  return (a + b) / 2;
}

export function rankProjects(
  projects: BtoProject[],
  partners: PartnerContext[],
): RankedProject[] {
  if (partners.length === 0) return [];

  const reconciliationMode = partners[0].preferences.reconciliation;

  const ranked: RankedProject[] = projects
    .filter((p) => {
      // Hard filter: at least one preferred unit type must be available
      const prefs = partners[0].preferences.unit_types;
      return prefs.some((u) => (p.unit_mix[u] ?? 0) > 0);
    })
    .map((project) => {
      const partnerScores = partners.map((partner) =>
        scoreForPartner(project, partner),
      );
      const a = partnerScores[0];
      const b = partnerScores[1];

      const overall = reconcile(a.weighted, b?.weighted ?? null, reconciliationMode);

      const breakdown: ScoreBreakdown = {
        commute: {
          partner_a: Math.round(a.commute),
          partner_b: b ? Math.round(b.commute) : 0,
        },
        mrt: Math.round(a.mrt),
        amenities: Math.round(a.amenities),
        price: Math.round(reconcile(a.price, b?.price ?? null, reconciliationMode)),
        maturity: Math.round(a.maturity),
      };

      return {
        ...project,
        score: Math.round(overall * 100) / 100,
        breakdown,
        llm_reasoning: null,
      };
    })
    .sort((x, y) => y.score - x.score);

  return ranked;
}

/**
 * Calculate "disagreement" — projects where partners diverge the most.
 * Useful for the dual-partner view.
 */
export function findDisagreements(
  projects: BtoProject[],
  partners: PartnerContext[],
): Array<{ project: BtoProject; gap: number; favoredBy: string }> {
  if (partners.length < 2) return [];

  return projects
    .map((project) => {
      const a = scoreForPartner(project, partners[0]);
      const b = scoreForPartner(project, partners[1]);
      const gap = Math.abs(a.weighted - b.weighted);
      const favoredBy = a.weighted > b.weighted ? partners[0].userId : partners[1].userId;
      return { project, gap, favoredBy };
    })
    .filter((d) => d.gap > 15)
    .sort((x, y) => y.gap - x.gap)
    .slice(0, 5);
}
