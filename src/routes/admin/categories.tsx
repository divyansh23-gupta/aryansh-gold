import { createFileRoute } from "@tanstack/react-router";
import { FolderTree } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPlaceholder,
});

function AdminCategoriesPlaceholder() {
  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
          <FolderTree className="text-primary" size={28} />
          Categories
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage jewellery classification groups</p>
      </div>

      <div className="mt-10 rounded-sm border border-dashed border-border bg-background p-12 text-center">
        <p className="text-sm font-medium text-foreground">Categories Configuration Panel</p>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
          Categories addition, metadata editing, and cover image setups will be implemented in subsequent milestones.
        </p>
      </div>
    </div>
  );
}
