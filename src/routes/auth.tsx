import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — AgentHire AI" },
      {
        name: "description",
        content:
          "Sign in to AgentHire AI to track applications, save roles and let your AI assistant act on your hiring pipeline.",
      },
      { property: "og:title", content: "Sign in — AgentHire AI" },
      {
        property: "og:description",
        content: "Access your AgentHire candidate or hiring console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),

  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [redirectTo, setRedirectTo] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // window faqat browserda ishlaydi
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/";

    setRedirectTo(redirect);

    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && mounted) {
        navigate({
          to: redirect,
          replace: true,
        });
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        mounted
      ) {
        navigate({
          to: redirect,
          replace: true,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleSignIn() {
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Sign in error:", error);

      toast.error("Sign in failed", {
        description: error.message,
      });

      return;
    }

    toast.success("Successfully signed in!");

    navigate({
      to: redirectTo,
    });
  }

  async function handleSignUp() {
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    setLoading(false);

    if (error) {
      console.error("Sign up error:", error);

      toast.error("Account creation failed", {
        description: error.message,
      });

      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: name,
          email: email,
          role: "user",
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    toast.success("Account created!");

    navigate({
      to: redirectTo,
    });
  }

  async function handleGoogleLogin() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(
          redirectTo,
        )}`,
      },
    });

    setLoading(false);

    if (error) {
      console.error("Google sign in error:", error);

      toast.error("Google sign in failed", {
        description: error.message,
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-20">
      <Logo className="mb-8" />

      <div className="panel w-full p-7">
        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign in
            </TabsTrigger>

            <TabsTrigger value="signup" className="flex-1">
              Create account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 pt-5">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-signin">Email</Label>

              <Input
                id="email-signin"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pw-signin">Password</Label>

              <Input
                id="pw-signin"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 pt-5">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>

              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Diyorbek Rakhimov"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-signup">Email</Label>

              <Input
                id="email-signup"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pw-signup">Password</Label>

              <Input
                id="pw-signup"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Your account is securely managed with Supabase Authentication.
      </p>
    </div>
  );
}
