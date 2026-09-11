import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Briefcase,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  X,
  FileText,
  Clock3,
  CheckCircle2,
  UserCheck,
  Search,
  Shield,
  User,
  CalendarDays,
  Eye,
  MapPin,
  Building2,
  Target,
} from "lucide-react";

import { PageShell } from "@/components/site-shell";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: "/admin",
        },
      });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      throw redirect({
        to: "/",
      });
    }
  },

  head: () => ({
    meta: [
      { title: "Admin — AgentHire AI" },
      {
        name: "description",
        content:
          "Manage AgentHire AI jobs, applications and platform analytics.",
      },
      {
        property: "og:title",
        content: "Admin — AgentHire AI",
      },
      {
        property: "og:description",
        content:
          "Manage jobs, applications and platform analytics.",
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

  component: AdminPage,
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
  description: string | null;
  skills: string[] | null;
  created_at: string;
  owner_id: string | null;
};

type Application = {
  id: string;
  user_id: string;
  job_id: string;
  stage: string;
  match_score: number | null;
  ai_score: number | null;
  ai_notes: string | null;
  notes?: string | null;
  interview_at?: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  role: string | null;
};

type Resume = {
  id: string;
  user_id: string;
};

type UserRow = {
  id: string;
  role: string | null;
  hasResume: boolean;
  resumeId: string | null;
};

type ApplicationRow = Application & {
  job: Job | null;
  applicantHasResume: boolean;
};

type JobForm = {
  title: string;
  company: string;
  location: string;
  work_mode: string;
  employment_type: string;
  seniority: string;
  salary_min: string;
  salary_max: string;
  description: string;
  skills: string;
};

const emptyForm: JobForm = {
  title: "",
  company: "",
  location: "",
  work_mode: "remote",
  employment_type: "full-time",
  seniority: "junior",
  salary_min: "",
  salary_max: "",
  description: "",
  skills: "",
};

const stageLabels: Record<string, string> = {
  submitted: "Submitted",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const stageClasses: Record<string, string> = {
  submitted:
    "bg-muted text-muted-foreground",
  screening:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  interview:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  offer:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hired:
    "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected:
    "bg-red-500/10 text-red-600 dark:text-red-400",
};

function formatSalary(job: Job) {
  if (!job.salary_min && !job.salary_max) {
    return "Salary not specified";
  }

  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`;
  }

  if (job.salary_min) {
    return `From $${job.salary_min.toLocaleString()}`;
  }

  return `Up to $${job.salary_max?.toLocaleString()}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function formatDateTime(
  date: string | null | undefined,
) {
  if (!date) return "Not scheduled";

  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getMatchScoreClass(
  score: number | null,
) {
  if (score === null) {
    return "text-muted-foreground";
  }

  if (score >= 80) {
    return "text-green-600 dark:text-green-400";
  }

  if (score >= 60) {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-red-600 dark:text-red-400";
}

function AdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] =
    useState<Application[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] =
    useState<Job | null>(null);
  const [form, setForm] =
    useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [userSearch, setUserSearch] =
    useState("");
  const [userRoleFilter, setUserRoleFilter] =
    useState<"all" | "admin" | "user">("all");

  const [applicationSearch, setApplicationSearch] =
    useState("");

  const [
    applicationStageFilter,
    setApplicationStageFilter,
  ] = useState("all");

  const [
    applicationJobFilter,
    setApplicationJobFilter,
  ] = useState("all");

  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState<ApplicationRow | null>(null);

  const [updatingStage, setUpdatingStage] =
    useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const [
      { data: jobsData, error: jobsError },
      {
        data: applicationsData,
        error: applicationsError,
      },
      {
        data: profilesData,
        error: profilesError,
      },
      {
        data: resumesData,
        error: resumesError,
      },
    ] = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("applications")
        .select(
          "id, user_id, job_id, stage, match_score, ai_score, ai_notes, notes, interview_at, created_at",
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("profiles")
        .select("id, role"),

      supabase
        .from("resumes")
        .select("id, user_id"),
    ]);

    if (jobsError) {
      console.error(
        "Jobs loading error:",
        jobsError,
      );

      setMessage(
        "Vakansiyalarni yuklashda xatolik yuz berdi.",
      );
    }

    if (applicationsError) {
      console.error(
        "Applications loading error:",
        applicationsError,
      );
    }

    if (profilesError) {
      console.error(
        "Profiles loading error:",
        profilesError,
      );
    }

    if (resumesError) {
      console.error(
        "Resumes loading error:",
        resumesError,
      );
    }

    setJobs((jobsData ?? []) as Job[]);
    setApplications(
      (applicationsData ?? []) as Application[],
    );
    setUsers(
      (profilesData ?? []) as Profile[],
    );
    setResumes(
      (resumesData ?? []) as Resume[],
    );

    setLoading(false);
  }

  function openAddForm() {
    setEditingJob(null);
    setForm(emptyForm);
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(job: Job) {
    setEditingJob(job);

    setForm({
      title: job.title ?? "",
      company: job.company ?? "",
      location: job.location ?? "",
      work_mode:
        job.work_mode ?? "remote",
      employment_type:
        job.employment_type ?? "full-time",
      seniority:
        job.seniority ?? "junior",
      salary_min:
        job.salary_min?.toString() ?? "",
      salary_max:
        job.salary_max?.toString() ?? "",
      description:
        job.description ?? "",
      skills: Array.isArray(job.skills)
        ? job.skills.join(", ")
        : "",
    });

    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingJob(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof JobForm,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveJob() {
    if (
      !form.title.trim() ||
      !form.company.trim()
    ) {
      setMessage(
        "Job title va company majburiy.",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Session topilmadi. Qayta login qiling.",
      );
      setSaving(false);
      return;
    }

    const skills = form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location:
        form.location.trim() || null,
      work_mode: form.work_mode,
      employment_type:
        form.employment_type,
      seniority: form.seniority,
      salary_min: form.salary_min
        ? Number(form.salary_min)
        : null,
      salary_max: form.salary_max
        ? Number(form.salary_max)
        : null,
      description:
        form.description.trim() || null,
      skills,
      owner_id:
        editingJob?.owner_id ?? user.id,
    };

    if (editingJob) {
      const { error } = await supabase
        .from("jobs")
        .update(payload)
        .eq("id", editingJob.id);

      if (error) {
        console.error(
          "Job update error:",
          error,
        );

        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage(
        "Vakansiya muvaffaqiyatli yangilandi.",
      );
    } else {
      const { error } = await supabase
        .from("jobs")
        .insert(payload);

      if (error) {
        console.error(
          "Job insert error:",
          error,
        );

        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage(
        "Yangi vakansiya qo‘shildi.",
      );
    }

    await loadDashboard();

    setSaving(false);
    setShowForm(false);
    setEditingJob(null);
    setForm(emptyForm);
  }

  async function deleteJob(job: Job) {
    const confirmed = window.confirm(
      `"${job.title}" vakansiyasini o‘chirishni xohlaysizmi?`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id);

    if (error) {
      console.error(
        "Job delete error:",
        error,
      );

      setMessage(error.message);
      return;
    }

    setJobs((previous) =>
      previous.filter(
        (item) => item.id !== job.id,
      ),
    );

    setApplications((previous) =>
      previous.filter(
        (item) => item.job_id !== job.id,
      ),
    );

    setMessage("Vakansiya o‘chirildi.");
  }

  async function updateApplicationStage(
    applicationId: string,
    stage: string,
  ) {
    setUpdatingStage(true);
    setMessage("");

    const { error } = await supabase
      .from("applications")
      .update({ stage })
      .eq("id", applicationId);

    if (error) {
      console.error(
        "Application stage update error:",
        error,
      );

      setMessage(error.message);
      setUpdatingStage(false);
      return;
    }

    setApplications((previous) =>
      previous.map((application) =>
        application.id === applicationId
          ? {
            ...application,
            stage,
          }
          : application,
      ),
    );

    setSelectedApplication(
      (previous) =>
        previous &&
          previous.id === applicationId
          ? {
            ...previous,
            stage,
          }
          : previous,
    );

    setUpdatingStage(false);
  }

  const userRows = useMemo<UserRow[]>(
    () => {
      const resumeMap = new Map(
        resumes.map((resume) => [
          resume.user_id,
          resume.id,
        ]),
      );

      return users.map((user) => {
        const resumeId =
          resumeMap.get(user.id) ?? null;

        return {
          id: user.id,
          role: user.role,
          hasResume: Boolean(resumeId),
          resumeId,
        };
      });
    },
    [users, resumes],
  );

  const filteredUsers = useMemo(() => {
    const search =
      userSearch.trim().toLowerCase();

    return userRows.filter((user) => {
      const matchesSearch =
        !search ||
        user.id
          .toLowerCase()
          .includes(search);

      const matchesRole =
        userRoleFilter === "all" ||
        user.role === userRoleFilter;

      return (
        matchesSearch &&
        matchesRole
      );
    });
  }, [
    userRows,
    userSearch,
    userRoleFilter,
  ]);

  const userStats = useMemo(() => {
    const admins = users.filter(
      (user) => user.role === "admin",
    ).length;

    const regularUsers = users.filter(
      (user) => user.role !== "admin",
    ).length;

    const usersWithResume =
      resumes.filter((resume) =>
        users.some(
          (user) =>
            user.id === resume.user_id,
        ),
      ).length;

    return {
      total: users.length,
      admins,
      regularUsers,
      usersWithResume,
    };
  }, [users, resumes]);

  const applicationRows =
    useMemo<ApplicationRow[]>(
      () => {
        const jobMap = new Map(
          jobs.map((job) => [
            job.id,
            job,
          ]),
        );

        const resumeUsers = new Set(
          resumes.map(
            (resume) => resume.user_id,
          ),
        );

        return applications.map(
          (application) => ({
            ...application,
            job:
              jobMap.get(
                application.job_id,
              ) ?? null,
            applicantHasResume:
              resumeUsers.has(
                application.user_id,
              ),
          }),
        );
      },
      [applications, jobs, resumes],
    );

  const filteredApplications =
    useMemo(() => {
      const search =
        applicationSearch
          .trim()
          .toLowerCase();

      return applicationRows.filter(
        (application) => {
          const jobTitle =
            application.job?.title?.toLowerCase() ??
            "";

          const company =
            application.job?.company?.toLowerCase() ??
            "";

          const applicantId =
            application.user_id.toLowerCase();

          const matchesSearch =
            !search ||
            applicantId.includes(
              search,
            ) ||
            jobTitle.includes(search) ||
            company.includes(search);

          const matchesStage =
            applicationStageFilter ===
            "all" ||
            application.stage ===
            applicationStageFilter;

          const matchesJob =
            applicationJobFilter ===
            "all" ||
            application.job_id ===
            applicationJobFilter;

          return (
            matchesSearch &&
            matchesStage &&
            matchesJob
          );
        },
      );
    }, [
      applicationRows,
      applicationSearch,
      applicationStageFilter,
      applicationJobFilter,
    ]);

  const applicationStats =
    useMemo(() => {
      const withScore =
        applications.filter(
          (application) =>
            (application.ai_score ??
              application.match_score) !==
            null,
        );

      const averageScore =
        withScore.length > 0
          ? Math.round(
            withScore.reduce(
              (
                sum,
                application,
              ) =>
                sum +
                (application.ai_score ??
                  application.match_score ??
                  0),
              0,
            ) / withScore.length,
          )
          : 0;

      const interviews =
        applications.filter(
          (application) =>
            application.stage ===
            "interview",
        ).length;

      const offers =
        applications.filter(
          (application) =>
            application.stage ===
            "offer",
        ).length;

      const hired =
        applications.filter(
          (application) =>
            application.stage ===
            "hired",
        ).length;

      const rejected =
        applications.filter(
          (application) =>
            application.stage ===
            "rejected",
        ).length;

      return {
        total: applications.length,
        averageScore,
        interviews,
        offers,
        hired,
        rejected,
      };
    }, [applications]);

  const stats = useMemo(() => {
    const interviews =
      applications.filter(
        (a) =>
          a.stage === "interview",
      ).length;

    const offers =
      applications.filter(
        (a) => a.stage === "offer",
      ).length;

    const hired =
      applications.filter(
        (a) => a.stage === "hired",
      ).length;

    return {
      jobs: jobs.length,
      applications:
        applications.length,
      users: users.length,
      interviews,
      offers,
      hired,
    };
  }, [jobs, applications, users]);

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
      label: stageLabels[stage],
      count: applications.filter(
        (application) =>
          application.stage === stage,
      ).length,
    }));
  }, [applications]);

  const maxPipeline = Math.max(
    ...pipeline.map(
      (item) => item.count,
    ),
    1,
  );

  const weekly = useMemo(() => {
    const now = new Date();

    return Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(now);

        date.setDate(
          now.getDate() -
          (6 - index),
        );

        const start = new Date(date);

        start.setHours(
          0,
          0,
          0,
          0,
        );

        const end = new Date(date);

        end.setHours(
          23,
          59,
          59,
          999,
        );

        const count =
          applications.filter(
            (application) => {
              const created =
                new Date(
                  application.created_at,
                );

              return (
                created >= start &&
                created <= end
              );
            },
          ).length;

        return {
          label:
            date.toLocaleDateString(
              undefined,
              {
                weekday: "short",
              },
            ),
          count,
        };
      },
    );
  }, [applications]);

  const weeklyPeak = Math.max(
    ...weekly.map(
      (item) => item.count,
    ),
    1,
  );

  return (
    <PageShell
      icon={
        <ShieldCheck className="size-3.5" />
      }
      title="Admin dashboard"
      description="Manage jobs, applications and monitor platform activity."
    >
      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Jobs
            </p>

            <Briefcase className="size-4 text-primary" />
          </div>

          <p className="mt-2 font-display text-3xl font-semibold text-primary">
            {stats.jobs}
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Applications
            </p>

            <FileText className="size-4 text-primary" />
          </div>

          <p className="mt-2 font-display text-3xl font-semibold text-primary">
            {stats.applications}
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Users
            </p>

            <Users className="size-4 text-primary" />
          </div>

          <p className="mt-2 font-display text-3xl font-semibold text-primary">
            {stats.users}
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Hired
            </p>

            <UserCheck className="size-4 text-primary" />
          </div>

          <p className="mt-2 font-display text-3xl font-semibold text-primary">
            {stats.hired}
          </p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Interviews
          </p>

          <p className="mt-2 font-display text-2xl font-semibold">
            {stats.interviews}
          </p>
        </div>

        <div className="panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Offers
          </p>

          <p className="mt-2 font-display text-2xl font-semibold">
            {stats.offers}
          </p>
        </div>

        <div className="panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Screening
          </p>

          <p className="mt-2 font-display text-2xl font-semibold">
            {
              applications.filter(
                (application) =>
                  application.stage ===
                  "screening",
              ).length
            }
          </p>
        </div>
      </div>

      {/* Analytics */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-primary" />

            <h2 className="text-sm font-medium">
              Applications — last 7 days
            </h2>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3">
            {weekly.map((item) => (
              <div
                key={item.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-full w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-primary/70"
                    style={{
                      height: `${(item.count /
                          weeklyPeak) *
                        100
                        }%`,
                      minHeight:
                        item.count > 0
                          ? "4px"
                          : "0",
                    }}
                  />
                </div>

                <span className="text-[10px] text-muted-foreground">
                  {item.label}
                </span>

                <span className="text-xs font-medium">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-medium">
            Application pipeline
          </h2>

          <div className="mt-5 space-y-4">
            {pipeline.map((item) => (
              <div key={item.stage}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {item.label}
                  </span>

                  <span>
                    {item.count}
                  </span>
                </div>

                <Progress
                  value={
                    (item.count /
                      maxPipeline) *
                    100
                  }
                  className="mt-1.5"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Users Management */}
      <section className="mb-10 panel p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />

              <h2 className="text-lg font-semibold">
                Users Management
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              View and monitor AgentHire AI users.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Total
              </p>

              <p className="mt-1 text-lg font-semibold">
                {userStats.total}
              </p>
            </div>

            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Admins
              </p>

              <p className="mt-1 text-lg font-semibold">
                {userStats.admins}
              </p>
            </div>

            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Resumes
              </p>

              <p className="mt-1 text-lg font-semibold">
                {userStats.usersWithResume}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={userSearch}
              onChange={(event) =>
                setUserSearch(
                  event.target.value,
                )
              }
              placeholder="Search by user ID..."
              className="pl-9"
            />
          </div>

          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-40"
            value={userRoleFilter}
            onChange={(event) =>
              setUserRoleFilter(
                event.target.value as
                | "all"
                | "admin"
                | "user",
              )
            }
          >
            <option value="all">
              All roles
            </option>

            <option value="admin">
              Admins
            </option>

            <option value="user">
              Users
            </option>
          </select>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading users...
          </div>
        ) : filteredUsers.length ===
          0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <Users className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              No users found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try another search or role filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-4 rounded-lg border border-border p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    {user.role ===
                      "admin" ? (
                      <Shield className="size-4 text-primary" />
                    ) : (
                      <User className="size-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm">
                      {user.id}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={
                          user.role ===
                            "admin"
                            ? "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary"
                            : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px]"
                        }
                      >
                        {user.role ===
                          "admin" ? (
                          <Shield className="size-3" />
                        ) : (
                          <User className="size-3" />
                        )}

                        {user.role ===
                          "admin"
                          ? "Admin"
                          : "User"}
                      </span>

                      <span
                        className={
                          user.hasResume
                            ? "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary"
                            : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                        }
                      >
                        <FileText className="size-3" />

                        {user.hasResume
                          ? "Resume available"
                          : "No resume"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />

                  <span>
                    Profile ID:{" "}
                    {user.id.slice(
                      0,
                      8,
                    )}
                    ...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {filteredUsers.length} of{" "}
            {userRows.length} users
          </p>

          <p className="text-xs text-muted-foreground">
            {userStats.regularUsers} regular
            users
          </p>
        </div>
      </section>

      {/* Applications Management */}
      <section className="mb-10 panel p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />

              <h2 className="text-lg font-semibold">
                Applications Management
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor applications, AI matching and candidate stages.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Total
              </p>

              <p className="mt-1 text-lg font-semibold">
                {applicationStats.total}
              </p>
            </div>

            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Avg AI score
              </p>

              <p className="mt-1 text-lg font-semibold">
                {applicationStats.averageScore}%
              </p>
            </div>

            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Interviews
              </p>

              <p className="mt-1 text-lg font-semibold">
                {applicationStats.interviews}
              </p>
            </div>

            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Offers
              </p>

              <p className="mt-1 text-lg font-semibold">
                {applicationStats.offers}
              </p>
            </div>

            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Hired
              </p>

              <p className="mt-1 text-lg font-semibold">
                {applicationStats.hired}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_180px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={applicationSearch}
              onChange={(event) =>
                setApplicationSearch(
                  event.target.value,
                )
              }
              placeholder="Search applicant ID, job or company..."
              className="pl-9"
            />
          </div>

          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={
              applicationStageFilter
            }
            onChange={(event) =>
              setApplicationStageFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              All stages
            </option>

            {Object.entries(
              stageLabels,
            ).map(
              ([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ),
            )}
          </select>

          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={
              applicationJobFilter
            }
            onChange={(event) =>
              setApplicationJobFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              All jobs
            </option>

            {jobs.map((job) => (
              <option
                key={job.id}
                value={job.id}
              >
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Application list */}
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading applications...
          </div>
        ) : filteredApplications.length ===
          0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <FileText className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              No applications found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try another search or filter.
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
            {filteredApplications.map(
              (application) => {
                const aiScore =
                  application.ai_score ??
                  application.match_score;

                return (
                  <div
                    key={application.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">
                            {application.job
                              ?.title ??
                              "Unknown job"}
                          </h3>

                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] ${stageClasses[
                              application
                                .stage
                              ] ??
                              "bg-muted text-muted-foreground"
                              }`}
                          >
                            {stageLabels[
                              application
                                .stage
                            ] ??
                              application.stage}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="size-3.5" />

                            {application.job
                              ?.company ??
                              "Unknown company"}
                          </span>

                          {application.job
                            ?.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3.5" />

                                {
                                  application
                                    .job
                                    .location
                                }
                              </span>
                            )}

                          <span className="inline-flex items-center gap-1">
                            <User className="size-3.5" />

                            {application.user_id.slice(
                              0,
                              8,
                            )}
                            ...
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] ${getMatchScoreClass(
                              aiScore,
                            )}`}
                          >
                            <Target className="size-3" />

                            AI Match:{" "}
                            {aiScore ?? 0}%
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px]">
                            <CalendarDays className="size-3" />

                            Applied{" "}
                            {formatDate(
                              application.created_at,
                            )}
                          </span>

                          {application.interview_at && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                              <Clock3 className="size-3" />

                              Interview scheduled
                            </span>
                          )}

                          {application.applicantHasResume && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                              <FileText className="size-3" />

                              Resume
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedApplication(
                            application,
                          )
                        }
                      >
                        <Eye className="mr-2 size-3.5" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {
              filteredApplications.length
            }{" "}
            of{" "}
            {applicationRows.length}{" "}
            applications
          </p>

          <p className="text-xs text-muted-foreground">
            {applicationStats.rejected}{" "}
            rejected
          </p>
        </div>
      </section>

      {/* Application detail modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />

                  <h2 className="text-lg font-semibold">
                    Application details
                  </h2>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Full application information.
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSelectedApplication(
                    null,
                  )
                }
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Job */}
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Job
                </p>

                <p className="mt-2 text-base font-semibold">
                  {selectedApplication
                    .job?.title ??
                    "Unknown job"}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedApplication
                    .job?.company ??
                    "Unknown company"}
                </p>

                {selectedApplication
                  .job?.location && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />

                      {
                        selectedApplication
                          .job.location
                      }
                    </p>
                  )}
              </div>

              {/* IDs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Applicant ID
                  </p>

                  <p className="mt-2 break-all font-mono text-xs">
                    {
                      selectedApplication.user_id
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Application ID
                  </p>

                  <p className="mt-2 break-all font-mono text-xs">
                    {
                      selectedApplication.id
                    }
                  </p>
                </div>
              </div>

              {/* Stage / AI / Resume */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    Stage
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs ${stageClasses[
                      selectedApplication
                        .stage
                      ] ??
                      "bg-muted text-muted-foreground"
                      }`}
                  >
                    {stageLabels[
                      selectedApplication
                        .stage
                    ] ??
                      selectedApplication.stage}
                  </span>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    AI Match
                  </p>

                  <p
                    className={`mt-2 text-xl font-semibold ${getMatchScoreClass(
                      selectedApplication.ai_score ??
                      selectedApplication.match_score,
                    )}`}
                  >
                    {selectedApplication.ai_score ??
                      selectedApplication.match_score ??
                      0}
                    %
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    Resume
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {selectedApplication.applicantHasResume
                      ? "Available"
                      : "Not available"}
                  </p>
                </div>
              </div>

              {/* Stage Management */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-primary" />

                  <p className="text-xs font-medium uppercase tracking-widest text-primary">
                    Application Stage
                  </p>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Update the candidate's current recruitment stage.
                </p>

                <select
                  className="mt-4 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={
                    selectedApplication.stage
                  }
                  disabled={updatingStage}
                  onChange={(event) =>
                    updateApplicationStage(
                      selectedApplication.id,
                      event.target.value,
                    )
                  }
                >
                  {Object.entries(
                    stageLabels,
                  ).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>

                {updatingStage && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updating stage...
                  </p>
                )}
              </div>

              {/* AI Analysis */}
              {selectedApplication.ai_notes && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-primary" />

                    <p className="text-xs font-medium uppercase tracking-widest text-primary">
                      AI Match Analysis
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {
                      selectedApplication.ai_notes
                    }
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Timeline
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Applied
                    </span>

                    <span className="text-sm">
                      {formatDateTime(
                        selectedApplication.created_at,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Interview
                    </span>

                    <span className="text-sm">
                      {formatDateTime(
                        selectedApplication.interview_at,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedApplication.notes && (
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Applicant Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {
                      selectedApplication.notes
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSelectedApplication(
                      null,
                    )
                  }
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Management */}
      <section className="panel p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />

              <h2 className="text-lg font-semibold">
                Job Management
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Add, edit and remove job vacancies.
            </p>
          </div>

          <Button
            onClick={openAddForm}
          >
            <Plus className="mr-2 size-4" />
            Add Job
          </Button>
        </div>

        {message && (
          <div className="mb-5 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {/* Job Form */}
        {showForm && (
          <div className="mb-8 rounded-xl border border-border bg-muted/20 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">
                {editingJob
                  ? "Edit Job"
                  : "Add New Job"}
              </h3>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeForm}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Job title *
                </Label>

                <Input
                  value={form.title}
                  onChange={(e) =>
                    updateField(
                      "title",
                      e.target.value,
                    )
                  }
                  placeholder="Frontend Developer"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Company *
                </Label>

                <Input
                  value={form.company}
                  onChange={(e) =>
                    updateField(
                      "company",
                      e.target.value,
                    )
                  }
                  placeholder="Google"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Location
                </Label>

                <Input
                  value={form.location}
                  onChange={(e) =>
                    updateField(
                      "location",
                      e.target.value,
                    )
                  }
                  placeholder="Tashkent, Uzbekistan"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Work mode
                </Label>

                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={
                    form.work_mode
                  }
                  onChange={(e) =>
                    updateField(
                      "work_mode",
                      e.target.value,
                    )
                  }
                >
                  <option value="remote">
                    Remote
                  </option>

                  <option value="hybrid">
                    Hybrid
                  </option>

                  <option value="onsite">
                    On-site
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>
                  Employment type
                </Label>

                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={
                    form.employment_type
                  }
                  onChange={(e) =>
                    updateField(
                      "employment_type",
                      e.target.value,
                    )
                  }
                >
                  <option value="full-time">
                    Full-time
                  </option>

                  <option value="part-time">
                    Part-time
                  </option>

                  <option value="contract">
                    Contract
                  </option>

                  <option value="internship">
                    Internship
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>
                  Seniority
                </Label>

                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={
                    form.seniority
                  }
                  onChange={(e) =>
                    updateField(
                      "seniority",
                      e.target.value,
                    )
                  }
                >
                  <option value="junior">
                    Junior
                  </option>

                  <option value="mid">
                    Mid
                  </option>

                  <option value="senior">
                    Senior
                  </option>

                  <option value="lead">
                    Lead
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>
                  Minimum salary
                </Label>

                <Input
                  type="number"
                  value={
                    form.salary_min
                  }
                  onChange={(e) =>
                    updateField(
                      "salary_min",
                      e.target.value,
                    )
                  }
                  placeholder="500"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Maximum salary
                </Label>

                <Input
                  type="number"
                  value={
                    form.salary_max
                  }
                  onChange={(e) =>
                    updateField(
                      "salary_max",
                      e.target.value,
                    )
                  }
                  placeholder="1200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>
                  Skills
                </Label>

                <Input
                  value={form.skills}
                  onChange={(e) =>
                    updateField(
                      "skills",
                      e.target.value,
                    )
                  }
                  placeholder="React, TypeScript, Tailwind CSS, Git"
                />

                <p className="text-xs text-muted-foreground">
                  Skillsni vergul bilan ajrating.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>
                  Description
                </Label>

                <Textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder="Job description..."
                  rows={6}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={saveJob}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingJob
                    ? "Save Changes"
                    : "Create Job"}
              </Button>

              <Button
                variant="outline"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Jobs */}
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading dashboard...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <Briefcase className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              No jobs yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Add your first job vacancy.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const jobApplications =
                applications.filter(
                  (application) =>
                    application.job_id ===
                    job.id,
                ).length;

              return (
                <div
                  key={job.id}
                  className="flex flex-col gap-4 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium">
                      {job.title}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.company}

                      {job.location
                        ? ` · ${job.location}`
                        : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.work_mode && (
                        <span className="rounded-full bg-muted px-2 py-1 text-[11px]">
                          {
                            job.work_mode
                          }
                        </span>
                      )}

                      {job.employment_type && (
                        <span className="rounded-full bg-muted px-2 py-1 text-[11px]">
                          {
                            job.employment_type
                          }
                        </span>
                      )}

                      {job.seniority && (
                        <span className="rounded-full bg-muted px-2 py-1 text-[11px]">
                          {
                            job.seniority
                          }
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px]">
                        <Users className="size-3" />

                        {
                          jobApplications
                        }{" "}
                        applications
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        {formatSalary(
                          job,
                        )}
                      </span>

                      <span>
                        Created{" "}
                        {formatDate(
                          job.created_at,
                        )}
                      </span>
                    </div>

                    {Array.isArray(
                      job.skills,
                    ) &&
                      job.skills.length >
                      0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {job.skills.join(
                            " · ",
                          )}
                        </p>
                      )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openEditForm(
                          job,
                        )
                      }
                    >
                      <Pencil className="mr-2 size-3.5" />
                      Edit
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        deleteJob(
                          job,
                        )
                      }
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick overview */}
      {!loading &&
        applications.length > 0 && (
          <section className="mt-6 panel p-6">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />

              <h2 className="text-sm font-medium">
                Platform overview
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Average AI match score
                </p>

                <p className="mt-1 font-display text-xl font-semibold">
                  {applicationStats.averageScore}
                  %
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Interview rate
                </p>

                <p className="mt-1 font-display text-xl font-semibold">
                  {Math.round(
                    (stats.interviews /
                      applications.length) *
                    100,
                  )}
                  %
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Offer rate
                </p>

                <p className="mt-1 font-display text-xl font-semibold">
                  {Math.round(
                    (stats.offers /
                      applications.length) *
                    100,
                  )}
                  %
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Hire rate
                </p>

                <p className="mt-1 font-display text-xl font-semibold">
                  {Math.round(
                    (stats.hired /
                      applications.length) *
                    100,
                  )}
                  %
                </p>
              </div>
            </div>
          </section>
        )}
    </PageShell>
  );
}