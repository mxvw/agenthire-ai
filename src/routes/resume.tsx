import { supabase } from "@/lib/supabase";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  FileSearch,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Upload,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { JobCard } from "@/components/job-card";
import { PageShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { matchScore } from "@/lib/data";

type Experience = {
  id: string;
  role: string;
  company: string;
  period: string;
  summary: string;
};

type Education = {
  id: string;
  degree: string;
  school: string;
  period: string;
};

type Language = {
  id: string;
  name: string;
  level: string;
};

type ResumeRow = {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  about: string | null;
  skills: unknown;
  experience: unknown;
  education: unknown;
  languages: unknown;
};

function createId() {
  return crypto.randomUUID();
}

function parseSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string"
  );
}

function parseExperience(value: unknown): Experience[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is Experience =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Experience).id === "string" &&
      typeof (item as Experience).role === "string" &&
      typeof (item as Experience).company === "string" &&
      typeof (item as Experience).period === "string" &&
      typeof (item as Experience).summary === "string"
  );
}

function parseEducation(value: unknown): Education[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is Education =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Education).id === "string" &&
      typeof (item as Education).degree === "string" &&
      typeof (item as Education).school === "string" &&
      typeof (item as Education).period === "string"
  );
}

function parseLanguages(value: unknown): Language[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is Language =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Language).id === "string" &&
      typeof (item as Language).name === "string" &&
      typeof (item as Language).level === "string"
  );
}

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      {
        title: "Resume analysis & AI job matching — AgentHire AI",
      },
      {
        name: "description",
        content:
          "See your ATS score, strengths, gaps and the open roles your resume matches best.",
      },
      {
        property: "og:title",
        content: "Resume analysis & AI job matching — AgentHire AI",
      },
      {
        property: "og:description",
        content:
          "ATS scoring, explainable strengths, gaps and ranked role matches.",
      },
      {
        property: "og:type",
        content: "profile",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const navigate = useNavigate();

  const [resumeData, setResumeData] = useState<ResumeRow | null>(null);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillsSaving, setSkillsSaving] = useState(false);

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [editingExperienceId, setEditingExperienceId] =
    useState<string | null>(null);

  const [editingEducationId, setEditingEducationId] =
    useState<string | null>(null);

  const [editingLanguageId, setEditingLanguageId] =
    useState<string | null>(null);

  const [experienceForm, setExperienceForm] = useState({
    role: "",
    company: "",
    period: "",
    summary: "",
  });

  const [educationForm, setEducationForm] = useState({
    degree: "",
    school: "",
    period: "",
  });

  const [languageForm, setLanguageForm] = useState({
    name: "",
    level: "",
  });

  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    about: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadResume() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          navigate({
            to: "/auth",
            search: {
              redirect: "/resume",
            },
          });

          return;
        }

        const { data, error } = await supabase
          .from("resumes")
          .select(`
            id,
            user_id,
            full_name,
            headline,
            email,
            phone,
            location,
            about,
            skills,
            experience,
            education,
            languages
          `)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error("Resume loading error:", error);

          toast.error(
            "Resume ma'lumotlarini yuklashda xatolik."
          );

          return;
        }

        let currentResume: ResumeRow | null = null;

        if (data) {
          currentResume = data as ResumeRow;
        } else {
          const { data: newResume, error: insertError } =
            await supabase
              .from("resumes")
              .insert({
                user_id: user.id,
                full_name:
                  user.email?.split("@")[0] ?? "New User",
                headline: "Frontend Developer",
                email: user.email ?? null,
                phone: null,
                location: null,
                about: null,
                skills: [],
                experience: [],
                education: [],
                languages: [],
              })
              .select(`
                id,
                user_id,
                full_name,
                headline,
                email,
                phone,
                location,
                about,
                skills,
                experience,
                education,
                languages
              `)
              .single();

          if (!mounted) return;

          if (insertError) {
            console.error(
              "Resume insert error:",
              insertError
            );

            toast.error("Resume yaratishda xatolik.");
            return;
          }

          currentResume = newResume as ResumeRow;

          toast.success("Resume yaratildi!");
        }

        if (!currentResume) return;

        setResumeData(currentResume);

        setSkills(parseSkills(currentResume.skills));
        setExperiences(
          parseExperience(currentResume.experience)
        );
        setEducation(
          parseEducation(currentResume.education)
        );
        setLanguages(
          parseLanguages(currentResume.languages)
        );

        setFormData({
          full_name: currentResume.full_name ?? "",
          headline: currentResume.headline ?? "",
          email: currentResume.email ?? "",
          phone: currentResume.phone ?? "",
          location: currentResume.location ?? "",
          about: currentResume.about ?? "",
        });

        const {
          data: jobsData,
          error: jobsError,
        } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (!mounted) return;

        if (jobsError) {
          console.error(
            "Jobs loading error:",
            jobsError
          );
        } else {
          setJobs(
            (jobsData ?? []).map((job) => ({
              ...job,
              skills: parseSkills(job.skills),
            }))
          );
        }
      } catch (error) {
        console.error(
          "Unexpected resume error:",
          error
        );

        toast.error(
          "Resume bilan ishlashda xatolik yuz berdi."
        );
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingJobs(false);
        }
      }
    }

    loadResume();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSave() {
    if (!resumeData) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("resumes")
      .update({
        full_name: formData.full_name.trim(),
        headline: formData.headline.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        location: formData.location.trim() || null,
        about: formData.about.trim() || null,
        skills,
        experience: experiences,
        education,
        languages,
      })
      .eq("id", resumeData.id)
      .select(`
        id,
        user_id,
        full_name,
        headline,
        email,
        phone,
        location,
        about,
        skills,
        experience,
        education,
        languages
      `)
      .single();

    setSaving(false);

    if (error) {
      console.error("Resume save error:", error);
      toast.error("Resume saqlashda xatolik.");
      return;
    }

    const row = data as ResumeRow;

    setResumeData(row);

    setSkills(parseSkills(row.skills));
    setExperiences(parseExperience(row.experience));
    setEducation(parseEducation(row.education));
    setLanguages(parseLanguages(row.languages));

    setIsEditing(false);

    toast.success("Resume saqlandi!");
  }

  async function saveResumeArrays(
    nextSkills: string[],
    nextExperiences: Experience[],
    nextEducation: Education[],
    nextLanguages: Language[]
  ) {
    if (!resumeData) return false;

    const { data, error } = await supabase
      .from("resumes")
      .update({
        skills: nextSkills,
        experience: nextExperiences,
        education: nextEducation,
        languages: nextLanguages,
      })
      .eq("id", resumeData.id)
      .select(`
        id,
        user_id,
        full_name,
        headline,
        email,
        phone,
        location,
        about,
        skills,
        experience,
        education,
        languages
      `)
      .single();

    if (error) {
      console.error(
        "Resume arrays save error:",
        error
      );

      toast.error(
        "Ma'lumotlarni saqlashda xatolik."
      );

      return false;
    }

    const row = data as ResumeRow;

    setResumeData(row);

    setSkills(parseSkills(row.skills));
    setExperiences(parseExperience(row.experience));
    setEducation(parseEducation(row.education));
    setLanguages(parseLanguages(row.languages));

    return true;
  }

  async function handleSaveSkills() {
    const cleanSkills = skills
      .map((skill) => skill.trim())
      .filter(Boolean);

    setSkillsSaving(true);

    const success = await saveResumeArrays(
      cleanSkills,
      experiences,
      education,
      languages
    );

    setSkillsSaving(false);

    if (success) {
      toast.success("Skills saqlandi!");
    }
  }

  function handleAddSkill() {
    const skill = newSkill.trim();

    if (!skill) return;

    if (
      skills.some(
        (item) =>
          item.toLowerCase() === skill.toLowerCase()
      )
    ) {
      toast.error(
        "Bu skill allaqachon qo‘shilgan."
      );

      return;
    }

    setSkills((current) => [
      ...current,
      skill,
    ]);

    setNewSkill("");
  }

  function handleRemoveSkill(
    skillToRemove: string
  ) {
    setSkills((current) =>
      current.filter(
        (skill) => skill !== skillToRemove
      )
    );
  }

  function resetExperienceForm() {
    setExperienceForm({
      role: "",
      company: "",
      period: "",
      summary: "",
    });

    setEditingExperienceId(null);
  }

  function startEditExperience(
    experience: Experience
  ) {
    setExperienceForm({
      role: experience.role,
      company: experience.company,
      period: experience.period,
      summary: experience.summary,
    });

    setEditingExperienceId(experience.id);
  }

  async function handleSaveExperience() {
    const role = experienceForm.role.trim();
    const company =
      experienceForm.company.trim();
    const period =
      experienceForm.period.trim();
    const summary =
      experienceForm.summary.trim();

    if (!role || !company) {
      toast.error(
        "Lavozim va kompaniyani kiriting."
      );

      return;
    }

    let nextExperiences: Experience[];

    if (editingExperienceId) {
      nextExperiences = experiences.map(
        (item) =>
          item.id === editingExperienceId
            ? {
                ...item,
                role,
                company,
                period,
                summary,
              }
            : item
      );
    } else {
      nextExperiences = [
        ...experiences,
        {
          id: createId(),
          role,
          company,
          period,
          summary,
        },
      ];
    }

    const success = await saveResumeArrays(
      skills,
      nextExperiences,
      education,
      languages
    );

    if (success) {
      const wasEditing =
        editingExperienceId !== null;

      resetExperienceForm();

      toast.success(
        wasEditing
          ? "Experience yangilandi!"
          : "Experience qo‘shildi!"
      );
    }
  }

  async function handleDeleteExperience(
    id: string
  ) {
    const nextExperiences =
      experiences.filter(
        (item) => item.id !== id
      );

    const success = await saveResumeArrays(
      skills,
      nextExperiences,
      education,
      languages
    );

    if (success) {
      if (editingExperienceId === id) {
        resetExperienceForm();
      }

      toast.success(
        "Experience o‘chirildi!"
      );
    }
  }

  function resetEducationForm() {
    setEducationForm({
      degree: "",
      school: "",
      period: "",
    });

    setEditingEducationId(null);
  }

  function startEditEducation(
    item: Education
  ) {
    setEducationForm({
      degree: item.degree,
      school: item.school,
      period: item.period,
    });

    setEditingEducationId(item.id);
  }

  async function handleSaveEducation() {
    const degree =
      educationForm.degree.trim();
    const school =
      educationForm.school.trim();
    const period =
      educationForm.period.trim();

    if (!degree || !school) {
      toast.error(
        "Daraja va o‘quv muassasasini kiriting."
      );

      return;
    }

    let nextEducation: Education[];

    if (editingEducationId) {
      nextEducation = education.map(
        (item) =>
          item.id === editingEducationId
            ? {
                ...item,
                degree,
                school,
                period,
              }
            : item
      );
    } else {
      nextEducation = [
        ...education,
        {
          id: createId(),
          degree,
          school,
          period,
        },
      ];
    }

    const success = await saveResumeArrays(
      skills,
      experiences,
      nextEducation,
      languages
    );

    if (success) {
      const wasEditing =
        editingEducationId !== null;

      resetEducationForm();

      toast.success(
        wasEditing
          ? "Education yangilandi!"
          : "Education qo‘shildi!"
      );
    }
  }

  async function handleDeleteEducation(
    id: string
  ) {
    const nextEducation =
      education.filter(
        (item) => item.id !== id
      );

    const success = await saveResumeArrays(
      skills,
      experiences,
      nextEducation,
      languages
    );

    if (success) {
      if (editingEducationId === id) {
        resetEducationForm();
      }

      toast.success(
        "Education o‘chirildi!"
      );
    }
  }

  function resetLanguageForm() {
    setLanguageForm({
      name: "",
      level: "",
    });

    setEditingLanguageId(null);
  }

  function startEditLanguage(
    item: Language
  ) {
    setLanguageForm({
      name: item.name,
      level: item.level,
    });

    setEditingLanguageId(item.id);
  }

  async function handleSaveLanguage() {
    const name =
      languageForm.name.trim();
    const level =
      languageForm.level.trim();

    if (!name || !level) {
      toast.error(
        "Til va darajasini kiriting."
      );

      return;
    }

    let nextLanguages: Language[];

    if (editingLanguageId) {
      nextLanguages = languages.map(
        (item) =>
          item.id === editingLanguageId
            ? {
                ...item,
                name,
                level,
              }
            : item
      );
    } else {
      nextLanguages = [
        ...languages,
        {
          id: createId(),
          name,
          level,
        },
      ];
    }

    const success = await saveResumeArrays(
      skills,
      experiences,
      education,
      nextLanguages
    );

    if (success) {
      const wasEditing =
        editingLanguageId !== null;

      resetLanguageForm();

      toast.success(
        wasEditing
          ? "Language yangilandi!"
          : "Language qo‘shildi!"
      );
    }
  }

  async function handleDeleteLanguage(
    id: string
  ) {
    const nextLanguages =
      languages.filter(
        (item) => item.id !== id
      );

    const success = await saveResumeArrays(
      skills,
      experiences,
      education,
      nextLanguages
    );

    if (success) {
      if (editingLanguageId === id) {
        resetLanguageForm();
      }

      toast.success(
        "Language o‘chirildi!"
      );
    }
  }

  function cancelEditing() {
    if (!resumeData) return;

    setFormData({
      full_name: resumeData.full_name ?? "",
      headline: resumeData.headline ?? "",
      email: resumeData.email ?? "",
      phone: resumeData.phone ?? "",
      location: resumeData.location ?? "",
      about: resumeData.about ?? "",
    });

    setSkills(
      parseSkills(resumeData.skills)
    );

    setExperiences(
      parseExperience(
        resumeData.experience
      )
    );

    setEducation(
      parseEducation(
        resumeData.education
      )
    );

    setLanguages(
      parseLanguages(
        resumeData.languages
      )
    );

    setNewSkill("");

    resetExperienceForm();
    resetEducationForm();
    resetLanguageForm();

    setIsEditing(false);
  }

  if (loading) {
    return (
      <PageShell
        icon={
          <FileSearch className="size-3.5" />
        }
        title="Resume intelligence"
        description="Your resume is loading..."
      >
        <div className="panel p-6">
          <p className="text-sm text-muted-foreground">
            Resume ma'lumotlari yuklanmoqda...
          </p>
        </div>
      </PageShell>
    );
  }

  if (!resumeData) {
    return (
      <PageShell
        icon={
          <FileSearch className="size-3.5" />
        }
        title="Resume intelligence"
        description="Your resume could not be loaded."
      >
        <div className="panel p-6">
          <p className="text-sm text-muted-foreground">
            Resume ma'lumotlari topilmadi.
          </p>
        </div>
      </PageShell>
    );
  }

  const matches = jobs
    .map((job) => ({
      job,
      score: matchScore(skills, job).score,
    }))
    .sort(
      (a, b) => b.score - a.score
    )
    .slice(0, 4);

  const atsScore =
    skills.length > 0
      ? Math.min(
          100,
          Math.round(
            (skills.length / 10) * 100
          )
        )
      : 0;

  const strengths =
    skills.length > 0
      ? [
          `${skills.length} ta professional skill qo‘shilgan`,
          "Resume profile ma'lumotlari to‘ldirilgan",
          experiences.length > 0
            ? `${experiences.length} ta ish tajribasi mavjud`
            : "Experience qo‘shish mumkin",
        ]
      : [
          "Professional skills hali qo‘shilmagan",
          "Skills qo‘shsangiz matching yaxshilanadi",
          "Resume profilingizni to‘ldiring",
        ];

  const gaps = [
    ...(skills.length === 0
      ? ["Professional skills qo‘shilmagan"]
      : []),
    ...(experiences.length === 0
      ? ["Work experience qo‘shilmagan"]
      : []),
    ...(education.length === 0
      ? ["Education ma'lumotlari qo‘shilmagan"]
      : []),
    ...(languages.length === 0
      ? ["Languages qo‘shilmagan"]
      : []),
  ];

  return (
    <PageShell
      icon={
        <FileSearch className="size-3.5" />
      }
      title="Resume intelligence"
      description="Your parsed profile, ATS readiness and the roles it maps to."
      action={
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  setIsEditing(true)
                }
              >
                <Pencil className="size-4" />
                Edit Resume
              </Button>

              <Button
                onClick={() =>
                  toast.info(
                    "Resume upload",
                    {
                      description:
                        "PDF resume upload will be added next.",
                    }
                  )
                }
              >
                <Upload className="size-4" />
                Upload new resume
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={cancelEditing}
                disabled={
                  saving || skillsSaving
                }
              >
                <X className="size-4" />
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                disabled={
                  saving || skillsSaving
                }
              >
                <Save className="size-4" />
                {saving
                  ? "Saving..."
                  : "Save changes"}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <div className="panel p-6">
            {!isEditing ? (
              <>
                <h2 className="text-lg font-semibold">
                  {resumeData.full_name}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {resumeData.headline}
                </p>

                <Separator className="my-5" />

                <div className="space-y-3 text-sm">
                  {resumeData.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Email
                      </p>

                      <p>
                        {resumeData.email}
                      </p>
                    </div>
                  )}

                  {resumeData.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Phone
                      </p>

                      <p>
                        {resumeData.phone}
                      </p>
                    </div>
                  )}

                  {resumeData.location && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Location
                      </p>

                      <p>
                        {resumeData.location}
                      </p>
                    </div>
                  )}

                  {resumeData.about && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        About
                      </p>

                      <p className="mt-1 text-muted-foreground">
                        {resumeData.about}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Full name
                  </label>

                  <input
                    type="text"
                    value={
                      formData.full_name
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        full_name:
                          e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Professional headline
                  </label>

                  <input
                    type="text"
                    value={
                      formData.headline
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        headline:
                          e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Frontend Developer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email:
                          e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone:
                          e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+998 90 123 45 67"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Location
                  </label>

                  <input
                    type="text"
                    value={
                      formData.location
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location:
                          e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tashkent, Uzbekistan"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    About
                  </label>

                  <textarea
                    value={formData.about}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        about:
                          e.target.value,
                      })
                    }
                    rows={5}
                    className="mt-1.5 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell employers about yourself..."
                  />
                </div>
              </div>
            )}

            <Separator className="my-5" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                ATS readiness
              </span>

              <span className="font-semibold text-primary">
                {atsScore}/100
              </span>
            </div>

            <Progress
              value={atsScore}
              className="mt-2"
            />

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Skills
                </p>

                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setIsEditing(true)
                    }
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) =>
                        setNewSkill(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter"
                        ) {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="e.g. React"
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />

                    <Button
                      type="button"
                      onClick={
                        handleAddSkill
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center gap-1 font-normal"
                    >
                      {skill}

                      {isEditing && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSkill(
                              skill
                            )
                          }
                          className="ml-1 rounded-full text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skills added yet.
                  </p>
                )}
              </div>

              {isEditing && (
                <Button
                  className="mt-3"
                  variant="outline"
                  size="sm"
                  onClick={
                    handleSaveSkills
                  }
                  disabled={skillsSaving}
                >
                  <Save className="size-3.5" />

                  {skillsSaving
                    ? "Saving..."
                    : "Save skills"}
                </Button>
              )}
            </div>

            <Separator className="my-5" />

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Languages
                </p>

                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={
                      resetLanguageForm
                    }
                  >
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                )}
              </div>

              {languages.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {languages.map(
                    (language) => (
                      <li
                        key={language.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-muted-foreground">
                            {language.name}
                          </span>

                          <span className="ml-2">
                            {language.level}
                          </span>
                        </div>

                        {isEditing && (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                startEditLanguage(
                                  language
                                )
                              }
                            >
                              <Pencil className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteLanguage(
                                  language.id
                                )
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No languages added yet.
                </p>
              )}

              {isEditing && (
                <div className="mt-4 space-y-3 rounded-md border border-border p-3">
                  <input
                    type="text"
                    value={
                      languageForm.name
                    }
                    onChange={(e) =>
                      setLanguageForm({
                        ...languageForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Language e.g. English"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />

                  <input
                    type="text"
                    value={
                      languageForm.level
                    }
                    onChange={(e) =>
                      setLanguageForm({
                        ...languageForm,
                        level:
                          e.target.value,
                      })
                    }
                    placeholder="Level e.g. B2"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={
                        handleSaveLanguage
                      }
                    >
                      <Save className="size-3.5" />

                      {editingLanguageId
                        ? "Update"
                        : "Add"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={
                        resetLanguageForm
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="panel p-6">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4 text-primary" />
              Strengths
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {strengths.map(
                (strength) => (
                  <li key={strength}>
                    · {strength}
                  </li>
                )
              )}
            </ul>

            <h3 className="mt-6 flex items-center gap-2 text-sm font-medium">
              <TriangleAlert className="size-4 text-signal" />
              Gaps to close
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {gaps.length > 0 ? (
                gaps.map((gap) => (
                  <li key={gap}>
                    · {gap}
                  </li>
                ))
              ) : (
                <li>
                  · Resume profilingiz yaxshi
                  to‘ldirilgan.
                </li>
              )}
            </ul>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Experience
              </h2>

              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    resetExperienceForm
                  }
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              )}
            </div>

            {experiences.length > 0 ? (
              <ol className="mt-4 space-y-5">
                {experiences.map(
                  (experience) => (
                    <li
                      key={experience.id}
                      className="border-l border-border pl-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {experience.role}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {experience.company}

                            {experience.period
                              ? ` · ${experience.period}`
                              : ""}
                          </p>

                          {experience.summary && (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {
                                experience.summary
                              }
                            </p>
                          )}
                        </div>

                        {isEditing && (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                startEditExperience(
                                  experience
                                )
                              }
                            >
                              <Pencil className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteExperience(
                                  experience.id
                                )
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                )}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No experience added yet.
              </p>
            )}

            {isEditing && (
              <div className="mt-6 space-y-3 rounded-md border border-border p-4">
                <p className="text-sm font-medium">
                  {editingExperienceId
                    ? "Edit experience"
                    : "Add experience"}
                </p>

                <input
                  type="text"
                  value={
                    experienceForm.role
                  }
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      role: e.target.value,
                    })
                  }
                  placeholder="Job title e.g. Frontend Developer"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="text"
                  value={
                    experienceForm.company
                  }
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      company:
                        e.target.value,
                    })
                  }
                  placeholder="Company"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="text"
                  value={
                    experienceForm.period
                  }
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      period:
                        e.target.value,
                    })
                  }
                  placeholder="Period e.g. 2024 — 2026"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <textarea
                  value={
                    experienceForm.summary
                  }
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      summary:
                        e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Describe your responsibilities and achievements..."
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={
                      handleSaveExperience
                    }
                  >
                    <Save className="size-3.5" />

                    {editingExperienceId
                      ? "Update"
                      : "Add"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={
                      resetExperienceForm
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Education
              </h2>

              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    resetEducationForm
                  }
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              )}
            </div>

            {education.length > 0 ? (
              <div className="mt-4 space-y-4">
                {education.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {item.degree}
                      </span>{" "}
                      — {item.school}

                      {item.period
                        ? ` (${item.period})`
                        : ""}
                    </p>

                    {isEditing && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            startEditEducation(
                              item
                            )
                          }
                        >
                          <Pencil className="size-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteEducation(
                              item.id
                            )
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No education added yet.
              </p>
            )}

            {isEditing && (
              <div className="mt-6 space-y-3 rounded-md border border-border p-4">
                <p className="text-sm font-medium">
                  {editingEducationId
                    ? "Edit education"
                    : "Add education"}
                </p>

                <input
                  type="text"
                  value={
                    educationForm.degree
                  }
                  onChange={(e) =>
                    setEducationForm({
                      ...educationForm,
                      degree:
                        e.target.value,
                    })
                  }
                  placeholder="Degree e.g. Bachelor's Degree"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="text"
                  value={
                    educationForm.school
                  }
                  onChange={(e) =>
                    setEducationForm({
                      ...educationForm,
                      school:
                        e.target.value,
                    })
                  }
                  placeholder="School / University"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="text"
                  value={
                    educationForm.period
                  }
                  onChange={(e) =>
                    setEducationForm({
                      ...educationForm,
                      period:
                        e.target.value,
                    })
                  }
                  placeholder="Period e.g. 2022 — 2026"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={
                      handleSaveEducation
                    }
                  >
                    <Save className="size-3.5" />

                    {editingEducationId
                      ? "Update"
                      : "Add"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={
                      resetEducationForm
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />

              <h2 className="text-lg font-semibold">
                Best-matched roles
              </h2>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="ml-auto"
              >
                <Link to="/jobs">
                  See all
                </Link>
              </Button>
            </div>

            {loadingJobs ? (
              <div className="panel p-6">
                <p className="text-sm text-muted-foreground">
                  Jobs yuklanmoqda...
                </p>
              </div>
            ) : matches.length > 0 ? (
              <div className="grid gap-4">
                {matches.map(
                  (match, index) => (
                    <JobCard
                      key={match.job.id}
                      job={match.job}
                      score={match.score}
                      index={index}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="panel p-6">
                <p className="text-sm text-muted-foreground">
                  Hozircha mos vakansiyalar
                  topilmadi.
                </p>

                <Button
                  asChild
                  variant="outline"
                  className="mt-4"
                >
                  <Link to="/jobs">
                    View jobs
                  </Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}