/**
 * Ingest the latest BTO launches.
 *
 * For now this is a stub — HDB doesn't publish upcoming-launch JSON via
 * data.gov.sg; the schedule comes from press releases on hdb.gov.sg.
 *
 * Two options to implement:
 *  1. Manual: edit supabase/migrations/0002_seed_bto_projects.sql when HDB
 *     announces the next exercise (recommended for v0.1).
 *  2. Scrape: fetch https://www.hdb.gov.sg/.../press-releases and parse
 *     project announcements. Add as a future enhancement.
 *
 * Existing-flats endpoints on data.gov.sg (already-built blocks):
 *   - d_16b157c52ed637edd6ba1232e026258d  (HDB Existing Building GeoJSON)
 *   - d_17f5382f26140b1fdae0ba2ef6239d2f  (HDB Property Information)
 *
 * These are useful for context (resale comparators, mature-estate inference)
 * but don't list upcoming BTO launches.
 */

import "dotenv/config";

async function main() {
  console.log("Stub: edit supabase/migrations/0002_seed_bto_projects.sql with");
  console.log("the latest HDB launch announcement, then run it in Supabase.");
  console.log("See hdb.gov.sg/about-us/news-and-publications/press-releases");
}

main();
