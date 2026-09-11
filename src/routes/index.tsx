import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  FileSearch,
  Gauge,
  Languages,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { JobCard } from "@/components/job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { analytics, rankedMatches } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgentHire AI — Agentic recruitment platform for modern hiring teams" },
      {
        name: "description",
        content:
          "Explainable resume matching, automated applications, interview scheduling and MCP tools your AI assistant can call. Built for candidates and hiring teams across the EU and CIS.",
      },
      { property: "og:title", content: "AgentHire AI — Agentic recruitment platform" },
      {
        property: "og:description",
        content:
          "Match resumes to roles with explainable scoring, apply in one action, and let your AI assistant drive the hiring loop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "AgentHire AI",
          url: "https://agenthire.ai",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://agenthire.ai/jobs?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const featured = rankedMatches(undefined, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 size-[720px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 65%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
              <Sparkles className="size-3.5" /> {t("hero.badge")}
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.sub")}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/jobs", search: { q: q || undefined, location: loc || undefined } });
            }}
            className="mt-9 flex max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-surface/80 p-2 backdrop-blur sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("hero.search")}
                aria-label={t("hero.search")}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="hidden w-px bg-border sm:block" />
            <div className="flex flex-1 items-center gap-2 px-3">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder={t("hero.location")}
                aria-label={t("hero.location")}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" size="lg" className="sm:w-auto">
              {t("hero.searchcta")}
            </Button>
          </motion.form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link to="/jobs">
                {t("hero.cta")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/resume">{t("hero.cta2")}</Link>
            </Button>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-border/70 pt-8 sm:grid-cols-4">
            {[
              { v: `${analytics.totals.jobs * 214}+`, k: t("stats.jobs") },
              { v: `${analytics.totals.companies * 118}`, k: t("stats.companies") },
              { v: "94%", k: t("stats.match") },
              { v: "6 days", k: t("stats.time") },
            ].map((s) => (
              <div key={s.k}>
                <dt className="font-display text-3xl font-semibold text-primary">{s.v}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{s.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <Section title={t("section.features")} kicker="Platform">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: FileSearch,
              title: "Explainable resume analysis",
              body: "ATS scoring, strengths, gaps and rewrite suggestions — every number traceable to a specific line of the resume.",
            },
            {
              icon: Gauge,
              title: "Deterministic match scoring",
              body: "Skill coverage against each role's requirement set, with matched and missing skills listed side by side.",
            },
            {
              icon: Workflow,
              title: "One-action applications",
              body: "Generate a tailored cover note, attach the right resume version, and submit without leaving the role page.",
            },
            {
              icon: CalendarCheck,
              title: "Interview scheduling",
              body: "Propose slots, confirm panels, and keep candidate and hiring team in one shared timeline.",
            },
            {
              icon: Languages,
              title: "English, Uzbek, Russian",
              body: "The whole product surface speaks all three, so EU and CIS pipelines run on the same platform.",
            },
            {
              icon: ShieldCheck,
              title: "Cloud-ready architecture",
              body: "A single typed query layer sits between the UI and the data, so a managed Postgres backend drops in without UI changes.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="panel p-6"
            >
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section title={t("section.how")} kicker="Workflow">
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            { n: "01", t: "Upload your resume", d: "Parsed into a structured profile: skills, seniority, languages, outcomes." },
            { n: "02", t: "Get scored matches", d: "Every open role ranked with a transparent coverage score." },
            { n: "03", t: "Apply in one action", d: "A tailored note is drafted; you approve and it ships." },
            { n: "04", t: "Track to offer", d: "Stage-by-stage status, interview slots, and recruiter notes." },
          ].map((s) => (
            <li key={s.n} className="panel p-6">
              <span className="font-display text-sm text-primary">{s.n}</span>
              <h3 className="mt-3 text-base font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Featured jobs */}
      <Section
        title={t("section.jobs")}
        kicker="Live roles"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/jobs">
              {t("cta.viewall")} <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map((m, i) => (
            <JobCard key={m.job.id} job={m.job} score={m.score} index={i} />
          ))}
        </div>
      </Section>

      {/* MCP */}
      <Section title={t("section.mcp")} kicker="WebMCP">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {[
              { name: "search_jobs", d: "Filter open roles by query, location, work mode, seniority and salary floor." },
              { name: "match_resume", d: "Score a candidate skill set against a role and return matched vs missing skills." },
              { name: "apply_job", d: "Submit an application with an optional cover note and return the application id." },
              { name: "schedule_interview", d: "Book an interview slot against an existing application." },
              { name: "get_application_status", d: "Read the current stage, match score and interview time." },
            ].map((tool) => (
              <div key={tool.name} className="panel flex gap-3 p-4">
                <Terminal className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <code className="font-mono text-sm text-foreground">{tool.name}</code>
                  <p className="mt-1 text-sm text-muted-foreground">{tool.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="panel glow-ring flex flex-col justify-center gap-4 p-8">
            <Bot className="size-6 text-primary" />
            <h3 className="text-xl font-semibold">
              Your assistant can run the whole loop without a browser.
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              AgentHire exposes its hiring actions over the Model Context Protocol. Connect the
              server from ChatGPT, Claude, Cursor or any MCP client and ask it to find roles, score
              your resume, apply and book the interview — the same functions the web console calls.
            </p>
            <ul className="space-y-2 text-sm">
              {["Streamable HTTP transport", "Typed, validated tool inputs", "Same data as the web app"].map(
                (x) => (
                  <li key={x} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary" /> {x}
                  </li>
                ),
              )}
            </ul>
            <Button asChild variant="secondary" className="w-fit">
              <Link to="/assistant">Open the AI assistant</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section title={t("section.pricing")} kicker="Plans">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Candidate", price: "Free", d: "Matching, applications and tracking.", f: ["Unlimited matches", "Resume analysis", "Application tracker"] },
            { name: "Team", price: "$99/mo", d: "For hiring teams up to 20 seats.", f: ["Company dashboard", "Pipeline analytics", "MCP tools", "Interview scheduling"], featured: true },
            { name: "Enterprise", price: "Custom", d: "Compliance, SSO and data residency.", f: ["SSO / SAML", "Audit logs", "Dedicated support", "Custom integrations"] },
          ].map((p) => (
            <div
              key={p.name}
              className={`panel p-6 ${p.featured ? "glow-ring border-primary/40" : ""}`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {p.name}
              </h3>
              <p className="mt-3 font-display text-3xl font-semibold">{p.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.f.map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" /> {x}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={p.featured ? "default" : "secondary"}>
                <Link to="/auth">Get started</Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section title={t("section.faq")} kicker="FAQ">
        <Accordion type="single" collapsible className="panel px-6">
          {[
            {
              q: "How is the match score calculated?",
              a: "Each role declares a requirement skill set. The score is the coverage of that set by your profile, normalised to a 38–99 band, so you always see which skills matched and which are missing rather than an opaque number.",
            },
            {
              q: "Is my data stored anywhere?",
              a: "This deployment runs on seeded demo data with saved jobs and preferences kept in your browser. The query layer is a single typed module, so connecting managed Postgres with row-level security is a drop-in change.",
            },
            {
              q: "Which languages are supported?",
              a: "English, Uzbek and Russian across the entire interface, switchable from the header at any time.",
            },
            {
              q: "Can an AI assistant use AgentHire directly?",
              a: "Yes. The platform exposes search, matching, applying, scheduling and status checks as MCP tools over streamable HTTP.",
            },
          ].map((f, i) => (
            <AccordionItem key={f.q} value={`i${i}`}>
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-24">
        <div className="panel glow-ring flex flex-col items-center gap-5 px-6 py-16 text-center">
          <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
            Stop rewriting the same application eleven times.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Upload one resume. AgentHire handles the matching, the tailoring and the follow-up.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/resume">Analyze my resume</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/company">Hire with AgentHire</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  title,
  kicker,
  action,
  children,
}: {
  title: string;
  kicker: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h2>
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}
