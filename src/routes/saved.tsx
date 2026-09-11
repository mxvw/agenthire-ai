import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";

import { JobCard } from "@/components/job-card";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { getJob, matchScore, resume } from "@/lib/data";
import { useSavedJobs } from "@/lib/saved";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved roles — AgentHire AI" },
      {
        name: "description",
        content: "Your shortlisted roles, kept in one place with live AI match scores.",
      },
      { property: "og:title", content: "Saved roles — AgentHire AI" },
      { property: "og:description", content: "Your shortlisted roles with live match scores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { saved } = useSavedJobs();
  const jobs = saved.map(getJob).filter((j): j is NonNullable<typeof j> => Boolean(j));

  return (
    <PageShell
      icon={<Bookmark className="size-3.5" />}
      title="Saved roles"
      description="Your shortlist. Saved locally to this browser until an account is connected."
    >
      {jobs.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Bookmark roles from the job list to build a shortlist.
          </p>
          <Button asChild className="mt-4">
            <Link to="/jobs">Browse roles</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job, i) => (
            <JobCard key={job.id} job={job} score={matchScore(resume.skills, job).score} index={i} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
