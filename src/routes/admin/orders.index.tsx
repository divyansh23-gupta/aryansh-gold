import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { type DbOrder, type OrderStatus } from "@/lib/database.types";
import { formatPrice } from "@/data/products";
import { CreditCard, Search, Eye, Filter, ShoppingCart, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/orders/")({
  component: AdminOrdersIndex,
});

const statusBadgeStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-500 dark:border-indigo-500/20",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20",
};

function AdminOrdersIndex() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error("Error loading orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
            <CreditCard className="text-primary animate-pulse" size={28} />
            Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer purchases, update order processing, and tracking</p>
        </div>
        <Button 
          onClick={fetchOrders} 
          variant="outline" 
          size="sm" 
          className="self-start sm:self-center gap-1.5"
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Basic Metrics Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-sm border border-border bg-background shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Orders</p>
          <p className="mt-2 text-2xl font-semibold font-serif text-foreground">{counts.all}</p>
        </div>
        <div className="p-4 rounded-sm border border-border bg-background shadow-sm border-l-amber-400">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">Pending Approval</p>
          <p className="mt-2 text-2xl font-semibold font-serif text-amber-700 dark:text-amber-500">{counts.pending}</p>
        </div>
        <div className="p-4 rounded-sm border border-border bg-background shadow-sm border-l-blue-400">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Processing</p>
          <p className="mt-2 text-2xl font-semibold font-serif text-blue-700 dark:text-blue-400">{counts.confirmed}</p>
        </div>
        <div className="p-4 rounded-sm border border-border bg-background shadow-sm border-l-emerald-400">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Delivered</p>
          <p className="mt-2 text-2xl font-semibold font-serif text-emerald-700 dark:text-emerald-500">{counts.delivered}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-sm border border-border bg-background">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-border bg-muted/20 focus:bg-background"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {[
            { key: "all", label: `All (${counts.all})` },
            { key: "pending", label: `Pending (${counts.pending})` },
            { key: "confirmed", label: `Confirmed (${counts.confirmed})` },
            { key: "shipped", label: `Shipped (${counts.shipped})` },
            { key: "delivered", label: `Delivered (${counts.delivered})` },
            { key: "cancelled", label: `Cancelled (${counts.cancelled})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium border rounded-sm transition-all cursor-pointer ${
                statusFilter === f.key
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-muted/30 hover:bg-muted/70 text-muted-foreground border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Table */}
      <div className="rounded-sm border border-border bg-background overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                    {/* Order Number */}
                    <td className="px-6 py-4">
                      <span className="font-serif font-semibold text-foreground tracking-wider uppercase">
                        {order.order_number}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.customer_email}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm border uppercase tracking-wider ${statusBadgeStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 text-right font-serif font-medium text-foreground">
                      {formatPrice(order.total_amount)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: order.id }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-all link-underline cursor-pointer"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
