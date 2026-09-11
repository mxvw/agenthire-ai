import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BriefcaseBusiness, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/company-jobs")({
    head: () => ({
        meta: [
            {
                title: "Post a Job — AgentHire AI",
            },
            {
                name: "description",
                content: "Create a new job vacancy on AgentHire AI.",
            },
        ],
    }),
    component: CompanyJobsPage,
});

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

const initialForm: FormState = {
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

function CompanyJobsPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>(initialForm);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                navigate({
                    to: "/auth",
                    search: {
                        redirect: "/company-jobs",
                    },
                });
                return;
            }

            setLoading(false);
        }

        checkUser();
    }, [navigate]);

    function updateField(field: keyof FormState, value: string) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.title.trim() || !form.company.trim()) {
            setMessage("Job title va company majburiy.");
            return;
        }

        setSaving(true);
        setMessage("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setMessage("Avval tizimga kiring.");
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
            location: form.location.trim() || null,
            work_mode: form.work_mode,
            employment_type: form.employment_type,
            seniority: form.seniority,
            salary_min: form.salary_min ? Number(form.salary_min) : null,
            salary_max: form.salary_max ? Number(form.salary_max) : null,
            description: form.description.trim() || null,
            skills,
            owner_id: user.id,
        };

        const { error } = await supabase
            .from("jobs")
            .insert(payload);

        if (error) {
            console.error("Company job insert error:", error);
            setMessage(error.message);
            setSaving(false);
            return;
        }

        setMessage("Vakansiya muvaffaqiyatli qo‘shildi.");

        setForm(initialForm);

        setTimeout(() => {
            navigate({
                to: "/company",
            });
        }, 700);
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
            title="Post a Job"
            description="Create a new vacancy and start finding candidates."
            action={
                <Button asChild variant="outline">
                    <Link to="/company">
                        <ArrowLeft className="mr-2 size-4" />
                        Back to dashboard
                    </Link>
                </Button>
            }
        >
            <div className="mx-auto max-w-3xl">
                <form
                    onSubmit={handleSubmit}
                    className="panel space-y-6 p-6 md:p-8"
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Job title *
                            </Label>

                            <Input
                                id="title"
                                placeholder="Frontend Developer"
                                value={form.title}
                                onChange={(event) =>
                                    updateField("title", event.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company">
                                Company *
                            </Label>

                            <Input
                                id="company"
                                placeholder="Your company"
                                value={form.company}
                                onChange={(event) =>
                                    updateField("company", event.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">
                                Location
                            </Label>

                            <Input
                                id="location"
                                placeholder="Tashkent, Uzbekistan"
                                value={form.location}
                                onChange={(event) =>
                                    updateField("location", event.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="work_mode">
                                Work mode
                            </Label>

                            <select
                                id="work_mode"
                                value={form.work_mode}
                                onChange={(event) =>
                                    updateField("work_mode", event.target.value)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="remote">Remote</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="onsite">On-site</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employment_type">
                                Employment type
                            </Label>

                            <select
                                id="employment_type"
                                value={form.employment_type}
                                onChange={(event) =>
                                    updateField(
                                        "employment_type",
                                        event.target.value,
                                    )
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="seniority">
                                Seniority
                            </Label>

                            <select
                                id="seniority"
                                value={form.seniority}
                                onChange={(event) =>
                                    updateField("seniority", event.target.value)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="junior">Junior</option>
                                <option value="middle">Middle</option>
                                <option value="senior">Senior</option>
                                <option value="lead">Lead</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary_min">
                                Minimum salary ($)
                            </Label>

                            <Input
                                id="salary_min"
                                type="number"
                                min="0"
                                placeholder="500"
                                value={form.salary_min}
                                onChange={(event) =>
                                    updateField("salary_min", event.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary_max">
                                Maximum salary ($)
                            </Label>

                            <Input
                                id="salary_max"
                                type="number"
                                min="0"
                                placeholder="1000"
                                value={form.salary_max}
                                onChange={(event) =>
                                    updateField("salary_max", event.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills">
                            Required skills
                        </Label>

                        <Input
                            id="skills"
                            placeholder="React, TypeScript, Tailwind CSS, Git"
                            value={form.skills}
                            onChange={(event) =>
                                updateField("skills", event.target.value)
                            }
                        />

                        <p className="text-xs text-muted-foreground">
                            Skillsni vergul bilan ajrating.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Job description
                        </Label>

                        <Textarea
                            id="description"
                            placeholder="Describe the position, responsibilities and requirements..."
                            className="min-h-40"
                            value={form.description}
                            onChange={(event) =>
                                updateField("description", event.target.value)
                            }
                        />
                    </div>

                    {message && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={saving}
                        >
                            {saving && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}

                            {saving ? "Publishing..." : "Publish Job"}
                        </Button>
                    </div>
                </form>
            </div>
        </PageShell>
    );
}