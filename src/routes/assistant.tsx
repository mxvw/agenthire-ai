import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI career assistant — AgentHire AI" },
      {
        name: "description",
        content:
          "Ask the AgentHire career assistant to find roles and get personalized career recommendations.",
      },
    ],
  }),
  component: AssistantPage,
});

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Resume {
  id: string;
  user_id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  summary: string | null;
  about: string | null;
  skills: string[] | null;
  experience: string | null;
  education: string | null;
  languages: string | null;
}

interface Job {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  work_mode: string | null;
  employment_type: string | null;
  seniority: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  skills: string[] | null;
  created_at: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function formatSalary(job: Job) {
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min}–$${job.salary_max}`;
  }

  if (job.salary_min) {
    return `from $${job.salary_min}`;
  }

  if (job.salary_max) {
    return `up to $${job.salary_max}`;
  }

  return "Salary not specified";
}

function calculateMatch(
  resumeSkills: string[],
  jobSkills: string[],
) {
  if (!jobSkills.length) {
    return {
      score: 0,
      matched: [],
      missing: [],
    };
  }

  const userSkills = resumeSkills.map(normalize);

  const matched = jobSkills.filter((skill) =>
    userSkills.some(
      (userSkill) =>
        userSkill === normalize(skill) ||
        userSkill.includes(normalize(skill)) ||
        normalize(skill).includes(userSkill),
    )
  );

  const missing = jobSkills.filter(
    (skill) =>
      !matched.some(
        (matchedSkill) => normalize(matchedSkill) === normalize(skill),
      ),
  );

  const score = Math.round(
    (matched.length / jobSkills.length) * 100,
  );

  return {
    score,
    matched,
    missing,
  };
}

async function getUserResume(): Promise<Resume | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Resume error:", error);
    throw error;
  }

  return data;
}

async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id,title,company,location,work_mode,employment_type,seniority,salary_min,salary_max,description,skills,created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs error:", error);
    throw error;
  }

  return data ?? [];
}

async function answer(
  input: string,
  userResume: Resume | null,
  jobs: Job[],
): Promise<string> {
  const q = normalize(input);

  if (!jobs.length) {
    return "Hozircha bazada hech qanday vakansiya topilmadi.";
  }

  if (!userResume) {
    return (
      "Sizda hali resume mavjud emas. Avval Resume sahifasida profilingizni " +
      "to‘ldiring, shunda men sizga mos vakansiyalarni topa olaman."
    );
  }

  const resumeSkills = userResume.skills ?? [];

  if (
    q.includes("best") ||
    q.includes("match") ||
    q.includes("mos") ||
    q.includes("eng yaxshi") ||
    q.includes("menga ish")
  ) {
    const ranked = jobs
      .map((job) => {
        const match = calculateMatch(
          resumeSkills,
          job.skills ?? [],
        );

        return {
          job,
          ...match,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (!ranked.length) {
      return "Sizga mos vakansiya topilmadi.";
    }

    return [
      "🎯 Sizning resume'ingiz asosida eng mos vakansiyalar:",
      "",
      ...ranked.map(
        (item, index) =>
          `${index + 1}. ${item.job.title} — ${item.score}% match\n` +
          `🏢 ${item.job.company ?? "Company not specified"}\n` +
          `📍 ${item.job.location ?? "Location not specified"} · ${
            item.job.work_mode ?? "Work mode not specified"
          }\n` +
          `💰 ${formatSalary(item.job)}\n` +
          `✅ Matched: ${
            item.matched.length ? item.matched.join(", ") : "No matching skills"
          }\n` +
          `❌ Missing: ${
            item.missing.length ? item.missing.join(", ") : "Nothing"
          }`,
      ),
    ].join("\n\n");
  }

  if (
    q.includes("remote") ||
    q.includes("masofaviy") ||
    q.includes("uydan")
  ) {
    const remoteJobs = jobs.filter((job) =>
      normalize(job.work_mode ?? "").includes("remote")
    );

    if (!remoteJobs.length) {
      return "Hozircha remote vakansiyalar topilmadi.";
    }

    return [
      "🌍 Remote vakansiyalar:",
      "",
      ...remoteJobs.slice(0, 7).map(
        (job, index) =>
          `${index + 1}. ${job.title}\n` +
          `🏢 ${job.company ?? "Company not specified"}\n` +
          `💰 ${formatSalary(job)}\n` +
          `📍 ${job.location ?? "Location not specified"}`,
      ),
    ].join("\n\n");
  }

  if (
    q.includes("near me") ||
    q.includes("yaqin") ||
    q.includes("toshkent")
  ) {
    const location = userResume.location
      ? normalize(userResume.location)
      : "toshkent";

    const locationJobs = jobs.filter((job) =>
      normalize(job.location ?? "").includes(location)
    );

    if (!locationJobs.length) {
      return `📍 ${
        userResume.location ?? "Sizning joylashuvingiz"
      } bo‘yicha vakansiya topilmadi.`;
    }

    return [
      `📍 ${
        userResume.location ?? "Sizning joylashuvingiz"
      } bo‘yicha vakansiyalar:`,
      "",
      ...locationJobs.slice(0, 7).map(
        (job, index) =>
          `${index + 1}. ${job.title}\n` +
          `🏢 ${job.company ?? "Company not specified"}\n` +
          `💰 ${formatSalary(job)}\n` +
          `💼 ${job.work_mode ?? "Work mode not specified"}`,
      ),
    ].join("\n\n");
  }

  const searchWords = q
    .split(/\s+/)
    .filter((word) => word.length >= 3);

  const results = jobs.filter((job) => {
    const searchableText = [
      job.title,
      job.company,
      job.location,
      job.work_mode,
      job.employment_type,
      job.seniority,
      job.description,
      ...(job.skills ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchWords.some((word) => searchableText.includes(word));
  });

  if (!results.length) {
    return (
      "🔎 Bu so‘rov bo‘yicha vakansiya topilmadi.\n\n" +
      "Masalan:\n" +
      "• React jobs\n" +
      "• Remote frontend jobs\n" +
      "• Best matches\n" +
      "• Toshkentdagi ishlar"
    );
  }

  return [
    "🔎 Topilgan vakansiyalar:",
    "",
    ...results.slice(0, 7).map(
      (job, index) =>
        `${index + 1}. ${job.title}\n` +
        `🏢 ${job.company ?? "Company not specified"}\n` +
        `📍 ${job.location ?? "Location not specified"} · ${
          job.work_mode ?? "Work mode not specified"
        }\n` +
        `💰 ${formatSalary(job)}\n` +
        `🛠 ${job.skills?.join(", ") || "Skills not specified"}`,
    ),
  ].join("\n\n");
}

function AssistantPage() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Salom! 👋 Men AgentHire AI Career Assistantman.\n\n" +
        "Men sizning resume'ingiz va bazadagi real vakansiyalar asosida yordam bera olaman.\n\n" +
        "Masalan:\n" +
        "• Menga eng mos ishlarni top\n" +
        "• Remote React ishlarni top\n" +
        "• Toshkentdagi frontend ishlarni top\n" +
        "• React bo‘yicha ishlarni top",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Faqat chat oynasining scrollini boshqaradi.
  // Butun sahifani scroll qilmaydi.
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          navigate({
            to: "/auth",
            search: {
              redirect: "/assistant",
            },
          });

          return;
        }

        const [resumeData, jobsData] = await Promise.all([
          getUserResume(),
          getJobs(),
        ]);

        if (!mounted) return;

        setResume(resumeData);
        setJobs(jobsData);
      } catch (error) {
        console.error("Assistant loading error:", error);
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
  
    const text = input.trim();
  
    if (!text || loading) return;
  
    setInput("");
  
    setMessages((messages) => [
      ...messages,
      {
        role: "user",
        content: text,
      },
    ]);
  
    setLoading(true);
  
    // AI Assistant hozircha ishga tushirilmagan
    setTimeout(() => {
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            "🚀 AI Career Assistant tez orada ishga tushadi. Hozircha biz ushbu funksiyani takomillashtirmoqdamiz. Tez orada sizga ish qidirish, CV va career bo‘yicha AI yordamchi xizmatlarini taqdim etamiz.",
        },
      ]);
  
      setLoading(false);
    }, 700);
  }

  if (initialLoading) {
    return (
      <PageShell
        icon={<Bot className="size-3.5" />}
        title="AI career assistant"
        description="Personalized career assistant powered by your profile and live jobs."
      >
        <div className="panel mx-auto max-w-3xl p-5">
          <p className="text-sm text-muted-foreground">
            Assistant yuklanmoqda...
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      icon={<Bot className="size-3.5" />}
      title="AI career assistant"
      description="Personalized career assistant powered by your profile and live jobs."
    >
      <div className="panel mx-auto flex h-[calc(100dvh-180px)] max-w-3xl flex-col overflow-hidden">
        {/* CHAT MESSAGES */}
        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[82%] ${
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-surface-2 text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* AI typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />

                    <span
                      className="size-1.5 animate-pulse rounded-full bg-muted-foreground"
                      style={{
                        animationDelay: "150ms",
                      }}
                    />

                    <span
                      className="size-1.5 animate-pulse rounded-full bg-muted-foreground"
                      style={{
                        animationDelay: "300ms",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="shrink-0 border-t bg-background/80 p-3 backdrop-blur-md sm:p-4">
          <form
            onSubmit={send}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Masalan: Menga eng mos ishlarni top"
              aria-label="Message the assistant"
              disabled={loading}
              className="h-11 rounded-xl"
            />

            <Button
              type="submit"
              size="icon"
              aria-label="Send"
              disabled={loading || !input.trim()}
              className="size-11 shrink-0 rounded-xl"
            >
              <Send className="size-4" />
            </Button>
          </form>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            AgentHire AI real vakansiyalar va resume ma'lumotlaringizdan
            foydalanadi.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
