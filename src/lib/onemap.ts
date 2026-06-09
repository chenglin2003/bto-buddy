/**
 * OneMap API client.
 * Docs: https://www.onemap.gov.sg/apidocs/
 *
 * - Search (geocoding) is public but rate-limited; for production, register a token.
 * - Routing & Nearby Transportation require token-based auth.
 *
 * NOTE: OneMap migrated from developers.onemap.sg to www.onemap.gov.sg.
 * The /api/common/elastic/search endpoint is confirmed. For auth, routing, and
 * nearby-services, double-check the exact paths against the current docs after
 * you register — these were derived from the migration pattern and may need
 * minor adjustment (the docs require an account to view fully).
 */

const ONEMAP_BASE = "https://www.onemap.gov.sg/api";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const email = process.env.ONEMAP_EMAIL;
  const password = process.env.ONEMAP_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "OneMap credentials missing — set ONEMAP_EMAIL and ONEMAP_PASSWORD",
    );
  }

  const res = await fetch(`${ONEMAP_BASE}/auth/post/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`OneMap auth failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expiry_timestamp: string;
  };
  cachedToken = {
    token: data.access_token,
    // expiry_timestamp is in seconds
    expiresAt: parseInt(data.expiry_timestamp, 10) * 1000,
  };
  return cachedToken.token;
}

export interface SearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

/** Geocode an address or postal code. Returns best match or null. */
export async function geocode(query: string): Promise<{
  address: string;
  postal: string | null;
  lat: number;
  lng: number;
} | null> {
  const url = new URL(`${ONEMAP_BASE}/common/elastic/search`);
  url.searchParams.set("searchVal", query);
  url.searchParams.set("returnGeom", "Y");
  url.searchParams.set("getAddrDetails", "Y");
  url.searchParams.set("pageNum", "1");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { results: SearchResult[] };
  const top = data.results?.[0];
  if (!top) return null;

  return {
    address: top.ADDRESS,
    postal: top.POSTAL === "NIL" ? null : top.POSTAL,
    lat: parseFloat(top.LATITUDE),
    lng: parseFloat(top.LONGITUDE),
  };
}

export type RouteType = "drive" | "walk" | "cycle" | "pt";

/**
 * Compute travel time between two points.
 * For public transport ("pt"), additional params are required.
 * Returns total time in seconds and distance in metres.
 */
export async function getRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  routeType: RouteType = "pt",
): Promise<{ timeSec: number; distanceM: number } | null> {
  const token = await getToken();

  const url = new URL(`${ONEMAP_BASE}/public/routingsvc/route`);
  url.searchParams.set("start", `${start.lat},${start.lng}`);
  url.searchParams.set("end", `${end.lat},${end.lng}`);
  url.searchParams.set("routeType", routeType);

  if (routeType === "pt") {
    // Public transport requires extra params
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    url.searchParams.set(
      "date",
      `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${now.getFullYear()}`,
    );
    url.searchParams.set("time", `${pad(now.getHours())}:${pad(now.getMinutes())}:00`);
    url.searchParams.set("mode", "TRANSIT");
    url.searchParams.set("maxWalkDistance", "1000");
    url.searchParams.set("numItineraries", "1");
  }

  const res = await fetch(url, {
    headers: { Authorization: token },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();

  if (routeType === "pt") {
    const itin = data?.plan?.itineraries?.[0];
    if (!itin) return null;
    return {
      timeSec: Math.round(itin.duration),
      distanceM: Math.round(itin.walkDistance + (itin.transitTime ? 0 : 0)),
    };
  }
  if (typeof data?.route_summary?.total_time === "number") {
    return {
      timeSec: data.route_summary.total_time,
      distanceM: data.route_summary.total_distance,
    };
  }
  return null;
}

/** Find MRT/LRT stations within radius. */
export async function nearbyMrt(
  lat: number,
  lng: number,
  radiusM: number = 1500,
): Promise<Array<{ name: string; distanceM: number; lat: number; lng: number }>> {
  const token = await getToken();
  const url = new URL(`${ONEMAP_BASE}/public/nearbysvc/mrt`);
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", radiusM.toString());

  const res = await fetch(url, {
    headers: { Authorization: token },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.GeometryData?.Stations ?? []).map(
    (s: { STN_NAME: string; DISTANCE: string; X: string; Y: string }) => ({
      name: s.STN_NAME,
      distanceM: Math.round(parseFloat(s.DISTANCE)),
      lat: parseFloat(s.Y),
      lng: parseFloat(s.X),
    }),
  );
}
