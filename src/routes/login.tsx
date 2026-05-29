import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — AeroSense" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user, loading, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg.replace("Firebase:", "").trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your AeroSense account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="text-[color:var(--aero-blue)] font-semibold hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      {!configured && (
        <div className="mb-4 rounded-xl border border-[color:var(--aero-orange)]/40 bg-[color:var(--aero-orange)]/10 text-[color:var(--aero-orange)] text-xs p-3">
          Firebase isn't configured yet. Add your Firebase web config in
          <code className="mx-1 px-1 rounded bg-background/60">src/lib/firebase.ts</code>
          to enable authentication.
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <div className="mt-1.5 relative">
            <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--aero-blue)]/40"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-[color:var(--aero-blue)] hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <div className="mt-1.5 relative">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--aero-blue)]/40"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-[color:var(--aero-red)] bg-[color:var(--aero-red)]/10 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--aero-green)] text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60 transition"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}