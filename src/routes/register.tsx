import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui-custom/Reveal";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Register — Aryansh Gold" },
      { name: "description", content: "Create your account at Aryansh Gold." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { token } = Route.useSearch();
  const { user, signUp, loginWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Invite validation states
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [checkingInvite, setCheckingInvite] = useState(false);

  // Check invitation token on mount
  useEffect(() => {
    if (token) {
      const checkInvitationToken = async () => {
        setCheckingInvite(true);
        try {
          const { data, error } = await supabase
            .from("admin_invites")
            .select("*")
            .eq("token", token)
            .eq("status", "pending")
            .single();

          if (error || !data) {
            setErrorMsg("This invitation token is invalid, expired, or has been revoked.");
            toast.error("Invalid invitation token.");
            return;
          }

          // Check token expiry
          if (new Date(data.expires_at) < new Date()) {
            setErrorMsg("This invitation token has expired.");
            toast.error("Invitation expired.");
            return;
          }

          setInviteDetails(data);
          setEmail(data.email); // Pre-fill and lock email field
          toast.success("Invitation verified successfully!");
        } catch (err) {
          console.error("Token verification exception:", err);
          setErrorMsg("Could not verify invitation details.");
        } finally {
          setCheckingInvite(false);
        }
      };
      checkInvitationToken();
    }
  }, [token]);

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setGoogleLoading(true);
    const { error } = await loginWithGoogle();
    setGoogleLoading(false);
    if (error) {
      setErrorMsg(error.message || "Failed to sign in with Google.");
    }
  };

  // Redirect to account if user is already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: "/account" });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg("All fields are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
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
    const { user: createdUser, error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "An error occurred during registration.");
    } else if (createdUser) {
      if (inviteDetails) {
        toast.success("Administrator account activated successfully!");
      }
      navigate({ to: "/account" });
    }
  };

  if (checkingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream/30">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-xs text-muted-foreground">Verifying invitation credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/30 px-5 py-28 md:py-36">
      <div className="w-full max-w-md border border-border/80 bg-background p-8 shadow-card md:p-10">
        <Reveal>
          <div className="text-center">
            <p className="eyebrow text-primary text-[0.68rem] tracking-[0.25em]">Create An Account</p>
            <h1 className="mt-4 font-serif text-3xl text-foreground">
              {inviteDetails ? "Accept Invitation" : "Sign Up"}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {inviteDetails 
                ? "Complete your credentials to activate administrator access." 
                : "Join Aryansh Gold to track orders and save your favorites."
              }
            </p>
          </div>
        </Reveal>

        {/* Verification banner for invited admins */}
        {inviteDetails && (
          <div className="mt-6 flex items-start gap-3 rounded-sm border border-primary/20 bg-primary/5 p-4 text-left">
            <ShieldCheck className="text-primary shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-xs font-semibold text-primary">Invitation Verified</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                You are joining Aryansh Gold as a <span className="font-semibold uppercase tracking-wider text-primary">{inviteDetails.role}</span>. Your registration email is locked to ensure access mapping.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {/* Hide Google option for administrative invites to guarantee email mapping matches token */}
          {!inviteDetails && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading || googleLoading}
                onClick={handleGoogleLogin}
                className="w-full border-border/80 text-foreground py-6 rounded-sm transition-colors duration-300 hover:bg-muted select-none flex items-center justify-center gap-2 cursor-pointer h-11 text-xs eyebrow tracking-wider font-semibold"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink mx-4 text-muted-foreground eyebrow text-[0.6rem] tracking-[0.2em]">or</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive text-center rounded-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName" className="eyebrow text-[0.62rem] text-foreground">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="E.g., Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="border-border focus-visible:ring-primary rounded-sm h-11"
            />
          </div>

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
              disabled={loading || !!inviteDetails}
              className="border-border focus-visible:ring-primary rounded-sm h-11 disabled:opacity-75 disabled:bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="eyebrow text-[0.62rem] text-foreground">
              Password
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
              Confirm Password
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
                Creating Account...
              </>
            ) : (
              inviteDetails ? "Activate Access" : "Create Account"
            )}
          </Button>

          <div className="pt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground underline hover:text-primary font-medium">
              Log In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
