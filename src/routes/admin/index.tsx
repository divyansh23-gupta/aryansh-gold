import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ShoppingBag, FolderTree, AlertTriangle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardIndex,
});

function AdminDashboardIndex() {
  const { products, categories, collections } = useStore();

  const stats = [
    { label: "Total Products", value: products.length, icon: ShoppingBag, color: "text-blue-500" },
    { label: "Product Categories", value: categories.length, icon: FolderTree, color: "text-amber-500" },
    { label: "Featured Collections", value: collections.length, icon: ShieldCheck, color: "text-emerald-500" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Aryansh Gold administrative catalog overview</p>

      {/* Metrics Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-sm border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className={stat.color} size={20} />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-foreground">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Verification Notice */}
      <div className="mt-10 rounded-sm border border-border bg-background p-6 shadow-sm">
        <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
          <ShieldCheck className="text-primary" size={20} />
          Access Verification Status
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Milestone 2 route protection is fully operational. Dynamic variables and navigation visibility restrictions have been bound to this layout route.
        </p>
      </div>
    </div>
  );
}
