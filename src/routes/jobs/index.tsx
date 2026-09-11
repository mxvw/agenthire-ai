import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Briefcase, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { JobCard } from "@/components/job-card";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  matchScore,
  type EmploymentType,
  type Seniority,
  type WorkMode,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";

interface JobSearch {
  q?: string;
  location?: string;
  mode?: WorkMode | "any" | undefined;
  type?: EmploymentType | "any" | undefined;
  level?: Seniority | "any" | undefined;
}

function parseSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (skill): skill is string =>
      typeof skill === "string" && skill.trim().length > 0,
  );
}

export const Route = createFileRoute("/jobs/")({
  validateSearch: (s: Record<string, unknown>): JobSearch => {
    const result: JobSearch = {};

    if (typeof s["q"] === "string" && s["q"]) {
      result.q = s["q"];
    }

    if (typeof s["location"] === "string" && s["location"]) {
      result.location = s["location"];
    }

    if (
      typeof s["mode"] === "string" &&
      ["any", "remote", "hybrid", "onsite"].includes(s["mode"])
    ) {
      result.mode = s["mode"] as JobSearch["mode"];
    }

    if (
      typeof s["type"] === "string" &&
      ["any", "full-time", "part-time", "contract", "internship"].includes(
        s["type"],
      )
    ) {
      result.type = s["type"] as JobSearch["type"];
    }

    if (
      typeof s["level"] === "string" &&
      ["any", "junior", "mid", "senior", "lead"].includes(s["level"])
    ) {
      result.level = s["level"] as JobSearch["level"];
    }

    return result;
  },

  head: () => ({
    meta: [
      { title: "Browse open roles — AgentHire AI job search" },
      {
        name: "description",
        content:
          "Search engineering, design, data and product roles across the EU and CIS with explainable AI match scores against your resume.",
      },
      {
        property: "og:title",
        content: "Browse open roles — AgentHire AI",
      },
      {
        property: "og:description",
        content:
          "Filter roles by skill, location, work mode and salary, ranked by AI match score.",
      },
      { property: "og:type", content: "website" },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),

  component: JobsPage,
});

function JobsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [q, setQ] = useState(search.q ?? "");
  const [location, setLocation] = useState(search.location ?? "");
  const [mode, setMode] = useState<NonNullable<JobSearch["mode"]>>(
    search.mode ?? "any",
  );
  const [type, setType] = useState<NonNullable<JobSearch["type"]>>(
    search.type ?? "any",
  );
  const [level, setLevel] = useState<NonNullable<JobSearch["level"]>>(
    search.level ?? "any",
  );
  const [minSalary, setMinSalary] = useState(0);

  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setUserSkills([]);
            setLoadingSkills(false);
            setLoadingJobs(false);
          }

          navigate({
            to: "/auth",
            search: {
              redirect: "/jobs",
            },
          });

          return;
        }

        // Resume skills
        const { data: resumeData, error: resumeError } = await supabase
          .from("resumes")
          .select("skills")
          .eq("user_id", user.id)
          .maybeSingle();

        if (resumeError) {
          console.error("Failed to load resume skills:", resumeError);
        }

        if (mounted) {
          setUserSkills(parseSkills(resumeData?.skills));
          setLoadingSkills(false);
        }

        // Jobs from Supabase
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Failed to load jobs:", jobsError);

          if (mounted) {
            setJobsError("Failed to load jobs.");
            setJobs([]);
            setLoadingJobs(false);
          }

          return;
        }

        if (mounted) {
          setJobs(
            (jobsData ?? []).map((job) => ({
              ...job,
              skills: parseSkills(job.skills),
            })),
          );

          setLoadingJobs(false);
        }
      } catch (error) {
        console.error("Jobs/resume loading error:", error);

        if (mounted) {
          setUserSkills([]);
          setJobs([]);
          setLoadingSkills(false);
          setLoadingJobs(false);
          setJobsError("Something went wrong while loading jobs.");
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const results = useMemo(() => {
    const filtered = jobs.filter((job) => {
      const query = q.trim().toLowerCase();
      const jobTitle = String(job.title ?? "").toLowerCase();
      const company = String(job.company ?? "").toLowerCase();
      const jobLocation = String(job.location ?? "").toLowerCase();
      const description = String(job.description ?? "").toLowerCase();

      // Keyword
      if (
        query &&
        !jobTitle.includes(query) &&
        !company.includes(query) &&
        !description.includes(query) &&
        !parseSkills(job.skills).some((skill) =>
          skill.toLowerCase().includes(query),
        )
      ) {
        return false;
      }

      // Location
      if (
        location.trim() &&
        !jobLocation.includes(location.trim().toLowerCase())
      ) {
        return false;
      }

      // Work mode
      if (mode !== "any" && job.work_mode !== mode) {
        return false;
      }

      // Employment type
      if (type !== "any" && job.employment_type !== type) {
        return false;
      }

      // Seniority
      if (level !== "any" && job.seniority !== level) {
        return false;
      }

      // Salary
      if (
        minSalary > 0 &&
        Number(job.salary_max ?? 0) < minSalary
      ) {
        return false;
      }

      return true;
    });

    return filtered
      .map((job) => ({
        job,
        score: matchScore(userSkills, job).score,
      }))
      .sort((a, b) => b.score - a.score);
  }, [
    jobs,
    q,
    location,
    mode,
    type,
    level,
    minSalary,
    userSkills,
  ]);

  function commit() {
    const search: JobSearch = {};

    if (q) search.q = q;
    if (location) search.location = location;
    if (mode !== "any") search.mode = mode;
    if (type !== "any") search.type = type;
    if (level !== "any") search.level = level;

    navigate({
      to: "/jobs",
      search,
    });
  }

  return (
    <PageShell
      icon={<Briefcase className="size-3.5" />}
      title="Open roles"
      description="Every listing scored against your resume profile. Filters apply instantly; the URL keeps your search shareable."
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit space-y-5 p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="size-4 text-primary" />
            Filters
          </div>

          <Field label="Keyword">
            <div className="flex items-center gap-2 rounded-md border border-input px-2">
              <Search className="size-4 text-muted-foreground" />

              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onBlur={commit}
                placeholder="React, design, Payloop"
                className="border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </Field>

          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={commit}
              placeholder="Berlin, Remote, Tashkent"
            />
          </Field>

          <Field label="Work mode">
            <FilterSelect
              value={mode}
              onChange={(v) => setMode(v as typeof mode)}
              options={["any", "remote", "hybrid", "onsite"]}
            />
          </Field>

          <Field label="Employment type">
            <FilterSelect
              value={type}
              onChange={(v) => setType(v as typeof type)}
              options={[
                "any",
                "full-time",
                "part-time",
                "contract",
                "internship",
              ]}
            />
          </Field>

          <Field label="Seniority">
            <FilterSelect
              value={level}
              onChange={(v) => setLevel(v as typeof level)}
              options={["any", "junior", "mid", "senior", "lead"]}
            />
          </Field>

          <Field
            label={`Minimum top salary: ${minSalary.toLocaleString()}`}
          >
            <Slider
              value={[minSalary]}
              onValueChange={([v]) => setMinSalary(v ?? 0)}
              max={150000}
              step={5000}
            />
          </Field>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setQ("");
              setLocation("");
              setMode("any");
              setType("any");
              setLevel("any");
              setMinSalary(0);

              navigate({
                to: "/jobs",
                search: {},
              });
            }}
          >
            Reset filters
          </Button>
        </aside>

        <div>
          {loadingSkills || loadingJobs ? (
            <div className="panel mb-4 p-4 text-sm text-muted-foreground">
              Loading your resume and available jobs...
            </div>
          ) : userSkills.length === 0 ? (
            <div className="panel mb-4 p-4 text-sm text-muted-foreground">
              Your resume does not have any skills yet. Add skills to your
              resume to get more accurate job match scores.
            </div>
          ) : (
            <div className="panel mb-4 p-4 text-sm">
              <span className="text-muted-foreground">
                Matching jobs using your resume skills:
              </span>{" "}
              <span className="font-medium">
                {userSkills.join(", ")}
              </span>
            </div>
          )}
          
          {jobsError && (
            <div className="panel mb-4 p-4 text-sm text-destructive">
              {jobsError}
            </div>
          )}

          <p className="mb-4 text-sm text-muted-foreground">
            {results.length} role{results.length === 1 ? "" : "s"} found
          </p>

          <div className="grid gap-4">
            {results.map((r, i) => (
              <JobCard
                key={r.job.id}
                job={r.job}
                score={r.score}
                index={i}
              />
            ))}

            {results.length === 0 && (
              <div className="panel p-10 text-center text-sm text-muted-foreground">
                No roles match those filters yet. Try widening the location
                or clearing the salary floor.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full capitalize">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}