import Anthropic from "@anthropic-ai/sdk";
import type { Location, Preferences, RankedProject } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface PartnerInfo {
  displayName: string;
  preferences: Preferences;
  locations: Location[];
}

/**
 * Generate a short narrative (1-2 sentences) for each top-ranked project,
 * grounded in the actual preferences and locations of the couple.
 */
export async function explainTopRanked(
  topProjects: RankedProject[],
  partners: PartnerInfo[],
): Promise<Record<string, string>> {
  if (topProjects.length === 0) return {};

  const partnerSummaries = partners
    .map((p) => {
      const locs = p.locations
        .map((l) => `${l.label} (${l.kind}, weight ${l.weight}/10)`)
        .join(", ");
      const prefs = p.preferences;
      return `${p.displayName}: cares about commute=${prefs.w_commute}, MRT=${prefs.w_mrt}, amenities=${prefs.w_amenities}, price=${prefs.w_price}, maturity=${prefs.w_maturity}. Locations: ${locs || "none set"}. Max budget: ${prefs.max_price_sgd ? `$${prefs.max_price_sgd}` : "no cap"}. Prefers ${prefs.unit_types.join("/")}.`;
    })
    .join("\n");

  const projectSummaries = topProjects
    .map(
      (p, i) =>
        `${i + 1}. ${p.project_name} (${p.town}, ${p.classification ?? "?"}, ${p.launch}) — score ${p.score}/100. ` +
        `Nearest MRT: ${p.nearest_mrt ?? "unknown"} (${p.nearest_mrt_distance_m ?? "?"}m). ` +
        `Sub-scores: commute A=${p.breakdown.commute.partner_a}, commute B=${p.breakdown.commute.partner_b}, MRT=${p.breakdown.mrt}, amenities=${p.breakdown.amenities}, price=${p.breakdown.price}, maturity=${p.breakdown.maturity}.`,
    )
    .join("\n");

  const prompt = `You are a friendly housing advisor helping a Singapore couple choose a BTO flat.

The couple:
${partnerSummaries}

Their top-ranked options:
${projectSummaries}

For each project, write ONE punchy sentence (max 25 words) explaining why it ranks where it does, referencing specific factors that matter to *this* couple. Be specific — name the partner if a factor is theirs ("Sarah's commute"), name the MRT, name the budget. Don't be generic.

Return ONLY a JSON object mapping project_name to the sentence, no other text. Example:
{"Lakeview Vista": "Sarah's 22-min commute to Raffles Place and the $520k median price fit your budget cap perfectly."}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(text) as Record<string, string>;
  } catch {
    console.error("Failed to parse LLM reasoning JSON:", text);
    return {};
  }
}
