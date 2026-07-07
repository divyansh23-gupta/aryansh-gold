import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/admin/collections")({
  component: AdminCollectionsPlaceholder,
});

function AdminCollectionsPlaceholder() {
  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
          <Settings className="text-primary" size={28} />
          Collections
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Curate seasonal edits and groupings</p>
      </div>

      <div className="mt-10 rounded-sm border border-dashed border-border bg-background p-12 text-center">
        <p className="text-sm font-medium text-foreground">Collections Editor Panel</p>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
          Featured edits custom curation, banners, and details mapping will be implemented in subsequent milestones.
        </p>
      </div>
    </div>
  );
}
