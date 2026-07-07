import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui-custom/Reveal";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Aryansh Gold" },
      { name: "description", content: "Set your new password at Aryansh Gold." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, updatePassword, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // If there's no active recovery session (no user), notify and redirect to login
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && !authLoading) {
        toast.error("Session expired or invalid. Please request a new reset link.");
        navigate({ to: "/login" });
      }
    }, 2000); // 2 second delay to allow session hydration

    return () => clearTimeout(timer);
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!password || !confirmPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to update password. Please try again.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: "/account" });
      }, 3000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/30 px-5 py-28 md:py-36">
      <div className="w-full max-w-md border border-border/80 bg-background p-8 shadow-card md:p-10">
        {!success ? (
          <>
            <Reveal>
              <div className="text-center">
                <p className="eyebrow text-primary text-[0.68rem] tracking-[0.25em]">Secure Account</p>
                <h1 className="mt-4 font-serif text-3xl text-foreground">Set New Password</h1>
                <p className="mt-2 text-xs text-muted-foreground">
                  Please enter your new password below. Make sure it is secure.
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
                <Label htmlFor="password" className="eyebrow text-[0.62rem] text-foreground">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-border focus-visible:ring-primary rounded-sm h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="eyebrow text-[0.62rem] text-foreground">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-6">
            <Reveal>
              <div className="flex justify-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 border border-primary/20">
                  <KeyRound size={26} className="text-primary" />
                </span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <h1 className="font-serif text-2xl text-foreground">Password Reset Complete</h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Your password has been updated successfully. 
                  We are now redirecting you to your account dashboard...
                </p>
              </div>
            </Reveal>
            <Reveal delay={200} className="pt-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
