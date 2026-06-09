/**
 * Enrich BTO projects with OneMap data:
 *   - nearest MRT station + distance
 *   - amenity counts within 1km (placeholder; expand to use OneMap themes)
 *
 * Run: pnpm enrich   (or `npx tsx scripts/enrich-locations.ts`)
 */

import "dotenv/config";
import { createServiceClient } from "../src/lib/supabase/service";
import { nearbyMrt } from "../src/lib/onemap";

async function main() {
  const supabase = createServiceClient();
  const { data: projects, error } = await supabase
    .from("bto_projects")
    .select("*");
  if (error || !projects) throw error;

  console.log(`Enriching ${projects.length} projects...`);

  for (const project of projects) {
    try {
      const mrts = await nearbyMrt(project.lat, project.lng, 2000);
      const nearest = mrts.sort((a, b) => a.distanceM - b.distanceM)[0];

      if (nearest) {
        const { error: updateErr } = await supabase
          .from("bto_projects")
          .update({
            nearest_mrt: nearest.name,
            nearest_mrt_distance_m: nearest.distanceM,
          })
          .eq("id", project.id);
        if (updateErr) {
          console.error(`  ✗ ${project.project_name}: ${updateErr.message}`);
        } else {
          console.log(
            `  ✓ ${project.project_name} → ${nearest.name} (${nearest.distanceM}m)`,
          );
        }
      } else {
        console.log(`  ? ${project.project_name} → no MRT within 2km`);
      }

      // Politeness delay so OneMap doesn't rate-limit
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(
        `  ✗ ${project.project_name}: ${e instanceof Error ? e.message : "unknown error"}`,
      );
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
