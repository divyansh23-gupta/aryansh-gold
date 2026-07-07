import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPlaceholder,
});

function AdminOrdersPlaceholder() {
  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
          <CreditCard className="text-primary" size={28} />
          Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Fulfill purchases and update shipment statuses</p>
      </div>

      <div className="mt-10 rounded-sm border border-dashed border-border bg-background p-12 text-center">
        <p className="text-sm font-medium text-foreground">Orders Control Hub</p>
        <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
          Fulfillment processing, tracking updates, and customer invoices details will be implemented in subsequent milestones.
        </p>
      </div>
    </div>
  );
}
