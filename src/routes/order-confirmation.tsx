import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/data/products";
import { CheckCircle, ShoppingBag, ArrowRight, Calendar, MapPin, Phone, Mail, FileText, Loader2 } from "lucide-react";
import { Reveal } from "@/components/ui-custom/Reveal";

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (search: Record<string, unknown>): { orderNumber: string } => {
    return {
      orderNumber: (search.orderNumber as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Order Confirmed — Aryansh Gold" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmationPage,
});

interface LocalOrderDetails {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    image: string;
  }>;
}

function OrderConfirmationPage() {
  const { orderNumber } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<LocalOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      navigate({ to: "/shop" });
      return;
    }

    const loadOrder = async () => {
      // 1. Try reading from sessionStorage
      try {
        const stored = sessionStorage.getItem("aryansh_last_order");
        if (stored) {
          const parsed = JSON.parse(stored) as LocalOrderDetails;
          if (parsed.orderNumber === orderNumber) {
            setOrder(parsed);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading order from session storage:", e);
      }

      // 2. If not in sessionStorage and user is logged in, try loading from Supabase
      if (user) {
        try {
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("order_number", orderNumber)
            .eq("user_id", user.id)
            .maybeSingle();

          if (orderError) throw orderError;

          if (orderData) {
            const mappedAddress = typeof orderData.shipping_address === "string"
              ? JSON.parse(orderData.shipping_address)
              : orderData.shipping_address;

            // Fetch product images to display
            const { data: itemProducts } = await supabase
              .from("products")
              .select("id, image_url")
              .in("id", orderData.order_items.map((i: any) => i.product_id).filter(Boolean));

            const imgMap = new Map(itemProducts?.map(p => [p.id, p.image_url]) || []);

            const details: LocalOrderDetails = {
              orderNumber: orderData.order_number,
              customerName: orderData.customer_name,
              customerEmail: orderData.customer_email,
              customerPhone: orderData.customer_phone || undefined,
              shippingAddress: {
                street: mappedAddress.street || "",
                city: mappedAddress.city || "",
                state: mappedAddress.state || "",
                zip: mappedAddress.zip || "",
              },
              subtotal: Number(orderData.subtotal),
              shippingCost: Number(orderData.shipping_cost),
              totalAmount: Number(orderData.total_amount),
              items: orderData.order_items.map((item: any) => ({
                name: item.product_name_snapshot,
                qty: item.quantity,
                price: Number(item.unit_price),
                image: imgMap.get(item.product_id) || "/src/assets/showroom.jpg",
              })),
            };

            setOrder(details);
          }
        } catch (err) {
          console.error("Error fetching order from database:", err);
        }
      }

      setLoading(false);
    };

    loadOrder();
  }, [orderNumber, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-28">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-28 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full border border-border bg-destructive/5 text-destructive">
          <CheckCircle size={30} strokeWidth={1.1} />
        </span>
        <h1 className="display-serif mt-8 text-3xl text-foreground">Order Not Found</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm">
          We could not load the confirmation details for order number {orderNumber}.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex bg-foreground px-8 py-3 eyebrow text-background hover:bg-primary transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-28 min-h-screen bg-muted/10">
      <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <Reveal>
          <div className="text-center space-y-4 mb-10">
            <div className="inline-grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 mb-2">
              <CheckCircle size={28} />
            </div>
            <h1 className="display-serif text-3xl md:text-4xl text-foreground">Thank You For Your Order!</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your order has been placed successfully. An email confirmation has been sent to <span className="font-semibold text-foreground">{order.customerEmail}</span>.
            </p>
            <div className="inline-block border border-primary/20 bg-card px-6 py-2.5 rounded-sm">
              <span className="text-xs text-muted-foreground uppercase tracking-widest block">Order Number</span>
              <span className="font-mono text-sm font-bold text-primary block mt-0.5">{order.orderNumber}</span>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Details Column */}
          <Reveal delay={100} className="space-y-6">
            <div className="bg-background border border-border p-6 rounded-sm space-y-4">
              <h2 className="font-serif text-lg text-foreground border-b border-border pb-3 flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Shipping Summary
              </h2>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{order.customerName}</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
                    </p>
                  </div>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone size={15} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">{order.customerPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-primary shrink-0" />
                  <span className="text-muted-foreground">{order.customerEmail}</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Order Summary Column */}
          <Reveal delay={150} className="space-y-6">
            <div className="bg-background border border-border p-6 rounded-sm space-y-4">
              <h2 className="font-serif text-lg text-foreground border-b border-border pb-3 flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary" />
                Items Ordered
              </h2>

              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 py-3 text-xs">
                    <img src={item.image} alt={item.name} className="h-12 w-10 object-cover rounded-sm border border-border/50 bg-cream" />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm font-medium truncate text-foreground">{item.name}</p>
                      <p className="text-muted-foreground mt-0.5">Qty: {item.qty} × {formatPrice(item.price)}</p>
                    </div>
                    <p className="font-serif font-semibold text-foreground self-center">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Cost</span>
                  <span className="text-foreground">{formatPrice(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-sm font-serif font-semibold">
                  <span className="text-foreground">Total Paid</span>
                  <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="text-center pt-8">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center bg-foreground px-8 py-3.5 eyebrow text-background hover:bg-primary hover:text-primary-foreground transition-colors rounded-sm"
            >
              Continue Shopping
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
            {user && (
              <Link
                to="/account"
                search={{ tab: "orders" }}
                className="inline-flex items-center justify-center border border-foreground px-8 py-3.5 eyebrow text-foreground hover:bg-foreground hover:text-background transition-all rounded-sm"
              >
                View Order History
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
