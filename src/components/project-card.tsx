import type { RankedProject } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: RankedProject;
  rank: number;
  partnerNames: string[];
}

export function ProjectCard({ project, rank, partnerNames }: ProjectCardProps) {
  const isTop = rank <= 3;
  const partnerA = partnerNames[0] ?? "You";
  const partnerB = partnerNames[1] ?? null;

  return (
    <article
      className={cn(
        "group relative border border-ink/10 bg-paper p-6 transition-all",
        "hover:border-ink/30 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]",
        isTop && "border-clay/30",
      )}
    >
      {/* Rank corner */}
      <div className="absolute -top-px -left-px flex">
        <div
          className={cn(
            "num text-xs px-2.5 py-1.5 border-r border-b",
            isTop
              ? "bg-clay text-paper border-clay"
              : "bg-paper-dim text-ink-muted border-ink/10",
          )}
        >
          #{rank}
        </div>
      </div>

      {/* Header */}
      <header className="mb-5 pl-10">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h3 className="font-display text-2xl tracking-tightest leading-tight">
            {project.project_name}
          </h3>
          <span className="num text-xs text-ink-muted whitespace-nowrap">
            {project.launch}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ink-soft">{project.town}</span>
          {project.classification && (
            <span
              className={cn(
                "stamp",
                project.classification === "Prime" && "border-clay/50 text-clay",
                project.classification === "Plus" && "border-ink/30 text-ink-soft",
                project.classification === "Standard" && "border-ink/15 text-ink-muted",
              )}
            >
              {project.classification}
            </span>
          )}
          {project.swt && (
            <span className="stamp border-leaf/40 text-leaf">SWT &lt;3yr</span>
          )}
        </div>
      </header>

      {/* Big score */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="num text-5xl text-ink leading-none">
          {project.score.toFixed(0)}
        </span>
        <span className="text-sm text-ink-muted">/ 100</span>
        <ScoreBar score={project.score} className="flex-1 ml-2" />
      </div>

      {/* AI reasoning if available */}
      {project.llm_reasoning && (
        <p className="mb-5 px-4 py-3 border-l-2 border-clay bg-clay-wash/40 text-sm text-ink-soft italic leading-relaxed font-display">
          {project.llm_reasoning}
        </p>
      )}

      {/* Sub-scores grid */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm">
        <SubScore
          label={`${partnerA}'s commute`}
          value={project.breakdown.commute.partner_a}
        />
        {partnerB && (
          <SubScore
            label={`${partnerB}'s commute`}
            value={project.breakdown.commute.partner_b}
          />
        )}
        <SubScore label="MRT access" value={project.breakdown.mrt} />
        <SubScore label="Amenities" value={project.breakdown.amenities} />
        <SubScore label="Price fit" value={project.breakdown.price} />
        <SubScore label="Estate maturity" value={project.breakdown.maturity} />
      </dl>

      {/* Footer details */}
      <footer className="pt-4 border-t border-ink/10 flex items-center justify-between text-xs text-ink-muted">
        <div className="flex items-center gap-3">
          {project.nearest_mrt ? (
            <span>
              <span className="text-ink">{project.nearest_mrt}</span>
              <span className="num ml-1">
                · {(project.nearest_mrt_distance_m! / 1000).toFixed(1)}km
              </span>
            </span>
          ) : (
            <span className="italic">MRT data not enriched</span>
          )}
        </div>
        <span className="num">
          {Object.entries(project.unit_mix)
            .map(([k, v]) => `${k.replace("-room", "R")}: ${v}`)
            .join(" · ")}
        </span>
      </footer>
    </article>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted truncate">{label}</dt>
      <dd className="flex items-center gap-2 shrink-0">
        <ScoreBar score={value} className="w-12 h-[2px]" />
        <span
          className={cn(
            "num text-xs w-7 text-right",
            value >= 70 ? "text-leaf" : value < 40 ? "text-rust" : "text-ink-soft",
          )}
        >
          {Math.round(value)}
        </span>
      </dd>
    </div>
  );
}

function ScoreBar({ score, className }: { score: number; className?: string }) {
  const color =
    score >= 70 ? "bg-leaf" : score < 40 ? "bg-rust" : "bg-clay";
  return (
    <div className={cn("h-[3px] bg-ink/10 overflow-hidden", className)}>
      <div
        className={cn("h-full transition-all", color)}
        style={{ width: `${Math.max(2, score)}%` }}
      />
    </div>
  );
}
