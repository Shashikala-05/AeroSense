import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — AeroSense" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      setError(msg.replace("Firebase:", "").trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a secure reset link"
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-[color:var(--aero-blue)] font-semibold hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {!configured && (
        <div className="mb-4 rounded-xl border border-[color:var(--aero-orange)]/40 bg-[color:var(--aero-orange)]/10 text-[color:var(--aero-orange)] text-xs p-3">
          Add your Firebase web config in <code>src/lib/firebase.ts</code> to enable password resets.
        </div>
      )}
      {sent ? (
        <div className="rounded-xl bg-[color:var(--aero-green)]/10 text-[color:var(--aero-green)] text-sm p-4 text-center">
          ✓ Reset link sent to <strong>{email}</strong>. Check your inbox.
        </div>
      ) : (
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
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}