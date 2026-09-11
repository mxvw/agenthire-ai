import { Link } from "@tanstack/react-router";
import {
  Bot,
  Building2,
  Github,
  Globe,
  LayoutDashboard,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5 font-display", className)}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </span>

      <span className="text-[15px] font-semibold tracking-tight">
        AgentHire <span className="text-primary">AI</span>
      </span>
    </Link>
  );
}

function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  const active = locales.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
        >
          <Globe className="size-4" />
          {active?.short}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
          >
            <span className="w-8 text-xs text-muted-foreground">
              {l.short}
            </span>

            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const navLinks = [
  { to: "/jobs", key: "nav.jobs" },
  { to: "/resume", key: "nav.resume" },
  { to: "/applications", key: "nav.applications" },
  { to: "/assistant", key: "nav.assistant" },
  { to: "/company", key: "nav.company" },
] as const;

export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile loading error:", error);
          setProfileName(null);
          return;
        }

        setProfileName(data?.full_name ?? null);
      } else {
        setProfileName(null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfileName(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    setUser(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&.active]:text-foreground"
            >
              {t(l.key)}
            </Link>
          ))}

          {/* Company Applications */}
          <Link
            to="/company-applications"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&.active]:text-foreground"
          >
            Company Applications
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <LocaleSwitch />

          {user
            ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden max-w-[220px] sm:inline-flex"
                  >
                    <span className="max-w-[180px] truncate">
                      {profileName || user.user_metadata?.full_name ||
                        user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
            : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link to="/auth">{t("nav.signin")}</Link>
              </Button>
            )}

          <Button asChild size="sm" className="font-medium">
            <Link to="/jobs">{t("nav.start")}</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/70 px-5 py-3 md:hidden">
          {[
            ...navLinks,
            {
              to: "/company-applications",
              label: "Company Applications",
            } as const,
            { to: "/saved", key: "nav.saved" } as const,
            { to: "/admin", key: "nav.admin" } as const,
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {"label" in l ? l.label : t(l.key)}
            </Link>
          ))}

          {user
            ? (
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-md px-2 py-2.5 text-left text-sm text-destructive hover:bg-accent"
              >
                Log out
              </button>
            )
            : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("nav.signin")}
              </Link>
            )}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/70 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />

          <p className="max-w-xs text-sm text-muted-foreground">
            Agentic recruitment infrastructure: explainable matching, automated
            applications, and MCP tools your assistant can call.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { to: "/jobs", label: t("nav.jobs") },
            { to: "/resume", label: t("nav.resume") },
            { to: "/applications", label: t("nav.applications") },
            { to: "/saved", label: t("nav.saved") },
          ]}
        />

        <FooterCol
          title="Teams"
          links={[
            { to: "/company", label: t("nav.company") },
            {
              to: "/company-applications",
              label: "Company Applications",
            },
            { to: "/admin", label: t("nav.admin") },
            { to: "/assistant", label: t("nav.assistant") },
            { to: "/settings", label: t("nav.settings") },
          ]}
        />

        <FooterCol
          title="Account"
          links={[
            { to: "/auth", label: t("nav.signin") },
            { to: "/settings", label: t("nav.settings") },
          ]}
        />
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 AgentHire AI. {t("footer.rights")}</p>

          <div className="flex items-center gap-4 sm:ml-auto">
            <span className="inline-flex items-center gap-1.5">
              <Bot className="size-3.5" /> MCP-ready
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" /> EU / CIS coverage
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Github className="size-3.5" /> Open architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>

      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              className="text-foreground/80 transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageShell({
  title,
  description,
  icon,
  children,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            {icon ?? <LayoutDashboard className="size-3.5" />}
            AgentHire console
          </div>

          <h1 className="text-3xl font-semibold sm:text-4xl">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {action && <div className="ml-auto">{action}</div>}
      </div>

      {children}
    </div>
  );
}
