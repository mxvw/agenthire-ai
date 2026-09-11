import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarCheck,
  Clock3,
  ListChecks,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Application tracker — AgentHire AI" },
      {
        name: "description",
        content:
          "Track every application stage from submitted to offer, with match scores, recruiter notes and scheduled interviews in one timeline.",
      },
      { property: "og:title", content: "Application tracker — AgentHire AI" },
      {
        property: "og:description",
        content:
          "Stage-by-stage application status, match scores and interview slots.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

const stageTone: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  screening: "bg-chart-2/20 text-chart-2",
  interview: "bg-signal/20 text-signal",
  offer: "bg-primary/20 text-primary",
  hired: "bg-primary/25 text-primary",
  rejected: "bg-destructive/20 text-destructive",
};

const stageLabels: Record<string, string> = {
  submitted: "Submitted",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

type Application = {
  id: string;
  user_id: string;
  job_id: string;
  stage: string;
  match_score: number | null;

  // AI Matching
  ai_score: number | null;
  ai_notes: string | null;

  notes: string | null;
  interview_at: string | null;
  created_at: string;

  jobs: {
    id: string;
    title: string;
    company: string;
    location?: string | null;
    work_mode?: string | null;
  } | null;
};

function formatInterviewDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleString("uz-UZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAiScoreLabel(score: number) {
  if (score >= 80) return "Excellent match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Moderate match";
  return "Low match";
}

function getAiScoreTone(score: number) {
  if (score >= 80) {
    return "bg-primary/15 text-primary border-primary/20";
  }

  if (score >= 60) {
    return "bg-signal/15 text-signal border-signal/20";
  }

  if (score >= 40) {
    return "bg-chart-2/15 text-chart-2 border-chart-2/20";
  }

  return "bg-muted text-muted-foreground border-border";
}

function ApplicationsPage() {
  const navigate = useNavigate();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadApplications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        navigate({
          to: "/auth",
          search: {
            redirect: "/applications",
          },
        });
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          user_id,
          job_id,
          stage,
          match_score,
          ai_score,
          ai_notes,
          notes,
          interview_at,
          created_at,
          jobs(
            id,
            title,
            company,
            location,
            work_mode
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Applications loading error:", error);
      } else {
        setApps((data ?? []) as unknown as Application[]);
      }

      setLoading(false);
    }

    loadApplications();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const scheduledInterviews = apps.filter(
    (application) =>
      application.stage === "interview" && application.interview_at,
  );

  return (
    <PageShell
      icon={<ListChecks className="size-3.5" />}
      title="Your applications"
      description="Every submission AgentHire is tracking for you, newest first."
      action={
        <Button asChild variant="secondary">
          <Link to="/jobs">Find more roles</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">
          Applications yuklanmoqda...
        </div>
      ) : apps.length === 0 ? (
        <div className="panel py-10 text-center">
          <p className="font-medium">Hozircha application yo‘q.</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Jobs sahifasidan vakansiyaga ariza yuborishingiz mumkin.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scheduled Interviews */}
          {scheduledInterviews.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CalendarCheck className="size-4 text-signal" />

                <h2 className="font-display text-lg font-semibold">
                  Interview Scheduled
                </h2>

                <Badge className="bg-signal/20 text-signal">
                  {scheduledInterviews.length}
                </Badge>
              </div>

              <div className="grid gap-4">
                {scheduledInterviews.map((application) => {
                  const job = application.jobs;

                  return (
                    <div
                      key={`interview-${application.id}`}
                      className="panel border-signal/30 bg-signal/5 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-signal/15 text-signal">
                            <CalendarCheck className="size-5" />
                          </span>

                          <div>
                            <Link
                              to="/jobs/$jobId"
                              params={{ jobId: application.job_id }}
                              className="font-semibold hover:text-primary"
                            >
                              {job?.title ?? "Unknown job"}
                            </Link>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {job?.company ?? "Unknown company"}
                            </p>
                          </div>
                        </div>

                        <Badge className="bg-signal/20 text-signal">
                          Interview
                        </Badge>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                            <Clock3 className="size-3.5" />
                            Date & time
                          </div>

                          <p className="mt-2 text-sm font-medium capitalize">
                            {formatInterviewDate(
                              application.interview_at!,
                            )}
                          </p>
                        </div>

                        {(job?.location || job?.work_mode) && (
                          <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                              <MapPin className="size-3.5" />
                              Work details
                            </div>

                            <p className="mt-2 text-sm font-medium">
                              {[job.location, job.work_mode]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        )}
                      </div>

                      {application.notes && (
                        <div className="mt-4 rounded-lg border border-border/60 bg-background/50 p-4">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Recruiter note
                          </p>

                          <p className="mt-2 text-sm leading-6">
                            {application.notes}
                          </p>
                        </div>
                      )}

                      <p className="mt-4 text-xs text-muted-foreground">
                        Interview vaqti recruiter tomonidan belgilangan.
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Applications */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="size-4 text-primary" />

              <h2 className="font-display text-lg font-semibold">
                All Applications
              </h2>
            </div>

            <div className="grid gap-4">
              {apps.map((a) => {
                const job = a.jobs;

                // New AI score exists for new applications.
                // For old applications, fallback to match_score.
                const aiScore = a.ai_score ?? a.match_score ?? 0;

                return (
                  <div
                    key={a.id}
                    className="panel p-5"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Company */}
                      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-sm font-semibold text-primary">
                        {job?.company?.slice(0, 2).toUpperCase() ?? "CO"}
                      </span>

                      {/* Job info */}
                      <div className="min-w-[220px] flex-1">
                        <Link
                          to="/jobs/$jobId"
                          params={{ jobId: a.job_id }}
                          className="font-semibold hover:text-primary"
                        >
                          {job?.title ?? "Unknown job"}
                        </Link>

                        <p className="text-sm text-muted-foreground">
                          {job?.company ?? "Unknown company"} · applied{" "}
                          {new Date(a.created_at).toLocaleDateString()}
                        </p>

                        {a.notes && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a.notes}
                          </p>
                        )}

                        {a.interview_at && a.stage === "interview" && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-signal">
                            <CalendarCheck className="size-3.5" />

                            Interview:{" "}
                            {new Date(a.interview_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* AI Score */}
                      <div className="min-w-[125px] text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Sparkles className="size-3.5 text-primary" />

                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            AI Match
                          </p>
                        </div>

                        <p className="mt-1 font-display text-2xl font-semibold text-primary">
                          {aiScore}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {getAiScoreLabel(aiScore)}
                        </p>
                      </div>

                      {/* Stage */}
                      <Badge
                        className={`capitalize ${stageTone[a.stage] ??
                          "bg-muted text-muted-foreground"
                          }`}
                      >
                        {stageLabels[a.stage] ?? a.stage}
                      </Badge>
                    </div>

                    {/* AI Analysis */}
                    {a.ai_notes && (
                      <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                              <Sparkles className="size-4" />
                            </span>

                            <div>
                              <p className="text-sm font-semibold">
                                AI Match Analysis
                              </p>

                              <p className="text-xs text-muted-foreground">
                                AgentHire analyzed your skills against this
                                role.
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={getAiScoreTone(aiScore)}
                          >
                            {aiScore}% match
                          </Badge>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {a.ai_notes}
                        </p>
                      </div>
                    )}

                    {/* Old application notice */}
                    {!a.ai_notes && (
                      <div className="mt-4 rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          AI analysis is not available for this application.
                          This application was created before AI Matching was
                          enabled.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}