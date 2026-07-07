import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPlaceholder,
});

function AdminUsersPlaceholder() {
  const { isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Route security: Only super admin can view administrators settings
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate({ to: "/admin/unauthorized" });
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
          <Users className="text-primary" size={28} />
          Administrators
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage administrative roles and invite parameters</p>
      </div>

      <div className="mt-10 rounded-sm border border-dashed border-border bg-background p-12 text-center">
        <p className="text-sm font-medium text-foreground">Role and Invites Configuration Dashboard</p>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
          Admins invitation send loops, token expirations checking, and manual promotion triggers will be implemented in subsequent milestones.
        </p>
      </div>
    </div>
  );
}
