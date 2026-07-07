import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Reveal } from "@/components/ui-custom/Reveal";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Aryansh Gold" },
      { name: "description", content: "Access your account at Aryansh Gold." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login, loginWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const { user: loggedInUser, error } = await login(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Invalid login credentials.");
    } else if (loggedInUser) {
      navigate({ to: "/account" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/30 px-5 py-28 md:py-36">
      <div className="w-full max-w-md border border-border/80 bg-background p-8 shadow-card md:p-10">
        <Reveal>
          <div className="text-center">
            <p className="eyebrow text-primary text-[0.68rem] tracking-[0.25em]">Welcome Back</p>
            <h1 className="mt-4 font-serif text-3xl text-foreground">Log In</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Sign in to manage your profile and view your order history.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 space-y-4">
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
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="eyebrow text-[0.62rem] text-foreground">
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                Forgot Password?
              </Link>
            </div>
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

          <div className="flex items-center space-x-2 py-1">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={loading}
              className="border-border rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="rememberMe"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Remember Me
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background font-serif text-sm py-6 rounded-sm transition-colors duration-300 hover:bg-primary hover:text-primary-foreground select-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging In...
              </>
            ) : (
              "Log In"
            )}
          </Button>

          <div className="pt-4 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-foreground underline hover:text-primary font-medium">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
