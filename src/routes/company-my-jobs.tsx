import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
    ArrowLeft,
    BriefcaseBusiness,
    Loader2,
    Pencil,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/company-my-jobs")({
    head: () => ({
        meta: [
            {
                title: "My Jobs — AgentHire AI",
            },
            {
                name: "description",
                content: "Manage your job vacancies.",
            },
        ],
    }),
    component: CompanyMyJobsPage,
});

type Job = {
    id: string;
    title: string;
    company: string;
    location: string | null;
    work_mode: string;
    employment_type: string;
    seniority: string;
    salary_min: number | null;
    salary_max: number | null;
    description: string | null;
    skills: string[] | null;
    created_at: string;
};

type FormState = {
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

const emptyForm: FormState = {
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

function CompanyMyJobsPage() {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadJobs();
    }, []);

    async function loadJobs() {
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            navigate({
                to: "/auth",
                search: {
                    redirect: "/company-my-jobs",
                },
            });
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
                created_at
                `,
            )
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("My jobs loading error:", error);
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setJobs((data ?? []) as Job[]);
        setLoading(false);
    }

    function startEditing(job: Job) {
        setEditingJob(job);

        setForm({
            title: job.title,
            company: job.company,
            location: job.location ?? "",
            work_mode: job.work_mode,
            employment_type: job.employment_type,
            seniority: job.seniority,
            salary_min:
                job.salary_min !== null
                    ? String(job.salary_min)
                    : "",
            salary_max:
                job.salary_max !== null
                    ? String(job.salary_max)
                    : "",
            description: job.description ?? "",
            skills: (job.skills ?? []).join(", "),
        });

        setMessage("");
    }

    function cancelEditing() {
        setEditingJob(null);
        setForm(emptyForm);
        setMessage("");
    }

    function updateField(field: keyof FormState, value: string) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleUpdate(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!editingJob) return;

        if (!form.title.trim() || !form.company.trim()) {
            setMessage("Job title va company majburiy.");
            return;
        }

        setSaving(true);
        setMessage("");

        const skills = form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);

        const { error } = await supabase
            .from("jobs")
            .update({
                title: form.title.trim(),
                company: form.company.trim(),
                location: form.location.trim() || null,
                work_mode: form.work_mode,
                employment_type: form.employment_type,
                seniority: form.seniority,
                salary_min: form.salary_min
                    ? Number(form.salary_min)
                    : null,
                salary_max: form.salary_max
                    ? Number(form.salary_max)
                    : null,
                description: form.description.trim() || null,
                skills,
            })
            .eq("id", editingJob.id);

        if (error) {
            console.error("Job update error:", error);
            setMessage(error.message);
            setSaving(false);
            return;
        }

        setMessage("Vakansiya muvaffaqiyatli yangilandi.");

        setEditingJob(null);
        setForm(emptyForm);

        await loadJobs();

        setSaving(false);
    }

    async function deleteJob(jobId: string) {
        const confirmed = window.confirm(
            "Bu vakansiyani o‘chirishni xohlaysizmi?",
        );

        if (!confirmed) return;

        setDeleting(jobId);
        setMessage("");

        const { error } = await supabase
            .from("jobs")
            .delete()
            .eq("id", jobId);

        if (error) {
            console.error("Job delete error:", error);
            setMessage(error.message);
            setDeleting(null);
            return;
        }

        setJobs((previous) =>
            previous.filter((job) => job.id !== jobId),
        );

        setDeleting(null);
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="size-5 animate-spin" />
            </div>
        );
    }

    return (
        <PageShell
            icon={<BriefcaseBusiness className="size-3.5" />}
            title="My Jobs"
            description="Manage the vacancies you have posted."
            action={
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link to="/company">
                            <ArrowLeft className="mr-2 size-4" />
                            Dashboard
                        </Link>
                    </Button>

                    <Button asChild>
                        <Link to="/company-jobs">
                            <BriefcaseBusiness className="mr-2 size-4" />
                            Post Job
                        </Link>
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {message && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        {message}
                    </div>
                )}

                {editingJob && (
                    <div className="panel p-6 md:p-8">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Edit Job
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Update your vacancy information.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={cancelEditing}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        <form
                            onSubmit={handleUpdate}
                            className="space-y-6"
                        >
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title">
                                        Job title *
                                    </Label>

                                    <Input
                                        id="edit-title"
                                        value={form.title}
                                        onChange={(event) =>
                                            updateField(
                                                "title",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-company">
                                        Company *
                                    </Label>

                                    <Input
                                        id="edit-company"
                                        value={form.company}
                                        onChange={(event) =>
                                            updateField(
                                                "company",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-location">
                                        Location
                                    </Label>

                                    <Input
                                        id="edit-location"
                                        value={form.location}
                                        onChange={(event) =>
                                            updateField(
                                                "location",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-work-mode">
                                        Work mode
                                    </Label>

                                    <select
                                        id="edit-work-mode"
                                        value={form.work_mode}
                                        onChange={(event) =>
                                            updateField(
                                                "work_mode",
                                                event.target.value,
                                            )
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                    <Label htmlFor="edit-employment">
                                        Employment type
                                    </Label>

                                    <select
                                        id="edit-employment"
                                        value={form.employment_type}
                                        onChange={(event) =>
                                            updateField(
                                                "employment_type",
                                                event.target.value,
                                            )
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                    <Label htmlFor="edit-seniority">
                                        Seniority
                                    </Label>

                                    <select
                                        id="edit-seniority"
                                        value={form.seniority}
                                        onChange={(event) =>
                                            updateField(
                                                "seniority",
                                                event.target.value,
                                            )
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="junior">
                                            Junior
                                        </option>
                                        <option value="middle">
                                            Middle
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
                                    <Label htmlFor="edit-salary-min">
                                        Minimum salary ($)
                                    </Label>

                                    <Input
                                        id="edit-salary-min"
                                        type="number"
                                        min="0"
                                        value={form.salary_min}
                                        onChange={(event) =>
                                            updateField(
                                                "salary_min",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-salary-max">
                                        Maximum salary ($)
                                    </Label>

                                    <Input
                                        id="edit-salary-max"
                                        type="number"
                                        min="0"
                                        value={form.salary_max}
                                        onChange={(event) =>
                                            updateField(
                                                "salary_max",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-skills">
                                    Required skills
                                </Label>

                                <Input
                                    id="edit-skills"
                                    value={form.skills}
                                    onChange={(event) =>
                                        updateField(
                                            "skills",
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">
                                    Job description
                                </Label>

                                <Textarea
                                    id="edit-description"
                                    className="min-h-40"
                                    value={form.description}
                                    onChange={(event) =>
                                        updateField(
                                            "description",
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={cancelEditing}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {jobs.length === 0 ? (
                    <div className="panel p-10 text-center">
                        <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground" />

                        <h2 className="mt-4 text-lg font-semibold">
                            No jobs yet
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            You have not posted any vacancies yet.
                        </p>

                        <Button asChild className="mt-5">
                            <Link to="/company-jobs">
                                <BriefcaseBusiness className="mr-2 size-4" />
                                Post your first job
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="panel p-5"
                            >
                                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold">
                                            {job.title}
                                        </h2>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {job.company}
                                            {job.location
                                                ? ` · ${job.location}`
                                                : ""}
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-muted px-3 py-1 text-xs">
                                                {job.work_mode}
                                            </span>

                                            <span className="rounded-full bg-muted px-3 py-1 text-xs">
                                                {job.employment_type}
                                            </span>

                                            <span className="rounded-full bg-muted px-3 py-1 text-xs">
                                                {job.seniority}
                                            </span>

                                            {job.salary_min !== null ||
                                                job.salary_max !== null ? (
                                                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                                                    $
                                                    {job.salary_min ??
                                                        0}{" "}
                                                    -
                                                    $
                                                    {job.salary_max ??
                                                        0}
                                                </span>
                                            ) : null}
                                        </div>

                                        {job.skills &&
                                            job.skills.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {job.skills.map(
                                                        (
                                                            skill,
                                                            index,
                                                        ) => (
                                                            <span
                                                                key={`${skill}-${index}`}
                                                                className="rounded-full border px-3 py-1 text-xs"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                        <p className="mt-4 text-xs text-muted-foreground">
                                            Posted{" "}
                                            {new Date(
                                                job.created_at,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        <Button asChild variant="outline">
                                            <Link
                                                to="/company-applications"
                                            >
                                                <Users className="mr-2 size-4" />
                                                Applications
                                            </Link>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                startEditing(job)
                                            }
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            Edit
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            disabled={
                                                deleting === job.id
                                            }
                                            onClick={() =>
                                                deleteJob(job.id)
                                            }
                                        >
                                            {deleting === job.id ? (
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="mr-2 size-4" />
                                            )}

                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageShell>
    );
}