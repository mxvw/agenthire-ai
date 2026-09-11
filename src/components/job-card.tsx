import { Link } from "@tanstack/react-router";
import { Bookmark, BriefcaseBusiness, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSalary, getCompany, relativeDay, type Job } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useSavedJobs } from "@/lib/saved";
import { cn } from "@/lib/utils";

export function MatchRing({ score, size = 44 }: { score: number; size?: number }) {
  const tone = score >= 80 ? "text-primary" : score >= 60 ? "text-signal" : "text-muted-foreground";
  return (
    <div
      className={cn("relative grid shrink-0 place-items-center rounded-full", tone)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(currentColor ${score * 3.6}deg, color-mix(in oklab, currentColor 14%, transparent) 0deg)`,
      }}
      aria-label={`Match score ${score} percent`}
    >
      <span className="grid size-[78%] place-items-center rounded-full bg-card text-[11px] font-semibold text-foreground">
        {score}
      </span>
    </div>
  );
}

export function JobCard({ job, score, index = 0 }: { job: Job; score?: number; index?: number }) {
  const company = getCompany(job.companyId);
  const { isSaved, toggle } = useSavedJobs();
  const { t } = useI18n();
  const saved = isSaved(job.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
      className="group panel p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-sm font-semibold text-primary">
          {company?.logo}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">
                <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="hover:text-primary">
                  {job.title}
                </Link>
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {company?.name} · {relativeDay(job.postedAt)}
              </p>
            </div>
            {typeof score === "number" && <MatchRing score={score} />}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((s) => (
              <Badge key={s} variant="secondary" className="font-normal">
                {s}
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5 capitalize">
              <BriefcaseBusiness className="size-3.5" /> {job.employmentType}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" /> {job.applicants} applicants
            </span>
            <span className="font-medium text-foreground">{formatSalary(job)}</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                {t("cta.details")}
              </Link>
            </Button>
            <Button
              size="sm"
              variant={saved ? "secondary" : "ghost"}
              onClick={() => toggle(job.id)}
              className="gap-1.5"
            >
              <Bookmark className={cn("size-4", saved && "fill-current")} />
              {saved ? t("cta.saved") : t("cta.save")}
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
