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
import { useEffect, useState } from "react";

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
import { analytics } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "AgentHire AI — Agentic recruitment platform for modern hiring teams",
      },
      {
        name: "description",
        content:
          "Explainable resume matching, automated applications, interview scheduling and MCP tools your AI assistant can call. Built for candidates and hiring teams across the EU and CIS.",
      },
      {
        property: "og:title",
        content: "AgentHire AI — Agentic recruitment platform",
      },
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

type HomeJob = {
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
  created_at: string | null;
  owner_id: string | null;
  company_id: string | null;
};

function Landing() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");

  const [featured, setFeatured] = useState<HomeJob[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFeaturedJobs() {
      setLoadingFeatured(true);

      const { data, error } = await supabase
        .from("jobs")
        .select(`
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
        `)
        .order("created_at", { ascending: false })
        .limit(4);

      if (!mounted) return;

      if (error) {
        console.error("Home featured jobs error:", error);
        setFeatured([]);
      } else {
        setFeatured((data ?? []) as HomeJob[]);
      }

      setLoadingFeatured(false);
    }

    loadFeaturedJobs();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />

        <div
          className="pointer-events-none absolute -top-40 left-1/2 size-[720px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--primary), transparent 65%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/40 text-primary"
            >
              <Sparkles className="size-3.5" />
              {t("hero.badge")}
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

              navigate({
                to: "/jobs",
                search: {
                  q: q || undefined,
                  location: loc || undefined,
                },
              });
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
                {t("hero.cta")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button asChild variant="ghost">
              <Link to="/resume">{t("hero.cta2")}</Link>
            </Button>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-border/70 pt-8 sm:grid-cols-4">
            {[
              {
                v: `${analytics.totals.jobs * 214}+`,
                k: t("stats.jobs"),
              },
              {
                v: `${analytics.totals.companies * 118}`,
                k: t("stats.companies"),
              },
              {
                v: "94%",
                k: t("stats.match"),
              },
              {
                v: "6 days",
                k: t("stats.time"),
              },
            ].map((s) => (
              <div key={s.k}>
                <dt className="font-display text-3xl font-semibold text-primary">
                  {s.v}
                </dt>

                <dd className="mt-1 text-xs text-muted-foreground">
                  {s.k}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <Section
        title={t("section.features")}
        kicker={t("home.platform")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: FileSearch,
              title: t("feature.analysis.title"),
              body: t("feature.analysis.body"),
            },
            {
              icon: Gauge,
              title: t("feature.match.title"),
              body: t("feature.match.body"),
            },
            {
              icon: Workflow,
              title: t("feature.application.title"),
              body: t("feature.application.body"),
            },
            {
              icon: CalendarCheck,
              title: t("feature.interview.title"),
              body: t("feature.interview.body"),
            },
            {
              icon: Languages,
              title: t("feature.languages.title"),
              body: t("feature.languages.body"),
            },
            {
              icon: ShieldCheck,
              title: t("feature.cloud.title"),
              body: t("feature.cloud.body"),
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

              <h3 className="mt-4 text-base font-semibold">
                {f.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section
        title={t("section.how")}
        kicker={t("home.workflow")}
      >
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            {
              n: "01",
              t: t("how.step1.title"),
              d: t("how.step1.body"),
            },
            {
              n: "02",
              t: t("how.step2.title"),
              d: t("how.step2.body"),
            },
            {
              n: "03",
              t: t("how.step3.title"),
              d: t("how.step3.body"),
            },
            {
              n: "04",
              t: t("how.step4.title"),
              d: t("how.step4.body"),
            },
          ].map((s) => (
            <li key={s.n} className="panel p-6">
              <span className="font-display text-sm text-primary">
                {s.n}
              </span>

              <h3 className="mt-3 text-base font-semibold">
                {s.t}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Featured jobs */}
      <Section
        title={t("section.jobs")}
        kicker={t("home.liveRoles")}
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/jobs">
              {t("cta.viewall")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {loadingFeatured ? (
            <>
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="panel h-[250px] animate-pulse p-5"
                />
              ))}
            </>
          ) : featured.length > 0 ? (
            featured.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
              />
            ))
          ) : (
            <div className="panel col-span-full p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("jobs.empty")}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {t("jobs.emptyDescription")}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* MCP */}
      <Section title={t("section.mcp")} kicker="WebMCP">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {[
              {
                name: "search_jobs",
                d: t("mcp.searchJobs"),
              },
              {
                name: "match_resume",
                d: t("mcp.matchResume"),
              },
              {
                name: "apply_job",
                d: t("mcp.applyJob"),
              },
              {
                name: "schedule_interview",
                d: t("mcp.scheduleInterview"),
              },
              {
                name: "get_application_status",
                d: t("mcp.applicationStatus"),
              },
            ].map((tool) => (
              <div
                key={tool.name}
                className="panel flex gap-3 p-4"
              >
                <Terminal className="mt-0.5 size-4 shrink-0 text-primary" />

                <div>
                  <code className="font-mono text-sm text-foreground">
                    {tool.name}
                  </code>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {tool.d}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="panel glow-ring flex flex-col justify-center gap-4 p-8">
            <Bot className="size-6 text-primary" />

            <h3 className="text-xl font-semibold">
              {t("mcp.title")}
            </h3>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("mcp.description")}
            </p>

            <ul className="space-y-2 text-sm">
              {[
                t("mcp.http"),
                t("mcp.typed"),
                t("mcp.sameData"),
              ].map((x) => (
                <li
                  key={x}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <CheckCircle2 className="size-4 text-primary" />
                  {x}
                </li>
              ))}
            </ul>

            <Button
              asChild
              variant="secondary"
              className="w-fit"
            >
              <Link to="/assistant">
                {t("mcp.openAssistant")}
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      {/* <Section
        title={t("section.pricing")}
        kicker={t("home.plans")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: t("pricing.candidate"),
              price: t("pricing.candidatePrice"),
              d: t("pricing.candidateDesc"),
              f: [
                t("pricing.matching"),
                t("pricing.resume"),
                t("pricing.tracker"),
              ],
            },
            {
              name: t("pricing.team"),
              price: t("pricing.teamPrice"),
              d: t("pricing.teamDesc"),
              f: [
                t("pricing.dashboard"),
                t("pricing.analytics"),
                t("pricing.mcp"),
                t("pricing.interview"),
              ],
              featured: true,
            },
            {
              name: t("pricing.enterprise"),
              price: t("pricing.enterprisePrice"),
              d: t("pricing.enterpriseDesc"),
              f: [
                t("pricing.sso"),
                t("pricing.audit"),
                t("pricing.support"),
                t("pricing.integrations"),
              ],
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`panel p-6 ${
                p.featured ? "glow-ring border-primary/40" : ""
              }`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {p.name}
              </h3>

              <p className="mt-3 font-display text-3xl font-semibold">
                {p.price}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {p.d}
              </p>

              <ul className="mt-5 space-y-2 text-sm">
                {p.f.map((x) => (
                  <li
                    key={x}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="size-4 text-primary" />
                    {x}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="mt-6 w-full"
                variant={p.featured ? "default" : "secondary"}
              >
                <Link to="/auth">
                  {t("pricing.getStarted")}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </Section> */}

      {/* FAQ */}
      <Section
        title={t("section.faq")}
        kicker={t("home.faq")}
      >
        <Accordion
          type="single"
          collapsible
          className="panel px-6"
        >
          {[
            {
              q: t("faq.matchQuestion"),
              a: t("faq.matchAnswer"),
            },
            {
              q: t("faq.dataQuestion"),
              a: t("faq.dataAnswer"),
            },
            {
              q: t("faq.languageQuestion"),
              a: t("faq.languageAnswer"),
            },
            {
              q: t("faq.aiQuestion"),
              a: t("faq.aiAnswer"),
            },
          ].map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`i${i}`}
            >
              <AccordionTrigger className="text-left text-base">
                {f.q}
              </AccordionTrigger>

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
            {t("final.title")}
          </h2>

          <p className="max-w-xl text-sm text-muted-foreground">
            {t("final.description")}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/resume">
                {t("final.resume")}
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="secondary"
            >
              <Link to="/company">
                {t("final.company")}
              </Link>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {kicker}
          </p>

          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {title}
          </h2>
        </div>

        {action && (
          <div className="ml-auto">
            {action}
          </div>
        )}
      </div>

      {children}
    </section>
  );
}
