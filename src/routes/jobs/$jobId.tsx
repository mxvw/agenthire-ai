import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MatchRing } from "@/components/job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { matchScore } from "@/lib/data";
import { useSavedJobs } from "@/lib/saved";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  work_mode: string;
  employment_type: string;
  seniority: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  skills: unknown;
  created_at: string;
};

type Resume = {
  id: string;
  full_name: string;
  headline: string;
  skills: unknown;
};

function parseSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string",
  );
}

function formatSalary(job: Job) {
  if (job.salary_min == null && job.salary_max == null) {
    return "Salary not specified";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });

  if (job.salary_min != null && job.salary_max != null) {
    return `$${formatter.format(job.salary_min)} – $${formatter.format(
      job.salary_max,
    )}`;
  }

  if (job.salary_min != null) {
    return `From $${formatter.format(job.salary_min)}`;
  }

  return `Up to $${formatter.format(job.salary_max!)}`;
}

function relativeDay(date: string) {
  const created = new Date(date);
  const now = new Date();

  const diff = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff <= 0) return "today";
  if (diff === 1) return "1 day ago";

  return `${diff} days ago`;
}

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();

  const { isSaved, toggle } = useSavedJobs();

  const [job, setJob] = useState<Job | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [related, setRelated] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: application, error: applicationError } =
            await supabase
              .from("applications")
              .select("id")
              .eq("user_id", user.id)
              .eq("job_id", jobId)
              .maybeSingle();

          if (applicationError) {
            console.error(
              "Application check error:",
              applicationError,
            );
          }

          setApplied(Boolean(application));
        } else {
          setApplied(false);
        }

        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .maybeSingle();

        if (jobError) {
          console.error("Job error:", jobError);
          toast.error("Failed to load vacancy");
          return;
        }

        if (!jobData) {
          setNotFound(true);
          return;
        }

        setJob(jobData);

        if (user) {
          const { data: resumeData, error: resumeError } =
            await supabase
              .from("resumes")
              .select("id, full_name, headline, skills")
              .eq("user_id", user.id)
              .maybeSingle();

          if (resumeError) {
            console.error("Resume error:", resumeError);
          }

          setResume(resumeData);
        } else {
          setResume(null);
        }

        const { data: relatedJobs, error: relatedError } =
          await supabase
            .from("jobs")
            .select("*")
            .neq("id", jobId)
            .order("created_at", { ascending: false })
            .limit(3);

        if (relatedError) {
          console.error("Related jobs error:", relatedError);
        }

        setRelated(relatedJobs ?? []);
      } catch (error) {
        console.error("Job detail error:", error);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="panel p-8">
          <p className="text-sm text-muted-foreground">
            Loading vacancy...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="panel p-8 text-center">
          <h1 className="text-xl font-semibold">
            Vacancy not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This vacancy may have been removed or no longer exists.
          </p>

          <Button asChild className="mt-5">
            <Link to="/jobs">Back to jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Job is guaranteed to exist from this point.
  const currentJob = job;

  const jobSkills = parseSkills(currentJob.skills);
  const resumeSkills = parseSkills(resume?.skills);

  const analysis = matchScore(resumeSkills, {
    id: currentJob.id,
    slug: currentJob.id,
    title: currentJob.title,
    companyId: "",
    location: currentJob.location,
    workMode: currentJob.work_mode as any,
    employmentType: currentJob.employment_type as any,
    seniority: currentJob.seniority as any,
    salaryMin: currentJob.salary_min ?? 0,
    salaryMax: currentJob.salary_max ?? 0,
    currency: "USD",
    postedAt: currentJob.created_at,
    description: currentJob.description,
    responsibilities: [],
    requirements: [],
    benefits: [],
    skills: jobSkills,
    applicants: 0,
    views: 0,
  });

  const saved = isSaved(currentJob.id);

  const defaultNote = resume
    ? `Hi ${currentJob.company} team,

I'm a ${resume.headline || "professional"} with experience across ${analysis.matched.slice(0, 3).join(", ") ||
    "relevant technologies"
    }. The ${currentJob.title} role looks closely aligned with my skills, and I'd love to discuss it further.

— ${resume.full_name}`
    : `Hi ${currentJob.company} team,

I'm interested in the ${currentJob.title} position and would love to learn more about the opportunity.

Best regards`;

  // --------------------------------------------
  // APPLY + AI MATCHING
  // --------------------------------------------
  async function handleApply(note: string): Promise<boolean> {
    setApplying(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate({
          to: "/auth",
          search: {
            redirect: `/jobs/${currentJob.id}`,
          },
        });

        return false;
      }

      if (!resume?.id) {
        toast.error("Please create your resume first.", {
          description:
            "You need a resume before applying for a job.",
        });

        return false;
      }

      // --------------------------------------------
      // CREATE APPLICATION
      // --------------------------------------------
      const { data: application, error: applicationError } =
        await supabase
          .from("applications")
          .insert({
            user_id: user.id,
            job_id: currentJob.id,
            resume_id: resume.id,
            stage: "submitted",
            match_score: analysis.score,
            ai_score: analysis.score,
            ai_notes: "AI analysis is being generated...",
            notes: note,
          })
          .select("id")
          .single();

      if (applicationError) {
        console.error(
          "Application error:",
          applicationError,
        );

        if (applicationError.code === "23505") {
          toast.error("You already applied for this job.");
          setApplied(true);
          return false;
        }

        toast.error("Failed to submit application", {
          description: applicationError.message,
        });

        return false;
      }

      if (!application) {
        toast.error("Application was not created.");
        return false;
      }

      console.log(
        "Application created:",
        application.id,
      );

      // --------------------------------------------
      // RUN AI MATCHING
      // --------------------------------------------
      const { data: aiData, error: aiError } =
        await supabase.functions.invoke(
          "analyze-application",
          {
            body: {
              application_id: application.id,
            },
          },
        );

      console.log("AI DATA:", aiData);
      console.log("AI ERROR:", aiError);

      if (aiError) {
        console.error("AI FUNCTION ERROR:", aiError);
        console.error(
          "AI FUNCTION ERROR MESSAGE:",
          aiError.message,
        );
        console.error(
          "AI FUNCTION ERROR CONTEXT:",
          aiError.context,
        );

        try {
          const errorBody = await aiError.context?.json?.();

          console.error(
            "AI FUNCTION ERROR BODY:",
            errorBody,
          );
        } catch (e) {
          console.error(
            "Could not read AI error body:",
            e,
          );
        }

        toast.warning("Application submitted", {
          description:
            "Your application was saved, but AI analysis could not be completed yet.",
        });
      } else {
        console.log(
          "AI Matching result:",
          aiData,
        );
      }

      setApplied(true);

      toast.success("Application submitted", {
        description: `Your application for ${currentJob.title} has been submitted.`,
      });

      return true;
    } catch (error) {
      console.error("Apply error:", error);

      toast.error(
        "Something went wrong while applying.",
      );

      return false;
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link
          to="/jobs"
          className="hover:text-foreground"
        >
          Jobs
        </Link>{" "}
        /{" "}
        <span className="text-foreground">
          {currentJob.title}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <header className="panel p-6">
            <div className="flex flex-wrap items-start gap-4">
              <span className="grid size-14 place-items-center rounded-xl bg-surface-2 font-display text-lg font-semibold text-primary">
                {currentJob.company
                  ?.charAt(0)
                  ?.toUpperCase() ?? "C"}
              </span>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold sm:text-3xl">
                  {currentJob.title}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {currentJob.company}
                </p>
              </div>

              <MatchRing
                score={analysis.score}
                size={56}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {currentJob.location}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                Posted {relativeDay(currentJob.created_at)}
              </span>

              <span className="inline-flex items-center gap-1.5 capitalize">
                <Building2 className="size-4" />
                {currentJob.work_mode} ·{" "}
                {currentJob.seniority}
              </span>

              <span className="font-semibold text-foreground">
                {formatSalary(currentJob)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <ApplyDialog
                jobTitle={currentJob.title}
                note={defaultNote}
                applied={applied}
                applying={applying}
                onApply={handleApply}
              />

              <Button
                variant={saved ? "secondary" : "outline"}
                onClick={() => toggle(currentJob.id)}
              >
                <Bookmark
                  className={cn(
                    "size-4",
                    saved && "fill-current",
                  )}
                />

                {saved ? "Saved" : "Save role"}
              </Button>

              <Button
                asChild
                variant="ghost"
              >
                <Link to="/applications">
                  <CalendarCheck className="size-4" />
                  Track applications
                </Link>
              </Button>
            </div>
          </header>

          <article className="panel space-y-6 p-6">
            <section>
              <h2 className="text-lg font-semibold">
                About the role
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {currentJob.description}
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-lg font-semibold">
                Skills required
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {jobSkills.length > 0 ? (
                  jobSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                    >
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No specific skills listed.
                  </span>
                )}
              </div>
            </section>
          </article>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">
              Similar roles
            </h2>

            <ul className="mt-4 divide-y divide-border">
              {related.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className="grid size-8 place-items-center rounded-md bg-surface-2 text-xs font-semibold text-primary">
                    {r.company
                      ?.charAt(0)
                      ?.toUpperCase() ?? "C"}
                  </span>

                  <Link
                    to="/jobs/$jobId"
                    params={{ jobId: r.id }}
                    className="font-medium hover:text-primary"
                  >
                    {r.title}
                  </Link>

                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatSalary(r)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="panel p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-primary" />
              Match breakdown
            </div>

            <p className="mt-3 text-4xl font-display font-semibold text-primary">
              {analysis.score}
              <span className="text-base text-muted-foreground">
                /100
              </span>
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Based on {analysis.matched.length} of{" "}
              {jobSkills.length} required skills covered by
              your profile.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Matched
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {analysis.matched.map((skill) => (
                    <Badge
                      key={skill}
                      className="gap-1 bg-primary/15 text-primary hover:bg-primary/20"
                    >
                      <CheckCircle2 className="size-3" />
                      {skill}
                    </Badge>
                  ))}

                  {analysis.matched.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      None yet
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Missing
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="gap-1"
                    >
                      <XCircle className="size-3" />
                      {skill}
                    </Badge>
                  ))}

                  {analysis.missing.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Full coverage
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-5 w-full"
            >
              <Link to="/resume">
                Improve my resume
              </Link>
            </Button>
          </div>

          <div className="panel p-6">
            <h3 className="text-sm font-medium">
              {currentJob.company}
            </h3>

            <dl className="mt-4 space-y-2 text-xs">
              <Row
                k="Work mode"
                v={currentJob.work_mode}
              />

              <Row
                k="Employment"
                v={currentJob.employment_type}
              />

              <Row
                k="Seniority"
                v={currentJob.seniority}
              />

              <Row
                k="Applicants"
                v="—"
              />

              <Row
                k="Posted"
                v={new Date(
                  currentJob.created_at,
                ).toLocaleDateString()}
              />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  k,
  v,
}: {
  k: string;
  v: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">
        {k}
      </dt>

      <dd className="text-right font-medium capitalize">
        {v}
      </dd>
    </div>
  );
}

function ApplyDialog({
  jobTitle,
  note,
  applied,
  applying,
  onApply,
}: {
  jobTitle: string;
  note: string;
  applied: boolean;
  applying: boolean;
  onApply: (note: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(note);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button disabled={applied}>
          {applied
            ? "Application sent"
            : "Apply now"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Apply — {jobTitle}
          </DialogTitle>

          <DialogDescription>
            AgentHire drafted this note from your resume
            and the role requirements. Edit anything before
            sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="note">
            Cover note
          </Label>

          <Textarea
            id="note"
            rows={9}
            value={currentNote}
            onChange={(e) =>
              setCurrentNote(e.target.value)
            }
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            disabled={applying}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            disabled={applying}
            onClick={async () => {
              const success = await onApply(
                currentNote,
              );

              if (success) {
                setOpen(false);
              }
            }}
          >
            {applying
              ? "Submitting..."
              : "Submit application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
