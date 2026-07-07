import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui-custom/Reveal";
import { Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Aryansh Gold" },
      { name: "description", content: "Recover your password at Aryansh Gold." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to send reset link. Please try again.");
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/30 px-5 py-28 md:py-36">
      <div className="w-full max-w-md border border-border/80 bg-background p-8 shadow-card md:p-10">
        {!success ? (
          <>
            <Reveal>
              <div className="text-center">
                <p className="eyebrow text-primary text-[0.68rem] tracking-[0.25em]">Account Recovery</p>
                <h1 className="mt-4 font-serif text-3xl text-foreground">Forgot Password</h1>
                <p className="mt-2 text-xs text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </Reveal>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {errorMsg && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive text-center rounded-sm">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="eyebrow text-[0.62rem] text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-border focus-visible:ring-primary rounded-sm h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background font-serif text-sm py-6 rounded-sm transition-colors duration-300 hover:bg-primary hover:text-primary-foreground select-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="pt-4 text-center text-xs text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-foreground underline hover:text-primary font-medium">
                  Log In
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-6">
            <Reveal>
              <div className="flex justify-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 border border-primary/20">
                  <MailCheck size={26} className="text-primary" />
                </span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <h1 className="font-serif text-2xl text-foreground">Check Your Email</h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  We've sent a password reset link to <strong className="text-foreground font-medium">{email}</strong>. 
                  Please check your inbox (and spam folder) to set your new password.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200} className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-foreground px-8 py-3.5 eyebrow text-[0.68rem] text-background transition-colors hover:bg-primary hover:text-primary-foreground rounded-sm w-full"
              >
                Back To Login
              </Link>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
