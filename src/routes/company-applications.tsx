import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
    BriefcaseBusiness,
    Calendar,
    CheckCircle2,
    Clock3,
    Eye,
    Mail,
    RefreshCw,
    Search,
    UserCheck,
    Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Resume = {
    id: string;
    user_id: string;
    full_name: string | null;
    headline: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
    summary: string | null;
    about: string | null;
    skills: string[] | null;
    experience: string | null;
    education: string | null;
    languages: string | null;
};

type Application = {
    id: string;
    user_id: string;
    job_id: string;
    stage: string;
    match_score: number | null;
    notes: string | null;
    interview_at: string | null;
    created_at: string;

    jobs: {
        id: string;
        title: string;
        company: string;
        owner_id: string;
    };

    resume: Resume | null;
};

const STAGES = [
    { value: "submitted", label: "Submitted" },
    { value: "reviewing", label: "Reviewing" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "interview", label: "Interview" },
    { value: "hired", label: "Hired" },
    { value: "rejected", label: "Rejected" },
] as const;

export const Route = createFileRoute("/company-applications")({
    component: CompanyApplicationsPage,
});

function getStageLabel(stage: string) {
    return (
        STAGES.find((item) => item.value === stage)?.label ||
        stage ||
        "Submitted"
    );
}

function getStageClass(stage: string) {
    switch (stage) {
        case "submitted":
            return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

        case "reviewing":
            return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";

        case "shortlisted":
            return "bg-purple-500/10 text-purple-600 dark:text-purple-400";

        case "interview":
            return "bg-orange-500/10 text-orange-600 dark:text-orange-400";

        case "hired":
            return "bg-green-500/10 text-green-600 dark:text-green-400";

        case "rejected":
            return "bg-red-500/10 text-red-600 dark:text-red-400";

        default:
            return "bg-muted text-muted-foreground";
    }
}

function formatInterviewDate(date: string | null) {
    if (!date) {
        return null;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toDateTimeLocalValue(date: string | null) {
    if (!date) {
        return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const hours = String(parsedDate.getHours()).padStart(2, "0");
    const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function CompanyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState("all");
    const [jobFilter, setJobFilter] = useState("all");

    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Interview management
    const [editingInterviewId, setEditingInterviewId] = useState<string | null>(
        null,
    );

    const [interviewDateTime, setInterviewDateTime] = useState("");
    const [interviewNotes, setInterviewNotes] = useState("");

    const [savingInterviewId, setSavingInterviewId] = useState<string | null>(
        null,
    );

    useEffect(() => {
        loadApplications();
    }, []);

    async function loadApplications() {
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        const { data: jobsData, error: jobsError } = await supabase
            .from("jobs")
            .select("id, title, company, owner_id")
            .eq("owner_id", user.id);

        if (jobsError) {
            console.error("Jobs loading error:", jobsError);
            setApplications([]);
            setLoading(false);
            return;
        }

        const jobs = jobsData ?? [];
        const jobIds = jobs.map((job) => job.id);

        if (jobIds.length === 0) {
            setApplications([]);
            setLoading(false);
            return;
        }

        const { data: applicationsData, error: applicationsError } =
            await supabase
                .from("applications")
                .select(
                    `
          id,
          user_id,
          job_id,
          stage,
          match_score,
          notes,
          interview_at,
          created_at
        `,
                )
                .in("job_id", jobIds)
                .order("created_at", { ascending: false });

        if (applicationsError) {
            console.error(
                "Applications loading error:",
                applicationsError,
            );
            setApplications([]);
            setLoading(false);
            return;
        }

        const rawApplications = applicationsData ?? [];

        const userIds = [
            ...new Set(
                rawApplications.map((application) => application.user_id),
            ),
        ];

        let resumesData: Resume[] = [];

        if (userIds.length > 0) {
            const { data: resumeData, error: resumeError } = await supabase
                .from("resumes")
                .select(
                    `
          id,
          user_id,
          full_name,
          headline,
          location,
          phone,
          email,
          summary,
          about,
          skills,
          experience,
          education,
          languages
        `,
                )
                .in("user_id", userIds);

            if (resumeError) {
                console.error("Resumes loading error:", resumeError);
            } else {
                resumesData = (resumeData ?? []) as Resume[];
            }
        }

        const jobMap = new Map(
            jobs.map((job) => [job.id, job]),
        );

        const resumeMap = new Map(
            resumesData.map((resume) => [resume.user_id, resume]),
        );

        const applicationsWithData: Application[] = rawApplications
            .map((application) => {
                const job = jobMap.get(application.job_id);

                if (!job) {
                    return null;
                }

                return {
                    ...application,
                    jobs: job,
                    resume: resumeMap.get(application.user_id) ?? null,
                } as Application;
            })
            .filter(Boolean) as Application[];

        setApplications(applicationsWithData);
        setLoading(false);
    }

    async function handleRefresh() {
        setRefreshing(true);

        await loadApplications();

        setRefreshing(false);
    }

    async function updateApplicationStage(
        applicationId: string,
        stage: string,
    ) {
        setUpdatingId(applicationId);

        const { error } = await supabase
            .from("applications")
            .update({ stage })
            .eq("id", applicationId);

        if (error) {
            console.error("Stage update error:", error);
            setUpdatingId(null);
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

        // Interview status tanlanganda mavjud ma'lumotlarni ochamiz
        if (stage === "interview") {
            const application = applications.find(
                (item) => item.id === applicationId,
            );

            setEditingInterviewId(applicationId);
            setInterviewDateTime(
                toDateTimeLocalValue(application?.interview_at ?? null),
            );
            setInterviewNotes(application?.notes ?? "");
        } else if (editingInterviewId === applicationId) {
            setEditingInterviewId(null);
            setInterviewDateTime("");
            setInterviewNotes("");
        }

        setUpdatingId(null);
    }

    function openInterviewEditor(application: Application) {
        setEditingInterviewId(application.id);

        setInterviewDateTime(
            toDateTimeLocalValue(application.interview_at),
        );

        setInterviewNotes(application.notes ?? "");
    }

    function closeInterviewEditor() {
        setEditingInterviewId(null);
        setInterviewDateTime("");
        setInterviewNotes("");
    }

    async function saveInterview(applicationId: string) {
        if (!interviewDateTime) {
            alert("Iltimos, interview sana va vaqtini tanlang.");
            return;
        }

        setSavingInterviewId(applicationId);

        const interviewDate = new Date(interviewDateTime);

        if (Number.isNaN(interviewDate.getTime())) {
            alert("Interview sana noto‘g‘ri.");
            setSavingInterviewId(null);
            return;
        }

        const { error } = await supabase
            .from("applications")
            .update({
                interview_at: interviewDate.toISOString(),
                notes: interviewNotes.trim() || null,
                stage: "interview",
            })
            .eq("id", applicationId);

        if (error) {
            console.error("Interview save error:", error);
            alert("Interview ma'lumotlarini saqlashda xatolik yuz berdi.");
            setSavingInterviewId(null);
            return;
        }

        setApplications((previous) =>
            previous.map((application) =>
                application.id === applicationId
                    ? {
                        ...application,
                        stage: "interview",
                        interview_at: interviewDate.toISOString(),
                        notes: interviewNotes.trim() || null,
                    }
                    : application,
            ),
        );

        setSavingInterviewId(null);
        setEditingInterviewId(null);
        setInterviewDateTime("");
        setInterviewNotes("");
    }

    const jobs = useMemo(() => {
        const uniqueJobs = new Map<string, string>();

        applications.forEach((application) => {
            uniqueJobs.set(
                application.job_id,
                application.jobs.title,
            );
        });

        return Array.from(uniqueJobs.entries()).map(
            ([id, title]) => ({
                id,
                title,
            }),
        );
    }, [applications]);

    const filteredApplications = useMemo(() => {
        const query = search.trim().toLowerCase();

        return applications.filter((application) => {
            const name =
                application.resume?.full_name?.toLowerCase() || "";

            const email =
                application.resume?.email?.toLowerCase() || "";

            const headline =
                application.resume?.headline?.toLowerCase() || "";

            const jobTitle =
                application.jobs.title?.toLowerCase() || "";

            const matchesSearch =
                !query ||
                name.includes(query) ||
                email.includes(query) ||
                headline.includes(query) ||
                jobTitle.includes(query);

            const matchesStage =
                stageFilter === "all" ||
                application.stage === stageFilter;

            const matchesJob =
                jobFilter === "all" ||
                application.job_id === jobFilter;

            return (
                matchesSearch &&
                matchesStage &&
                matchesJob
            );
        });
    }, [
        applications,
        search,
        stageFilter,
        jobFilter,
    ]);

    const total = applications.length;

    const reviewing = applications.filter(
        (application) =>
            application.stage === "reviewing",
    ).length;

    const shortlisted = applications.filter(
        (application) =>
            application.stage === "shortlisted",
    ).length;

    const interviews = applications.filter(
        (application) =>
            application.stage === "interview",
    ).length;

    const hired = applications.filter(
        (application) =>
            application.stage === "hired",
    ).length;

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <RefreshCw className="size-5 animate-spin" />
                    Applicantlar yuklanmoqda...
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Company Applications
                    </h1>

                    <p className="mt-1 text-muted-foreground">
                        Vakansiyalaringizga kelgan applicantlarni boshqaring.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        className={`size-4 ${refreshing ? "animate-spin" : ""
                            }`}
                    />

                    Refresh
                </button>
            </div>

            {/* Statistics */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Total
                        </span>

                        <Users className="size-5 text-muted-foreground" />
                    </div>

                    <p className="text-3xl font-bold">
                        {total}
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Reviewing
                        </span>

                        <Clock3 className="size-5 text-muted-foreground" />
                    </div>

                    <p className="text-3xl font-bold">
                        {reviewing}
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Shortlisted
                        </span>

                        <UserCheck className="size-5 text-muted-foreground" />
                    </div>

                    <p className="text-3xl font-bold">
                        {shortlisted}
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Interviews
                        </span>

                        <BriefcaseBusiness className="size-5 text-muted-foreground" />
                    </div>

                    <p className="text-3xl font-bold">
                        {interviews}
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Hired
                        </span>

                        <CheckCircle2 className="size-5 text-muted-foreground" />
                    </div>

                    <p className="text-3xl font-bold">
                        {hired}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px_220px]">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Applicant yoki vakansiya qidirish..."
                        className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <select
                    value={stageFilter}
                    onChange={(event) =>
                        setStageFilter(event.target.value)
                    }
                    className="h-11 rounded-lg border bg-background px-3 text-sm outline-none"
                >
                    <option value="all">
                        Barcha statuslar
                    </option>

                    {STAGES.map((stage) => (
                        <option
                            key={stage.value}
                            value={stage.value}
                        >
                            {stage.label}
                        </option>
                    ))}
                </select>

                <select
                    value={jobFilter}
                    onChange={(event) =>
                        setJobFilter(event.target.value)
                    }
                    className="h-11 rounded-lg border bg-background px-3 text-sm outline-none"
                >
                    <option value="all">
                        Barcha vakansiyalar
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

            {/* Applications */}
            {applications.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                    <Users className="mx-auto mb-4 size-10 text-muted-foreground" />

                    <h2 className="text-lg font-semibold">
                        Hozircha applicant yo‘q
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Vakansiyalaringizga arizalar kelganda ular shu yerda
                        ko‘rinadi.
                    </p>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                    <Search className="mx-auto mb-4 size-10 text-muted-foreground" />

                    <h2 className="text-lg font-semibold">
                        Natija topilmadi
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Qidiruv yoki filterlarni o‘zgartirib ko‘ring.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map((application) => (
                        <div
                            key={application.id}
                            className="rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md md:p-6"
                        >
                            {/* Applicant info */}
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-semibold">
                                            {application.resume?.full_name ||
                                                "Resume mavjud emas"}
                                        </h2>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStageClass(
                                                application.stage,
                                            )}`}
                                        >
                                            {getStageLabel(
                                                application.stage,
                                            )}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {application.resume?.headline ||
                                            "Headline ko‘rsatilmagan"}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <BriefcaseBusiness className="size-4" />

                                            {application.jobs.title}
                                        </span>

                                        {application.resume?.location && (
                                            <span>
                                                📍 {application.resume.location}
                                            </span>
                                        )}

                                        {application.resume?.email && (
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="size-4" />

                                                {application.resume.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Match score */}
                                <div className="shrink-0 rounded-xl border bg-muted/30 px-5 py-3 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        Match Score
                                    </p>

                                    <p className="mt-1 text-2xl font-bold">
                                        {application.match_score ?? 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Existing interview information */}
                            {application.stage === "interview" &&
                                application.interview_at && (
                                    <div className="mt-5 rounded-xl border bg-orange-500/5 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-5 text-orange-500" />

                                                    <p className="font-semibold">
                                                        Interview Scheduled
                                                    </p>
                                                </div>

                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {formatInterviewDate(
                                                        application.interview_at,
                                                    )}
                                                </p>

                                                {application.notes && (
                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                                        <span className="font-medium text-foreground">
                                                            Note:
                                                        </span>{" "}
                                                        {application.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openInterviewEditor(
                                                        application,
                                                    )
                                                }
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
                                            >
                                                <Calendar className="size-4" />
                                                Edit Interview
                                            </button>
                                        </div>
                                    </div>
                                )}

                            {/* Actions */}
                            <div className="mt-6 flex flex-col gap-3 border-t pt-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <label className="text-sm font-medium">
                                        Application status:
                                    </label>

                                    <select
                                        value={
                                            application.stage ||
                                            "submitted"
                                        }
                                        onChange={(event) =>
                                            updateApplicationStage(
                                                application.id,
                                                event.target.value,
                                            )
                                        }
                                        disabled={
                                            updatingId ===
                                            application.id
                                        }
                                        className="h-10 min-w-[180px] rounded-lg border bg-background px-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {STAGES.map((stage) => (
                                            <option
                                                key={stage.value}
                                                value={stage.value}
                                            >
                                                {stage.label}
                                            </option>
                                        ))}
                                    </select>

                                    {updatingId ===
                                        application.id && (
                                            <RefreshCw className="size-4 animate-spin text-muted-foreground" />
                                        )}
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    {application.resume && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedResume(
                                                    application.resume,
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                        >
                                            <Eye className="size-4" />
                                            View Resume
                                        </button>
                                    )}

                                    {application.resume?.email && (
                                        <a
                                            href={`mailto:${application.resume.email}`}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                                        >
                                            <Mail className="size-4" />
                                            Contact Applicant
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Interview editor */}
                            {editingInterviewId === application.id && (
                                <div className="mt-5 rounded-2xl border bg-muted/20 p-5">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-5" />

                                            <h3 className="text-lg font-semibold">
                                                Interview Details
                                            </h3>
                                        </div>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Applicant uchun interview sana,
                                            vaqt va qo‘shimcha note belgilang.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Date & time */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Interview date & time
                                            </label>

                                            <input
                                                type="datetime-local"
                                                value={interviewDateTime}
                                                onChange={(event) =>
                                                    setInterviewDateTime(
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Interview notes
                                            </label>

                                            <textarea
                                                value={interviewNotes}
                                                onChange={(event) =>
                                                    setInterviewNotes(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Masalan: Zoom orqali suhbat, 30 daqiqa..."
                                                rows={4}
                                                className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={closeInterviewEditor}
                                            disabled={
                                                savingInterviewId ===
                                                application.id
                                            }
                                            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                saveInterview(
                                                    application.id,
                                                )
                                            }
                                            disabled={
                                                savingInterviewId ===
                                                application.id
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {savingInterviewId ===
                                                application.id ? (
                                                <>
                                                    <RefreshCw className="size-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="size-4" />
                                                    Save Interview
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {application.resume?.skills &&
                                application.resume.skills.length > 0 && (
                                    <div className="mt-5">
                                        <p className="mb-2 text-sm font-medium">
                                            Skills
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {application.resume.skills.map(
                                                (skill, index) => (
                                                    <span
                                                        key={`${skill}-${index}`}
                                                        className="rounded-full bg-muted px-3 py-1 text-xs"
                                                    >
                                                        {skill}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Summary */}
                            {application.resume?.summary && (
                                <div className="mt-5">
                                    <p className="mb-1 text-sm font-medium">
                                        Summary
                                    </p>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                        {application.resume.summary}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Resume modal */}
            {selectedResume && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedResume(null)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-6 shadow-xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {selectedResume.full_name ||
                                        "Applicant Resume"}
                                </h2>

                                <p className="mt-1 text-muted-foreground">
                                    {selectedResume.headline ||
                                        "Headline ko‘rsatilmagan"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedResume(null)
                                }
                                className="rounded-lg border px-3 py-2 text-sm transition hover:bg-muted"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-6">
                            {(selectedResume.email ||
                                selectedResume.phone ||
                                selectedResume.location) && (
                                    <section>
                                        <h3 className="mb-2 text-lg font-semibold">
                                            Contact
                                        </h3>

                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            {selectedResume.email && (
                                                <p>
                                                    Email:{" "}
                                                    {selectedResume.email}
                                                </p>
                                            )}

                                            {selectedResume.phone && (
                                                <p>
                                                    Phone:{" "}
                                                    {selectedResume.phone}
                                                </p>
                                            )}

                                            {selectedResume.location && (
                                                <p>
                                                    Location:{" "}
                                                    {selectedResume.location}
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                )}

                            {selectedResume.about && (
                                <section>
                                    <h3 className="mb-2 text-lg font-semibold">
                                        About
                                    </h3>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                        {selectedResume.about}
                                    </p>
                                </section>
                            )}

                            {selectedResume.summary && (
                                <section>
                                    <h3 className="mb-2 text-lg font-semibold">
                                        Summary
                                    </h3>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                        {selectedResume.summary}
                                    </p>
                                </section>
                            )}

                            {selectedResume.skills &&
                                selectedResume.skills.length > 0 && (
                                    <section>
                                        <h3 className="mb-2 text-lg font-semibold">
                                            Skills
                                        </h3>

                                        <div className="flex flex-wrap gap-2">
                                            {selectedResume.skills.map(
                                                (skill, index) => (
                                                    <span
                                                        key={`${skill}-${index}`}
                                                        className="rounded-full bg-muted px-3 py-1 text-sm"
                                                    >
                                                        {skill}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </section>
                                )}

                            {selectedResume.experience && (
                                <section>
                                    <h3 className="mb-2 text-lg font-semibold">
                                        Experience
                                    </h3>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                        {selectedResume.experience}
                                    </p>
                                </section>
                            )}

                            {selectedResume.education && (
                                <section>
                                    <h3 className="mb-2 text-lg font-semibold">
                                        Education
                                    </h3>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                        {selectedResume.education}
                                    </p>
                                </section>
                            )}

                            {selectedResume.languages && (
                                <section>
                                    <h3 className="mb-2 text-lg font-semibold">
                                        Languages
                                    </h3>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                        {selectedResume.languages}
                                    </p>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}