import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";

import { JobCard } from "@/components/job-card";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useSavedJobs } from "@/lib/saved";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved roles — AgentHire AI" },
      {
        name: "description",
        content:
          "Your shortlisted roles, kept in one place with live AI match scores.",
      },
      {
        property: "og:title",
        content: "Saved roles — AgentHire AI",
      },
      {
        property: "og:description",
        content: "Your shortlisted roles with live match scores.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { saved } = useSavedJobs();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSavedJobs = async () => {
      setLoading(true);
      setError("");

      if (saved.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
            id,
            title,
            company,
            location,
            work_mode,
            employment_type,
            seniority,
            salary_min,
            salary_max,
            description,
            skills,
            created_at,
            owner_id,
            company_id
          `,
        )
        .in("id", saved);

      if (error) {
        console.error("Saved jobs error:", error);
        setError("Saqlangan vakansiyalarni yuklashda xatolik yuz berdi.");
        setJobs([]);
      } else {
        // localStorage'dagi tartibni saqlab qolamiz
        const orderedJobs = saved
          .map((id) => data?.find((job) => job.id === id))
          .filter(Boolean);

        setJobs(orderedJobs);
      }

      setLoading(false);
    };

    loadSavedJobs();
  }, [saved]);

  return (
    <PageShell
      icon={<Bookmark className="size-3.5" />}
      title="Saved roles"
      description="Your saved vacancies."
    >
      {loading
        ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="panel h-52 animate-pulse bg-muted/30"
              />
            ))}
          </div>
        )
        : error
        ? (
          <div className="panel p-10 text-center">
            <p className="text-sm text-destructive">{error}</p>

            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Qayta urinish
            </Button>
          </div>
        )
        : jobs.length === 0
        ? (
          <div className="panel p-12 text-center">
            <Bookmark className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-4 text-sm text-muted-foreground">
              Nothing saved yet. Bookmark roles from the job list to build a
              shortlist.
            </p>

            <Button asChild className="mt-4">
              <Link to="/jobs">Browse roles</Link>
            </Button>
          </div>
        )
        : (
          <div className="grid gap-4 lg:grid-cols-2">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
              />
            ))}
          </div>
        )}
    </PageShell>
  );
}
