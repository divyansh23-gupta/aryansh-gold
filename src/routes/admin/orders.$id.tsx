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
  const [isDraft, setIsDraft] = useState(false);
  
  // Transition Form States
  const [updating, setUpdating] = useState(false);
  const [transitionNote, setTransitionNote] = useState("");
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus | null>(null);

  const handleForceConfirm = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc("force_confirm_draft", {
        p_draft_id: id,
        p_admin_id: currentUser?.id
      });

      if (error) throw error;

      toast.success("Order draft confirmed and created successfully!");
      navigate({ to: "/admin/orders" });
    } catch (err: any) {
      console.error("Force confirm draft error:", err);
      toast.error(err.message || "Failed to force confirm order draft");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelConflict = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("order_drafts")
        .update({
          status: "cancelled",
          payment_status: "refunded"
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Draft transaction cancelled and flagged for refund.");
      navigate({ to: "/admin/orders" });
    } catch (err: any) {
      console.error("Cancel draft error:", err);
      toast.error("Failed to cancel draft transaction");
    } finally {
      setUpdating(false);
    }
  };

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      // 1. Fetch standard Order
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (orderErr) throw orderErr;

      if (orderData) {
        setOrder(orderData);
        setIsDraft(false);

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
      } else {
        // Query order drafts
        const { data: draftData, error: draftErr } = await supabase
          .from("order_drafts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (draftErr || !draftData) {
          throw new Error("Order or Draft not found");
        }

        setIsDraft(true);

        const mappedOrder: DbOrder = {
          id: draftData.id,
          order_number: `DRAFT: ${draftData.razorpay_order_id.slice(-8).toUpperCase()}`,
          user_id: draftData.user_id,
          customer_name: draftData.customer_name,
          customer_email: draftData.customer_email,
          customer_phone: draftData.customer_phone || "",
          shipping_address: draftData.shipping_address,
          billing_address: draftData.billing_address || {},
          subtotal: Number(draftData.subtotal),
          shipping_cost: Number(draftData.shipping_cost),
          tax_amount: 0,
          discount_amount: 0,
          total_amount: Number(draftData.total_amount),
          status: draftData.status as any,
          notes: draftData.notes || "",
          created_at: draftData.created_at,
          updated_at: draftData.updated_at
        };

        setOrder(mappedOrder);

        const variantIds = draftData.cart_items.map((i: any) => i.variant_id);
        const { data: dbVariants } = await supabase
          .from("product_variants")
          .select("id, sku, price, product_id, products(name)")
          .in("id", variantIds);

        const variantMap = new Map(dbVariants?.map(v => [v.id, v]) || []);
        
        const mappedItems: DbOrderItem[] = draftData.cart_items.map((item: any, idx: number) => {
          const v = variantMap.get(item.variant_id);
          const pName = v?.products ? (v.products as any).name : "Unknown Product";
          return {
            id: `draft-item-${idx}`,
            order_id: draftData.id,
            product_id: v?.product_id || "",
            variant_id: item.variant_id,
            product_name_snapshot: pName,
            sku_snapshot: v?.sku || "SKU-UNKNOWN",
            unit_price: Number(v?.price || 0),
            quantity: item.quantity,
            total_price: Number(v?.price || 0) * item.quantity,
            created_at: draftData.created_at
          };
        });

        setItems(mappedItems);
        setHistory([]);
      }

      // Fetch profiles to resolve changed_by admins
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
          {!isDraft ? (
            transitions.length > 0 ? (
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
            )
          ) : (
            <div className="p-6 rounded-sm border border-border bg-background shadow-sm space-y-4">
              <h2 className="font-serif text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">
                Draft Resolution Actions
              </h2>
              {((order.status as string) === "inventory_conflict") ? (
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200/50 rounded-sm text-xs text-red-700 dark:text-red-400 space-y-1.5">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldAlert size={14} className="shrink-0" />
                      Inventory Conflict Detected
                    </p>
                    <p>This order payment has been authorized, but stock was depleted before creation. Resolve manually below.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <Button
                      onClick={handleForceConfirm}
                      disabled={updating}
                      className="w-full text-xs font-bold uppercase tracking-wider h-10 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {updating ? <Loader2 size={14} className="animate-spin" /> : null}
                      Force Confirm Order
                    </Button>
                    <Button
                      onClick={handleCancelConflict}
                      variant="destructive"
                      disabled={updating}
                      className="w-full text-xs font-bold uppercase tracking-wider h-10 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {updating ? <Loader2 size={14} className="animate-spin" /> : null}
                      Log Refund & Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground p-3 bg-muted/10 border border-border rounded-sm">
                  This transaction is in draft state ({order.status}). Payment verification is pending or failed.
                </div>
              )}
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
