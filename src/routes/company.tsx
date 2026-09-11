import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company hiring dashboard — AgentHire AI" },
      {
        name: "description",
        content:
          "Manage open roles, review candidates and track your hiring pipeline from one dashboard.",
      },
      {
        property: "og:title",
        content: "Company hiring dashboard — AgentHire AI",
      },
      {
        property: "og:description",
        content:
          "Open roles, candidates and hiring pipeline in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyPage,
});

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  work_mode: string | null;
  employment_type: string | null;
  seniority: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
};

type Application = {
  id: string;
  user_id: string;
  job_id: string;
  stage: string;
  match_score: number | null;
  interview_at: string | null;
  created_at: string;
  job?: Job | null;
};

const stageLabels: Record<string, string> = {
  submitted: "Submitted",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const stageTone: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  screening: "bg-chart-2/20 text-chart-2",
  interview: "bg-signal/20 text-signal",
  offer: "bg-primary/20 text-primary",
  hired: "bg-primary/25 text-primary",
  rejected: "bg-destructive/20 text-destructive",
};

function formatSalary(job: Job) {
  if (job.salary_min == null && job.salary_max == null) {
    return "Salary not specified";
  }

  if (job.salary_min != null && job.salary_max != null) {
    return `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`;
  }

  if (job.salary_min != null) {
    return `From $${job.salary_min.toLocaleString()}`;
  }

  return `Up to $${job.salary_max!.toLocaleString()}`;
}

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatInterviewDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("uz-UZ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CompanyPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        navigate({
          to: "/auth",
          search: {
            redirect: "/company",
          },
        });
        return;
      }

      // 1. Get jobs owned by the current employer
      const { data: jobData, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          company,
          location,
          work_mode,
          employment_type,
          seniority,
          salary_min,
          salary_max,
          created_at
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (jobsError) {
        console.error("Company jobs loading error:", jobsError);
        setJobs([]);
        setApplications([]);
        setLoading(false);
        return;
      }

      const ownedJobs = (jobData ?? []) as Job[];
      setJobs(ownedJobs);

      // There are no applications if the company has no jobs.
      if (ownedJobs.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // 2. Get applications for those jobs
      const jobIds = ownedJobs.map((job) => job.id);

      const { data: applicationData, error: applicationsError } =
        await supabase
          .from("applications")
          .select(`
            id,
            user_id,
            job_id,
            stage,
            match_score,
            interview_at,
            created_at
          `)
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

      if (!mounted) return;

      if (applicationsError) {
        console.error(
          "Company applications loading error:",
          applicationsError,
        );
        setApplications([]);
      } else {
        const jobMap = new Map(
          ownedJobs.map((job) => [job.id, job]),
        );

        const combinedApplications = (
          (applicationData ?? []) as Omit<Application, "job">[]
        ).map((application) => ({
          ...application,
          job: jobMap.get(application.job_id) ?? null,
        }));

        setApplications(combinedApplications);
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const stats = useMemo(() => {
    return {
      openRoles: jobs.length,
      applications: applications.length,
      interviews: applications.filter(
        (application) => application.stage === "interview",
      ).length,
      offers: applications.filter(
        (application) => application.stage === "offer",
      ).length,
      hired: applications.filter(
        (application) => application.stage === "hired",
      ).length,
      rejected: applications.filter(
        (application) => application.stage === "rejected",
      ).length,
      screening: applications.filter(
        (application) => application.stage === "screening",
      ).length,
      submitted: applications.filter(
        (application) => application.stage === "submitted",
      ).length,
    };
  }, [jobs, applications]);

  const pipeline = useMemo(() => {
    const stages = [
      "submitted",
      "screening",
      "interview",
      "offer",
      "hired",
      "rejected",
    ];

    return stages.map((stage) => ({
      stage,
      count: applications.filter(
        (application) => application.stage === stage,
      ).length,
    }));
  }, [applications]);

  const recentApplications = applications.slice(0, 5);

  return (
    <PageShell
      icon={<Building2 className="size-3.5" />}
      title="Hiring dashboard"
      description="Manage your jobs, track candidates and monitor your hiring pipeline."
      action={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/company-my-jobs">
              <BriefcaseBusiness className="mr-2 size-4" />
              My Jobs
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link to="/company-jobs">
              <BriefcaseBusiness className="mr-2 size-4" />
              Post Job
            </Link>
          </Button>

          <Button asChild>
            <Link to="/company-applications">
              <Users className="mr-2 size-4" />
              View applications
            </Link>
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Company dashboard yuklanmoqda...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Open roles
                </p>

                <BriefcaseBusiness className="size-4 text-primary" />
              </div>

              <p className="mt-2 font-display text-3xl font-semibold text-primary">
                {stats.openRoles}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Active job postings
              </p>
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Applications
                </p>

                <Users className="size-4 text-primary" />
              </div>

              <p className="mt-2 font-display text-3xl font-semibold text-primary">
                {stats.applications}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Total candidates
              </p>
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Interviews
                </p>

                <CalendarCheck className="size-4 text-signal" />
              </div>

              <p className="mt-2 font-display text-3xl font-semibold text-signal">
                {stats.interviews}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Candidates in interview
              </p>
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Hired
                </p>

                <Clock3 className="size-4 text-primary" />
              </div>

              <p className="mt-2 font-display text-3xl font-semibold text-primary">
                {stats.hired}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Successful hires
              </p>
            </div>
          </div>

          {/* Empty state */}
          {jobs.length === 0 ? (
            <div className="panel p-8 text-center">
              <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground" />

              <h2 className="mt-4 text-lg font-semibold">
                No jobs yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                You don't have any job postings yet. Create a job to start
                receiving applications.
              </p>

              <Button asChild className="mt-5">
                <Link to="/company-jobs">
                  <BriefcaseBusiness className="mr-2 size-4" />
                  Post your first job
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Jobs + Pipeline */}
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <section className="panel p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Your open roles
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Jobs owned by your company account.
                      </p>
                    </div>

                    <Badge variant="secondary">
                      {jobs.length} roles
                    </Badge>
                  </div>

                  <div className="mt-5 divide-y divide-border">
                    {jobs.map((job) => {
                      const jobApplications = applications.filter(
                        (application) => application.job_id === job.id,
                      );

                      return (
                        <div
                          key={job.id}
                          className="flex flex-wrap items-center gap-4 py-4"
                        >
                          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-sm font-semibold text-primary">
                            {job.company.slice(0, 2).toUpperCase()}
                          </span>

                          <div className="min-w-[200px] flex-1">
                            <p className="font-medium">
                              {job.title}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {job.location || "Location not specified"}
                              {job.work_mode
                                ? ` · ${job.work_mode}`
                                : ""}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatSalary(job)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold">
                              {jobApplications.length}
                            </p>

                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              applicants
                            </p>
                          </div>

                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                          >
                            <Link
                              to="/company-applications"
                              search={{ job: job.id }}
                            >
                              <ChevronRight className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Pipeline */}
                <aside className="panel p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-medium">
                        Hiring pipeline
                      </h2>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Current application stages
                      </p>
                    </div>

                    <Badge variant="secondary">
                      {applications.length}
                    </Badge>
                  </div>

                  {applications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No applications yet.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {pipeline.map((item) => {
                        const percentage =
                          applications.length > 0
                            ? (item.count / applications.length) * 100
                            : 0;

                        return (
                          <div key={item.stage}>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {stageLabels[item.stage] ?? item.stage}
                              </span>

                              <span>{item.count}</span>
                            </div>

                            <Progress
                              value={percentage}
                              className="mt-1.5"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Offers
                      </p>

                      <p className="mt-1 text-lg font-semibold text-primary">
                        {stats.offers}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Rejected
                      </p>

                      <p className="mt-1 text-lg font-semibold text-destructive">
                        {stats.rejected}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>

              {/* Recent candidates */}
              <section className="panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Recent candidates
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Latest applications received for your jobs.
                    </p>
                  </div>

                  <Button asChild variant="secondary" size="sm">
                    <Link to="/company-applications">
                      View all
                      <ChevronRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                </div>

                {recentApplications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Hozircha application yo‘q.
                  </div>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <div className="min-w-[620px]">
                      <div className="grid grid-cols-[1fr_1fr_100px_120px_140px] gap-4 border-b border-border px-3 pb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>Position</span>
                        <span>Company</span>
                        <span>Match</span>
                        <span>Stage</span>
                        <span>Applied</span>
                      </div>

                      <div className="divide-y divide-border">
                        {recentApplications.map((application) => (
                          <div
                            key={application.id}
                            className="grid grid-cols-[1fr_1fr_100px_120px_140px] items-center gap-4 px-3 py-4 text-sm"
                          >
                            <div className="truncate font-medium">
                              {application.job?.title ??
                                "Unknown job"}
                            </div>

                            <div className="truncate text-muted-foreground">
                              {application.job?.company ??
                                "Unknown company"}
                            </div>

                            <div>
                              <span className="font-display font-semibold text-primary">
                                {application.match_score ?? 0}
                              </span>
                            </div>

                            <div>
                              <Badge
                                className={
                                  stageTone[application.stage] ??
                                  "bg-muted text-muted-foreground"
                                }
                              >
                                {stageLabels[application.stage] ??
                                  application.stage}
                              </Badge>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {formatDate(application.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Upcoming interviews */}
              {applications.some(
                (application) =>
                  application.stage === "interview" &&
                  application.interview_at,
              ) && (
                  <section className="panel border-signal/30 bg-signal/5 p-6">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="size-4 text-signal" />

                      <h2 className="text-lg font-semibold">
                        Upcoming interviews
                      </h2>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {applications
                        .filter(
                          (application) =>
                            application.stage === "interview" &&
                            application.interview_at,
                        )
                        .sort(
                          (a, b) =>
                            new Date(
                              a.interview_at!,
                            ).getTime() -
                            new Date(
                              b.interview_at!,
                            ).getTime(),
                        )
                        .slice(0, 4)
                        .map((application) => (
                          <div
                            key={application.id}
                            className="rounded-lg border border-border/60 bg-background/50 p-4"
                          >
                            <p className="font-medium">
                              {application.job?.title ??
                                "Unknown job"}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {application.job?.company ??
                                "Unknown company"}
                            </p>

                            <div className="mt-3 flex items-center gap-2 text-sm text-signal">
                              <CalendarCheck className="size-4" />

                              {formatInterviewDate(
                                application.interview_at!,
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>
                )}
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
