/**
 * Demo dataset for AgentHire AI.
 *
 * This module is the single source of truth for the app *and* for the WebMCP
 * tools. It is intentionally storage-agnostic: every accessor below is a pure
 * function over in-memory seed data, so swapping in Lovable Cloud / Supabase
 * later means replacing the bodies of the `queries` functions only.
 */

export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type Seniority = "junior" | "mid" | "senior" | "lead";

export interface Company {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  industry: string;
  size: string;
  hq: string;
  website: string;
}

export interface Job {
  id: string;
  slug: string;
  title: string;
  companyId: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  seniority: Seniority;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  postedAt: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  applicants: number;
  views: number;
}

export type ApplicationStage =
  | "submitted"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface Application {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  stage: ApplicationStage;
  matchScore: number;
  appliedAt: string;
  lastUpdatedAt: string;
  notes: string;
  interviewAt?: string;
}

export interface ResumeProfile {
  id: string;
  fullName: string;
  headline: string;
  email: string;
  location: string;
  yearsExperience: number;
  skills: string[];
  languages: { name: string; level: string }[];
  experience: { role: string; company: string; period: string; summary: string }[];
  education: { degree: string; school: string; period: string }[];
  strengths: string[];
  gaps: string[];
  atsScore: number;
}

export const companies: Company[] = [
  {
    id: "c-northwind",
    name: "Northwind Labs",
    logo: "NW",
    tagline: "Infrastructure for real-time data teams",
    industry: "Developer tools",
    size: "120-250",
    hq: "Berlin, Germany",
    website: "https://northwind.example.com",
  },
  {
    id: "c-payloop",
    name: "Payloop",
    logo: "PL",
    tagline: "Cross-border payouts for marketplaces",
    industry: "Fintech",
    size: "300-600",
    hq: "Tashkent, Uzbekistan",
    website: "https://payloop.example.com",
  },
  {
    id: "c-orbital",
    name: "Orbital Health",
    logo: "OH",
    tagline: "Clinical operations, automated",
    industry: "Health tech",
    size: "60-120",
    hq: "Remote-first",
    website: "https://orbitalhealth.example.com",
  },
  {
    id: "c-lumen",
    name: "Lumen Retail",
    logo: "LR",
    tagline: "Storefront intelligence for omnichannel brands",
    industry: "E-commerce",
    size: "800+",
    hq: "Warsaw, Poland",
    website: "https://lumenretail.example.com",
  },
  {
    id: "c-kepler",
    name: "Kepler Robotics",
    logo: "KR",
    tagline: "Warehouse autonomy at scale",
    industry: "Robotics",
    size: "250-500",
    hq: "Amsterdam, Netherlands",
    website: "https://kepler.example.com",
  },
];

function daysAgo(n: number): string {
  const d = new Date("2026-08-27T09:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

export const jobs: Job[] = [
  {
    id: "job-001",
    slug: "senior-frontend-engineer-northwind",
    title: "Senior Frontend Engineer",
    companyId: "c-northwind",
    location: "Berlin / Remote (EU)",
    workMode: "remote",
    employmentType: "full-time",
    seniority: "senior",
    salaryMin: 85000,
    salaryMax: 115000,
    currency: "EUR",
    postedAt: daysAgo(2),
    description:
      "Own the streaming query console used by thousands of data engineers every day. You will shape a product surface where latency, keyboard ergonomics and information density matter more than decoration.",
    responsibilities: [
      "Lead frontend architecture for the query console and dashboards",
      "Drive rendering performance for tables streaming 100k+ rows",
      "Partner with design on a keyboard-first interaction model",
      "Mentor three engineers and run frontend design reviews",
    ],
    requirements: [
      "5+ years building production React applications",
      "Deep TypeScript, state management and testing experience",
      "Comfort with WebSockets, virtualization and profiling",
      "Track record of shipping developer-facing UI",
    ],
    benefits: ["Remote-first across EU", "Learning budget €2,500/yr", "Equity", "27 vacation days"],
    skills: ["React", "TypeScript", "WebSockets", "Performance", "Design systems"],
    applicants: 84,
    views: 2140,
  },
  {
    id: "job-002",
    slug: "ai-engineer-payloop",
    title: "AI Engineer, Risk",
    companyId: "c-payloop",
    location: "Tashkent, Uzbekistan (Hybrid)",
    workMode: "hybrid",
    employmentType: "full-time",
    seniority: "mid",
    salaryMin: 36000,
    salaryMax: 58000,
    currency: "USD",
    postedAt: daysAgo(1),
    description:
      "Build the models and retrieval pipelines that decide, in under 200ms, whether a cross-border payout should clear. You will work close to the money and close to the metrics.",
    responsibilities: [
      "Ship fraud-scoring models into a low-latency decision service",
      "Design evaluation harnesses and drift monitoring",
      "Prototype LLM-assisted case review for the ops team",
    ],
    requirements: [
      "3+ years applied ML or AI engineering",
      "Strong Python plus one systems language",
      "Experience with feature stores and online inference",
      "Working English; Uzbek or Russian a plus",
    ],
    benefits: ["Hybrid 3/2", "Relocation support", "Annual bonus", "Private health"],
    skills: ["Python", "Machine learning", "LLM", "Feature engineering", "SQL"],
    applicants: 51,
    views: 1310,
  },
  {
    id: "job-003",
    slug: "product-designer-orbital",
    title: "Product Designer (Clinical Workflows)",
    companyId: "c-orbital",
    location: "Remote (Global)",
    workMode: "remote",
    employmentType: "full-time",
    seniority: "senior",
    salaryMin: 95000,
    salaryMax: 130000,
    currency: "USD",
    postedAt: daysAgo(4),
    description:
      "Design software that nurses actually want to open at 6am. You will spend real time in clinics, then turn what you see into calm, fast, unambiguous interfaces.",
    responsibilities: [
      "Own end-to-end design for scheduling and triage",
      "Run field research in partner clinics",
      "Extend the Orbital design system",
    ],
    requirements: [
      "Portfolio of complex operational software",
      "Comfort with ambiguity and regulated domains",
      "Fluency in prototyping tools and basic HTML/CSS literacy",
    ],
    benefits: ["Fully remote", "Quarterly onsites", "Home office stipend"],
    skills: ["Product design", "Research", "Design systems", "Prototyping"],
    applicants: 129,
    views: 3402,
  },
  {
    id: "job-004",
    slug: "backend-engineer-lumen",
    title: "Backend Engineer, Catalog",
    companyId: "c-lumen",
    location: "Warsaw, Poland (Onsite)",
    workMode: "onsite",
    employmentType: "full-time",
    seniority: "mid",
    salaryMin: 22000,
    salaryMax: 34000,
    currency: "EUR",
    postedAt: daysAgo(7),
    description:
      "Keep a 40-million-SKU catalog correct, searchable and fast during Black Friday traffic. Ownership is real: your service, your on-call, your call.",
    responsibilities: [
      "Evolve the catalog ingestion pipeline",
      "Own search indexing and relevance tuning",
      "Reduce p99 latency on the product API",
    ],
    requirements: [
      "3+ years backend with Go, Java or Kotlin",
      "Relational databases and event streaming",
      "Search engine experience (Elasticsearch/OpenSearch)",
    ],
    benefits: ["Onsite lunch", "Sport card", "Stock options"],
    skills: ["Go", "PostgreSQL", "Kafka", "Elasticsearch"],
    applicants: 62,
    views: 980,
  },
  {
    id: "job-005",
    slug: "data-analyst-payloop",
    title: "Data Analyst",
    companyId: "c-payloop",
    location: "Remote (CIS)",
    workMode: "remote",
    employmentType: "contract",
    seniority: "junior",
    salaryMin: 18000,
    salaryMax: 28000,
    currency: "USD",
    postedAt: daysAgo(3),
    description:
      "Turn payout telemetry into decisions the leadership team actually makes. Heavy SQL, light politics.",
    responsibilities: [
      "Build and maintain executive dashboards",
      "Run cohort and funnel analyses",
      "Automate weekly reporting",
    ],
    requirements: ["Strong SQL", "One BI tool in production", "Clear written communication"],
    benefits: ["Fully remote", "Flexible hours", "Contract-to-hire path"],
    skills: ["SQL", "Python", "BI", "Analytics"],
    applicants: 210,
    views: 4110,
  },
  {
    id: "job-006",
    slug: "robotics-software-lead-kepler",
    title: "Robotics Software Lead",
    companyId: "c-kepler",
    location: "Amsterdam, Netherlands (Hybrid)",
    workMode: "hybrid",
    employmentType: "full-time",
    seniority: "lead",
    salaryMin: 105000,
    salaryMax: 145000,
    currency: "EUR",
    postedAt: daysAgo(9),
    description:
      "Lead the team responsible for fleet coordination across 4,000 autonomous units in live warehouses.",
    responsibilities: [
      "Set technical direction for fleet orchestration",
      "Grow and coach a team of eight",
      "Own reliability targets with operations",
    ],
    requirements: [
      "7+ years robotics or distributed systems",
      "C++ and Python fluency",
      "Experience leading engineers",
    ],
    benefits: ["Hybrid", "Relocation package", "Pension", "Equity"],
    skills: ["C++", "ROS", "Distributed systems", "Leadership"],
    applicants: 38,
    views: 760,
  },
  {
    id: "job-007",
    slug: "qa-automation-engineer-northwind",
    title: "QA Automation Engineer",
    companyId: "c-northwind",
    location: "Remote (EU)",
    workMode: "remote",
    employmentType: "full-time",
    seniority: "mid",
    salaryMin: 55000,
    salaryMax: 75000,
    currency: "EUR",
    postedAt: daysAgo(5),
    description:
      "Build the safety net that lets a small team deploy fourteen times a day without fear.",
    responsibilities: [
      "Own the end-to-end test suite",
      "Improve CI signal and flake rate",
      "Partner with engineers on testability",
    ],
    requirements: ["Playwright or Cypress in production", "TypeScript", "CI/CD pipelines"],
    benefits: ["Remote-first", "Learning budget", "27 vacation days"],
    skills: ["Playwright", "TypeScript", "CI/CD", "Testing"],
    applicants: 44,
    views: 890,
  },
  {
    id: "job-008",
    slug: "frontend-intern-lumen",
    title: "Frontend Engineering Intern",
    companyId: "c-lumen",
    location: "Warsaw, Poland (Hybrid)",
    workMode: "hybrid",
    employmentType: "internship",
    seniority: "junior",
    salaryMin: 9000,
    salaryMax: 12000,
    currency: "EUR",
    postedAt: daysAgo(6),
    description:
      "Six-month paid internship on the storefront team, with a real mentor and real shipped work.",
    responsibilities: [
      "Ship UI features behind flags",
      "Write component tests",
      "Present your work at the monthly demo",
    ],
    requirements: ["JavaScript fundamentals", "Some React exposure", "Curiosity"],
    benefits: ["Mentorship", "Return offer path", "Lunch onsite"],
    skills: ["React", "JavaScript", "CSS"],
    applicants: 318,
    views: 5220,
  },
];

export const applications: Application[] = [
  {
    id: "app-1001",
    jobId: "job-001",
    candidateName: "Diyorbek Rakhimov",
    candidateEmail: "diyorbek@example.com",
    stage: "interview",
    matchScore: 92,
    appliedAt: daysAgo(6),
    lastUpdatedAt: daysAgo(1),
    notes: "Strong console performance work. Panel scheduled with the platform team.",
    interviewAt: "2026-09-02T13:00:00.000Z",
  },
  {
    id: "app-1002",
    jobId: "job-002",
    candidateName: "Diyorbek Rakhimov",
    candidateEmail: "diyorbek@example.com",
    stage: "screening",
    matchScore: 78,
    appliedAt: daysAgo(3),
    lastUpdatedAt: daysAgo(2),
    notes: "Recruiter screen booked. Needs stronger evidence of online inference work.",
  },
  {
    id: "app-1003",
    jobId: "job-005",
    candidateName: "Diyorbek Rakhimov",
    candidateEmail: "diyorbek@example.com",
    stage: "submitted",
    matchScore: 64,
    appliedAt: daysAgo(1),
    lastUpdatedAt: daysAgo(1),
    notes: "Awaiting first review.",
  },
  {
    id: "app-1004",
    jobId: "job-007",
    candidateName: "Diyorbek Rakhimov",
    candidateEmail: "diyorbek@example.com",
    stage: "rejected",
    matchScore: 51,
    appliedAt: daysAgo(14),
    lastUpdatedAt: daysAgo(9),
    notes: "Closed: role filled internally.",
  },
  {
    id: "app-1005",
    jobId: "job-001",
    candidateName: "Marta Kowalska",
    candidateEmail: "marta@example.com",
    stage: "offer",
    matchScore: 88,
    appliedAt: daysAgo(11),
    lastUpdatedAt: daysAgo(2),
    notes: "Offer extended, awaiting signature.",
  },
  {
    id: "app-1006",
    jobId: "job-004",
    candidateName: "Tomas Nowak",
    candidateEmail: "tomas@example.com",
    stage: "hired",
    matchScore: 84,
    appliedAt: daysAgo(28),
    lastUpdatedAt: daysAgo(4),
    notes: "Start date confirmed for October.",
  },
];

export const resume: ResumeProfile = {
  id: "res-001",
  fullName: "Diyorbek Rakhimov",
  headline: "Senior Frontend Engineer — product-focused, performance-obsessed",
  email: "diyorbek@example.com",
  location: "Tashkent, Uzbekistan",
  yearsExperience: 6,
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Design systems",
    "Performance",
    "Testing",
    "Node.js",
    "PostgreSQL",
  ],
  languages: [
    { name: "Uzbek", level: "Native" },
    { name: "Russian", level: "Fluent" },
    { name: "English", level: "Professional" },
  ],
  experience: [
    {
      role: "Senior Frontend Engineer",
      company: "Fintech studio (contract)",
      period: "2023 — present",
      summary:
        "Led the rebuild of a trading dashboard; cut time-to-interactive by 61% and introduced a typed design system used by four squads.",
    },
    {
      role: "Frontend Engineer",
      company: "Regional marketplace",
      period: "2020 — 2023",
      summary:
        "Owned checkout and search UI for 2M monthly users. Shipped an A/B framework that raised conversion 8%.",
    },
    {
      role: "Junior Developer",
      company: "Agency",
      period: "2019 — 2020",
      summary: "Built client sites and internal tooling across React and Node.",
    },
  ],
  education: [
    { degree: "BSc Computer Science", school: "Tashkent University of IT", period: "2015 — 2019" },
  ],
  strengths: [
    "Deep React + TypeScript track record matching senior EU listings",
    "Measurable performance outcomes quantified with real numbers",
    "Trilingual — unlocks EU, CIS and remote-global markets",
  ],
  gaps: [
    "No public evidence of WebSocket-heavy streaming UI work",
    "Leadership scope described informally; no team-size figures",
    "Missing certifications for regulated/health-tech listings",
  ],
  atsScore: 86,
};

/* ------------------------------------------------------------------ */
/* Query layer — replace these bodies when a real database is wired up */
/* ------------------------------------------------------------------ */

export function getCompany(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function getJob(idOrSlug: string): Job | undefined {
  return jobs.find((j) => j.id === idOrSlug || j.slug === idOrSlug);
}

export interface JobFilters {
  query?: string;
  location?: string;
  workMode?: WorkMode | "any";
  employmentType?: EmploymentType | "any";
  seniority?: Seniority | "any";
  minSalary?: number;
  limit?: number;
}

export function searchJobs(filters: JobFilters = {}): Job[] {
  const q = filters.query?.trim().toLowerCase();
  const loc = filters.location?.trim().toLowerCase();

  const result = jobs.filter((job) => {
    const company = getCompany(job.companyId);
    if (q) {
      const haystack = [job.title, job.description, company?.name ?? "", ...job.skills]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (loc && !job.location.toLowerCase().includes(loc)) return false;
    if (filters.workMode && filters.workMode !== "any" && job.workMode !== filters.workMode)
      return false;
    if (
      filters.employmentType &&
      filters.employmentType !== "any" &&
      job.employmentType !== filters.employmentType
    )
      return false;
    if (filters.seniority && filters.seniority !== "any" && job.seniority !== filters.seniority)
      return false;
    if (filters.minSalary && job.salaryMax < filters.minSalary) return false;
    return true;
  });

  return typeof filters.limit === "number" ? result.slice(0, filters.limit) : result;
}

/** Deterministic, explainable match score between a skill set and a job. */
export function matchScore(skills: string[], job: Job): { score: number; matched: string[]; missing: string[] } {
  const owned = new Set(skills.map((s) => s.toLowerCase()));
  const matched = job.skills.filter((s) => owned.has(s.toLowerCase()));
  const missing = job.skills.filter((s) => !owned.has(s.toLowerCase()));
  const coverage = job.skills.length === 0 ? 0 : matched.length / job.skills.length;
  const score = Math.round(38 + coverage * 58);
  return { score: Math.min(99, score), matched, missing };
}

export function rankedMatches(skills: string[] = resume.skills, limit = 5) {
  return jobs
    .map((job) => ({ job, ...matchScore(skills, job) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getApplicationsFor(email: string): Application[] {
  return applications.filter((a) => a.candidateEmail.toLowerCase() === email.toLowerCase());
}

export function formatSalary(job: Job): string {
  const fmt = (n: number) => `${Math.round(n / 1000)}k`;
  return `${job.currency} ${fmt(job.salaryMin)}–${fmt(job.salaryMax)}`;
}

export function relativeDay(iso: string): string {
  const diff = Math.round((Date.parse("2026-08-27T09:00:00.000Z") - Date.parse(iso)) / 86400000);
  if (diff <= 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export const analytics = {
  totals: { jobs: jobs.length, companies: companies.length, applications: applications.length, candidates: 1284 },
  pipeline: [
    { stage: "Submitted", count: 412 },
    { stage: "Screening", count: 236 },
    { stage: "Interview", count: 118 },
    { stage: "Offer", count: 41 },
    { stage: "Hired", count: 27 },
  ],
  weekly: [
    { week: "W31", applications: 180, hires: 4 },
    { week: "W32", applications: 214, hires: 6 },
    { week: "W33", applications: 268, hires: 5 },
    { week: "W34", applications: 301, hires: 9 },
    { week: "W35", applications: 355, hires: 11 },
  ],
  sources: [
    { source: "Organic search", value: 42 },
    { source: "AI assistant", value: 27 },
    { source: "Referral", value: 18 },
    { source: "Partners", value: 13 },
  ],
};
