import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPlaceholder,
});

function AdminProductsPlaceholder() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
            <ShoppingBag className="text-primary" size={28} />
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your luxury jewellery catalog items</p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2.5 eyebrow text-xs text-primary cursor-not-allowed opacity-60"
        >
          <Plus size={14} />
          Add Product
        </button>
      </div>

      <div className="mt-10 rounded-sm border border-dashed border-border bg-background p-12 text-center">
        <p className="text-sm font-medium text-foreground">Product Management Interface</p>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
          Catalog CRUD forms, details configurations, and gallery uploads will be implemented in subsequent milestones.
        </p>
      </div>
    </div>
  );
}
