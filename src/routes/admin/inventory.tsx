import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck } from "lucide-react";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventoryPlaceholder,
});

function AdminInventoryPlaceholder() {
  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
          <PackageCheck className="text-primary" size={28} />
          Inventory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Track SKU stock quantities and allocations</p>
      </div>

      <div className="mt-10 rounded-sm border border-dashed border-border bg-background p-12 text-center">
        <p className="text-sm font-medium text-foreground">SKU Inventory Manager</p>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
          Stock levels monitoring, reserved item overrides, and variant allocation tables will be implemented in subsequent milestones.
        </p>
      </div>
    </div>
  );
}
