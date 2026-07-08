import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { 
  Loader2, 
  LayoutDashboard, 
  ShoppingBag, 
  FolderTree, 
  Settings, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  PackageCheck,
  CreditCard,
  ChevronDown,
  User as UserIcon,
  Store,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, isSuperAdmin, adminRole, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { label: "Inventory", to: "/admin/inventory", icon: PackageCheck },
    { label: "Orders", to: "/admin/orders", icon: CreditCard },
    { label: "Reels", to: "/admin/reels", icon: Film },
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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background transition-all duration-300 lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-border px-6">
          <Link to="/" className="font-serif text-lg tracking-wider text-foreground hover:text-primary whitespace-nowrap overflow-hidden">
            {isCollapsed ? (
              <span className="font-serif font-bold text-primary">A</span>
            ) : (
              <>
                ARYANSH <span className="font-sans text-xs font-semibold text-primary">ADMIN</span>
              </>
            )}
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

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              activeProps={{ className: "bg-primary/5 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted/50 hover:text-foreground" }}
              className={cn(
                "flex items-center gap-3.5 rounded-sm px-4 py-3 text-sm font-medium transition-all",
                isCollapsed && "lg:justify-center lg:px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={18} strokeWidth={1.5} className="shrink-0" />
              <span className={cn("transition-opacity duration-200", isCollapsed && "lg:hidden")}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Collapse Toggle & Bottom actions */}
        <div className="border-t border-border p-3 space-y-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden w-full items-center gap-3.5 rounded-sm px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground lg:flex justify-center"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} strokeWidth={1.5} />
            ) : (
              <div className="flex items-center gap-3.5 w-full">
                <ChevronLeft size={18} strokeWidth={1.5} />
                <span>Collapse Panel</span>
              </div>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3.5 rounded-sm px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5",
              isCollapsed && "lg:justify-center lg:px-2"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut size={18} strokeWidth={1.5} className="shrink-0" />
            <span className={isCollapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div 
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
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

          {/* Left spacer/search or title */}
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aryansh Gold Admin Backoffice
            </span>
          </div>

          {/* User Profile dropdown menu */}
          <div className="relative flex items-center gap-4" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 rounded-sm p-1.5 transition-colors hover:bg-muted"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary font-sans text-xs font-bold text-primary-foreground uppercase">
                {user.email?.slice(0, 2) || "AD"}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-medium text-foreground max-w-[120px] truncate">{user.email}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {adminRole === "super_admin" ? "Super Admin" : "Admin"}
                </p>
              </div>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-sm border border-border bg-background p-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-border/60">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/"
                    className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Store size={15} className="text-muted-foreground" />
                    Storefront
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/5"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
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
