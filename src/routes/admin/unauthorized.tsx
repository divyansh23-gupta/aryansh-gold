import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mx-auto max-w-md">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-primary/20 bg-primary/5 text-primary">
          <ShieldAlert size={36} strokeWidth={1.25} />
        </span>
        <p className="eyebrow mt-8 text-primary">Security Access Control</p>
        <h1 className="display-serif mt-4 text-3xl text-foreground sm:text-4xl">
          Access Denied
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Your account does not possess the administrator privileges required to access the Aryansh Gold backoffice portal.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-foreground px-8 py-3.5 eyebrow text-background transition-colors hover:bg-primary"
          >
            Back Home
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center border border-border bg-background px-8 py-3.5 eyebrow text-foreground transition-colors hover:bg-muted"
          >
            Sign In Again
          </Link>
        </div>
      </div>
    </div>
  );
}
