import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { type DbOrder, type DbOrderItem, type DbOrderStatusHistory, type OrderStatus } from "@/lib/database.types";
import { formatPrice } from "@/data/products";
import { ArrowLeft, Clock, MapPin, User, Package, ChevronRight, CheckCircle2, ShieldAlert, Loader2, FileText, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/orders/$id")({
  component: AdminOrderDetail,
});

const statusBadgeStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-500 dark:border-indigo-500/20",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20",
};

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<DbOrder | null>(null);
  const [items, setItems] = useState<DbOrderItem[]>([]);
  const [history, setHistory] = useState<DbOrderStatusHistory[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({}); // Maps user_id -> name/email
  const [loading, setLoading] = useState(true);
  
  // Transition Form States
  const [updating, setUpdating] = useState(false);
  const [transitionNote, setTransitionNote] = useState("");
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus | null>(null);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Order
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderErr) throw orderErr;
      setOrder(orderData);

      // 2. Fetch Items
      const { data: itemsData, error: itemsErr } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      if (itemsErr) throw itemsErr;
      setItems(itemsData || []);

      // 3. Fetch History
      const { data: historyData, error: historyErr } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });

      if (historyErr) throw historyErr;
      setHistory(historyData || []);

      // 4. Fetch profiles to resolve changed_by admins
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesData) {
        const mappedProfiles: Record<string, string> = {};
        profilesData.forEach((p) => {
          mappedProfiles[p.id] = `${p.full_name} (${p.email})`;
        });
        setProfiles(mappedProfiles);
      }
    } catch (err: any) {
      console.error("Error loading order details:", err);
      toast.error("Failed to load order details");
      navigate({ to: "/admin/orders" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [id]);

  const getAvailableTransitions = (currentStatus: OrderStatus): OrderStatus[] => {
    const transitions: OrderStatus[] = [];
    if (currentStatus === "pending") {
      transitions.push("confirmed");
    } else if (currentStatus === "confirmed") {
      transitions.push("shipped");
    } else if (currentStatus === "shipped") {
      transitions.push("delivered");
    }

    // "any → cancelled" except if already delivered or cancelled
    if (currentStatus !== "delivered" && currentStatus !== "cancelled") {
      transitions.push("cancelled");
    }

    return transitions;
  };

  const handleStatusTransition = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      // A. Update Orders Status
      const { error: orderUpdateErr } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (orderUpdateErr) throw orderUpdateErr;

      // B. Insert History Row
      const defaultNotes: Record<OrderStatus, string> = {
        pending: "Order placed.",
        confirmed: "Order confirmed for processing.",
        shipped: "Order items package handed to shipping carrier.",
        delivered: "Order marked delivered to customer.",
        cancelled: "Order cancelled.",
      };

      const note = transitionNote.trim() || defaultNotes[newStatus];

      const { error: historyErr } = await supabase
        .from("order_status_history")
        .insert({
          order_id: order.id,
          status: newStatus,
          notes: note,
          changed_by: currentUser?.id || null,
        });

      if (historyErr) throw historyErr;

      toast.success(`Order successfully updated to ${newStatus}`);
      setSelectedNewStatus(null);
      setTransitionNote("");
      
      // Reload order details
      await fetchOrderData();
    } catch (err: any) {
      console.error("Status transition error:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const parseAddress = (addressJson: any) => {
    if (!addressJson) return null;
    if (typeof addressJson === "string") {
      try {
        addressJson = JSON.parse(addressJson);
      } catch {
        return addressJson;
      }
    }
    const { street, city, state, zip, country } = addressJson;
    return (
      <div className="text-xs text-muted-foreground leading-relaxed">
        <p className="font-medium text-foreground">{street}</p>
        <p>{city}{state ? `, ${state}` : ""}{zip ? ` - ${zip}` : ""}</p>
        {country && <p>{country}</p>}
      </div>
    );
  };

  if (loading || !order) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground font-serif">Loading order details...</p>
        </div>
      </div>
    );
  }

  const transitions = getAvailableTransitions(order.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Back navigation */}
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-4"
        >
          <ArrowLeft size={14} />
          Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Order {order.order_number}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-sm border uppercase tracking-wider ${statusBadgeStyles[order.status]}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Placements: {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Details, Items, Remarks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details & Summary Card */}
          <div className="p-6 rounded-sm border border-border bg-background shadow-sm space-y-6">
            <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Package size={18} className="text-primary" />
              Order Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground">Subtotal</p>
                <p className="font-serif text-sm font-medium text-foreground mt-1">{formatPrice(order.subtotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Shipping Cost</p>
                <p className="font-serif text-sm font-medium text-foreground mt-1">{formatPrice(order.shipping_cost)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Discount</p>
                <p className="font-serif text-sm font-medium text-foreground mt-1">{formatPrice(order.discount_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold">Total Amount</p>
                <p className="font-serif text-base font-bold text-primary mt-0.5">{formatPrice(order.total_amount)}</p>
              </div>
            </div>

            {order.notes && (
              <div className="p-4 rounded-sm border border-border/60 bg-muted/20 text-xs">
                <p className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                  <FileText size={14} className="text-muted-foreground" />
                  Customer Order Note
                </p>
                <p className="text-muted-foreground italic">"{order.notes}"</p>
              </div>
            )}
          </div>

          {/* Ordered Items List */}
          <div className="p-6 rounded-sm border border-border bg-background shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <ShoppingCart size={18} className="text-primary" />
              Items Ordered ({items.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/10 font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Product details</th>
                    <th className="px-4 py-3 text-center">Quantity</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/5">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-foreground font-serif text-sm">{item.product_name_snapshot}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">SKU: {item.sku_snapshot}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-foreground font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right font-serif text-muted-foreground">
                        {formatPrice(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 text-right font-serif font-semibold text-foreground">
                        {formatPrice(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Status updates, Customer credentials, Address details, Timeline */}
        <div className="space-y-6">
          {/* Status Controls */}
          {transitions.length > 0 ? (
            <div className="p-6 rounded-sm border border-border bg-background shadow-sm space-y-4">
              <h2 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">
                Fulfillment Actions
              </h2>

              {selectedNewStatus ? (
                <div className="space-y-3 p-3 rounded-sm border border-border/80 bg-muted/10">
                  <p className="text-xs text-foreground font-semibold uppercase">
                    Transition to: <span className="text-primary">{selectedNewStatus}</span>
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-medium">Internal Notes (Optional)</label>
                    <Input
                      placeholder="e.g. Package tracking number..."
                      value={transitionNote}
                      onChange={(e) => setTransitionNote(e.target.value)}
                      className="h-8 text-xs border-border bg-background"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => handleStatusTransition(selectedNewStatus)}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Confirm Update
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        setSelectedNewStatus(null);
                        setTransitionNote("");
                      }}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {transitions.map((status) => (
                    <Button
                      key={status}
                      variant={status === "cancelled" ? "destructive" : "outline"}
                      size="sm"
                      className="w-full text-xs font-semibold justify-between h-9 uppercase tracking-wider cursor-pointer"
                      onClick={() => setSelectedNewStatus(status)}
                    >
                      Move status to {status}
                      <ChevronRight size={14} />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-sm border border-border bg-background shadow-sm flex items-center gap-2 border-l-4 border-l-emerald-500 text-xs">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
              <p className="text-muted-foreground">Order processing timeline concluded. No status modifications available.</p>
            </div>
          )}

          {/* Customer Credentials */}
          <div className="p-6 rounded-sm border border-border bg-background shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Customer Info
            </h2>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <User size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground uppercase text-[10px]">Name</p>
                  <p className="font-medium text-foreground mt-0.5">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground uppercase text-[10px]">Email</p>
                  <p className="font-medium text-foreground mt-0.5">{order.customer_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground uppercase text-[10px]">Phone</p>
                  <p className="font-medium text-foreground mt-0.5">{order.customer_phone || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="p-6 rounded-sm border border-border bg-background shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Delivery Addresses
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase text-[10px] tracking-wider">Shipping Address</p>
                  {parseAddress(order.shipping_address) || <p className="text-xs text-muted-foreground">No address recorded</p>}
                </div>
              </div>
              <div className="flex items-start gap-2.5 border-t border-border/60 pt-3">
                <MapPin size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase text-[10px] tracking-wider">Billing Address</p>
                  {order.billing_address ? (
                    parseAddress(order.billing_address)
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Same as shipping address</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="p-6 rounded-sm border border-border bg-background shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
              <Clock size={15} className="text-primary" />
              History Timeline
            </h2>

            <div className="space-y-4 pt-1">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No logs recorded.</p>
              ) : (
                <div className="relative border-l-2 border-border/80 ml-2.5 pl-4 space-y-5">
                  {history.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[23px] top-1 bg-background rounded-full border-2 border-primary h-2 w-2" />

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold border rounded-sm uppercase tracking-wider ${statusBadgeStyles[log.status]}`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-foreground pt-0.5 leading-relaxed">
                            {log.notes}
                          </p>
                        )}
                        <p className="text-[9px] text-muted-foreground">
                          By: {log.changed_by ? (profiles[log.changed_by] || `User: ${log.changed_by.substring(0, 8)}...`) : "System / Trigger"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
