import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Loader2, LayoutDashboard, ShoppingBag, FolderTree, Settings, Users, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, isSuperAdmin, adminRole, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate({ to: "/admin/unauthorized" });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 font-serif text-lg text-foreground">Verifying administrator access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; 
  }

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const navItems = [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Products", to: "/admin/products", icon: ShoppingBag },
    { label: "Categories", to: "/admin/categories", icon: FolderTree },
    { label: "Collections", to: "/admin/collections", icon: Settings },
  ];

  // Super-admin only links
  if (isSuperAdmin) {
    navItems.push(
      { label: "Administrators", to: "/admin/users", icon: Users }
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/10 font-sans">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-charcoal/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-6">
          <Link to="/" className="font-serif text-lg tracking-wider text-foreground hover:text-primary">
            ARYANSH <span className="font-sans text-xs font-semibold text-primary">ADMIN</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              activeProps={{ className: "bg-primary/5 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted/50 hover:text-foreground" }}
              className="flex items-center gap-3.5 rounded-sm px-4 py-3 text-sm font-medium transition-all"
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 rounded-sm px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground lg:inline-block">
              Welcome back,
            </span>
            <span className="text-sm font-medium text-foreground">
              {user.email}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
              {adminRole === "super_admin" ? "Super Admin" : "Admin"}
            </span>
            
            {/* User Initials Avatar */}
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary font-sans text-xs font-bold text-primary-foreground uppercase">
              {user.email?.slice(0, 2) || "AD"}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
