import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore, cartLineProduct } from "@/lib/store";
import { formatPrice } from "@/data/products";
import { CreditCard, ShoppingBag, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Zod Validation Schema
const checkoutSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"),
  street: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zip: z.string().regex(/^\d{6}$/, "ZIP code must be a 6-digit number"),
  billingSameAsShipping: z.boolean(),
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.billingSameAsShipping) {
    if (!data.billingStreet || data.billingStreet.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing address must be at least 5 characters",
        path: ["billingStreet"],
      });
    }
    if (!data.billingCity || data.billingCity.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing city must be at least 2 characters",
        path: ["billingCity"],
      });
    }
    if (!data.billingState || data.billingState.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing state must be at least 2 characters",
        path: ["billingState"],
      });
    }
    if (!data.billingZip || !/^\d{6}$/.test(data.billingZip)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing ZIP code must be 6 digits",
        path: ["billingZip"],
      });
    }
  }
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Aryansh Gold" },
      { name: "description", content: "Complete your order checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { products, cart, cartSubtotal, clearCart } = useStore();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false);

  const total = cartSubtotal > 0 ? cartSubtotal + 99 : 0; // Fixed shipping rate of 99

  // Load Razorpay Standard Checkout SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      toast.error("Failed to load the payment gateway. Please reload the page.");
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      billingSameAsShipping: true,
      billingStreet: "",
      billingCity: "",
      billingState: "",
      billingZip: "",
      notes: "",
    },
  });

  // Watch field to toggle billing form display dynamically
  const billingSameAsShipping = watch("billingSameAsShipping");

  // Prefill form details from user profile once authenticated
  useEffect(() => {
    if (user) {
      setValue("email", user.email || "");
    }
    if (profile) {
      setValue("name", profile.full_name || "");
      if (profile.phone) {
        setValue("phone", profile.phone || "");
      }
    }
  }, [user, profile, setValue]);

  const onSubmit = async (formData: CheckoutFormData) => {
    if (import.meta.env.VITE_CATALOG_MODE === "true") {
      toast.warning("Online checkout is temporarily disabled in Catalog Mode.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!razorpayScriptLoaded || typeof (window as any).Razorpay === "undefined") {
      toast.error("Payment gateway is still loading. Please wait a moment.");
      return;
    }

    try {
      // 1. Create Payment Order inside Razorpay and insert order_drafts table
      const orderRes = await fetch("/api/create-payment-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart.map((item) => ({
            variant_id: item.id,
            quantity: item.quantity,
          })),
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
          billingAddress: formData.billingSameAsShipping
            ? null
            : {
                street: formData.billingStreet,
                city: formData.billingCity,
                state: formData.billingState,
                zip: formData.billingZip,
              },
          notes: formData.notes || null,
          userId: user?.id || null,
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        toast.error(errData.error || "Failed to initiate payment. Check item stock counts.");
        return;
      }

      const { razorpay_order_id, amount, currency, key_id } = await orderRes.json();

      // 2. Configure Razorpay Standard Checkout popup options
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "Aryansh Gold",
        description: "Secure Jewellery Checkout",
        image: "/src/assets/aryansh-logo-mark.png",
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          const toastId = toast.loading("Verifying payment transaction...");

          try {
            // 3. Verify Payment Signature and finalize order
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              toast.dismiss(toastId);
              toast.error(verifyData.error || "Signature verification failed. Please contact support.");
              return;
            }

            // Handle post-payment stock collision / conflict state
            if (verifyData.status === "inventory_conflict") {
              toast.dismiss(toastId);
              toast.error(verifyData.message, { duration: 10000 });
              navigate({ to: "/cart" }); // Redirect to cart
              return;
            }

            // Success Order Creation State
            const lastOrderDetails = {
              orderNumber: verifyData.order_number,
              customerName: formData.name,
              customerEmail: formData.email,
              customerPhone: formData.phone || undefined,
              shippingAddress: {
                street: formData.street,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
              },
              subtotal: cartSubtotal,
              shippingCost: 99,
              totalAmount: total,
              items: cart.map((line) => {
                const p = cartLineProduct(line, products);
                return {
                  name: p?.name || "Unknown Product",
                  qty: line.quantity,
                  price: p?.price || 0,
                  image: p?.image || "/src/assets/showroom.jpg",
                };
              }),
            };

            sessionStorage.setItem("aryansh_last_order", JSON.stringify(lastOrderDetails));

            // Clear cart
            await clearCart();
            
            toast.dismiss(toastId);
            toast.success("Payment authorized and order created successfully!");

            // Redirect to success page
            navigate({
              to: "/order-confirmation",
              search: { orderNumber: verifyData.order_number },
            });

          } catch (verifyErr) {
            console.error("Payment verification failure:", verifyErr);
            toast.dismiss(toastId);
            toast.error("Network connection failed during verification. Please contact support.");
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#bfa054", // gold primary
        },
        modal: {
          ondismiss: function () {
            toast.warning("Payment checkout cancelled.");
          },
        },
      };

      // Open Razorpay Standard Checkout SDK popup
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      toast.error("Failed to initialize checkout. Please try again.");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-28 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full border border-border">
          <ShoppingBag size={30} strokeWidth={1.1} className="text-primary" />
        </span>
        <h1 className="display-serif mt-8 text-3xl text-foreground">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm">
          Add items to your bag before proceeding to checkout.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex bg-foreground px-8 py-3 eyebrow text-background hover:bg-primary transition-colors"
        >
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-28 min-h-screen bg-muted/10">
      <div className="mx-auto max-w-5xl px-5 py-12 md:px-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft size={14} />
          Return to shopping bag
        </Link>

        <h1 className="display-serif text-3xl text-foreground border-b border-border pb-4 mb-8">
          Checkout Information
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-5">
          {/* Checkout Info Forms */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping Card */}
            <div className="bg-background border border-border p-6 rounded-sm space-y-4 shadow-sm">
              <h2 className="font-serif text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
                <CreditCard className="text-primary" size={18} />
                Shipping Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name *</label>
                    <Input
                      placeholder="e.g. Divyansh Gupta"
                      {...register("name")}
                      className={`mt-1 border-border ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone Number *</label>
                    <Input
                      placeholder="e.g. 9876543210"
                      {...register("phone")}
                      className={`mt-1 border-border ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="e.g. name@example.com"
                    {...register("email")}
                    className={`mt-1 border-border ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Street Address *</label>
                  <Input
                    placeholder="e.g. Apartment, suite, unit, building, street"
                    {...register("street")}
                    className={`mt-1 border-border ${errors.street ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  {errors.street && (
                    <p className="mt-1 text-xs text-destructive">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City *</label>
                    <Input
                      placeholder="City"
                      {...register("city")}
                      className={`mt-1 border-border ${errors.city ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">State *</label>
                    <Input
                      placeholder="State"
                      {...register("state")}
                      className={`mt-1 border-border ${errors.state ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-destructive">{errors.state.message}</p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ZIP Code *</label>
                    <Input
                      placeholder="6 digits"
                      {...register("zip")}
                      className={`mt-1 border-border ${errors.zip ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.zip && (
                      <p className="mt-1 text-xs text-destructive">{errors.zip.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Notes (Optional)</label>
                  <Textarea
                    placeholder="e.g. Special instructions for delivery, landmark, etc."
                    {...register("notes")}
                    className="mt-1 border-border resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Billing Card */}
            <div className="bg-background border border-border p-6 rounded-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                  Billing Details
                </h2>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("billingSameAsShipping")}
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  Same as shipping details
                </label>
              </div>

              {!billingSameAsShipping && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Street Address *</label>
                    <Input
                      placeholder="e.g. Street, suite, unit"
                      {...register("billingStreet")}
                      className={`mt-1 border-border ${errors.billingStreet ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.billingStreet && (
                      <p className="mt-1 text-xs text-destructive">{errors.billingStreet.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City *</label>
                      <Input
                        placeholder="City"
                        {...register("billingCity")}
                        className={`mt-1 border-border ${errors.billingCity ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {errors.billingCity && (
                        <p className="mt-1 text-xs text-destructive">{errors.billingCity.message}</p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">State *</label>
                      <Input
                        placeholder="State"
                        {...register("billingState")}
                        className={`mt-1 border-border ${errors.billingState ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {errors.billingState && (
                        <p className="mt-1 text-xs text-destructive">{errors.billingState.message}</p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ZIP Code *</label>
                      <Input
                        placeholder="ZIP Code"
                        {...register("billingZip")}
                        className={`mt-1 border-border ${errors.billingZip ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {errors.billingZip && (
                        <p className="mt-1 text-xs text-destructive">{errors.billingZip.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background border border-border p-6 rounded-sm space-y-6 shadow-sm">
              <h2 className="font-serif text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
                Order Summary
              </h2>

              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-2">
                {cart.map((line) => {
                  const p = cartLineProduct(line, products);
                  if (!p) return null;
                  return (
                    <div key={line.id} className="flex gap-3 py-3 text-xs">
                      <img src={p.image} alt={p.name} className="h-14 w-12 object-cover rounded-sm border border-border/40" />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-sm font-medium truncate text-foreground">{p.name}</p>
                        <p className="text-muted-foreground mt-0.5">Qty: {line.quantity} × {formatPrice(p.price)}</p>
                      </div>
                      <p className="font-serif font-semibold text-foreground self-center">{formatPrice(p.price * line.quantity)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Cost</span>
                  <span className="text-foreground">{formatPrice(99)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-sm font-serif font-semibold">
                  <span className="text-foreground">Total to Pay</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {import.meta.env.VITE_CATALOG_MODE === "true" && (
                <div className="p-5 mb-4 rounded-sm border border-primary/25 bg-cream/40 text-center text-xs shadow-sm">
                  <p className="font-serif font-bold text-primary uppercase tracking-wider text-[10px]">Catalog Showcase Mode</p>
                  <p className="mt-2 text-foreground/80 font-light leading-relaxed">
                    Online ordering will be available shortly.
                    <br />
                    Browse our collections or visit our showroom.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !razorpayScriptLoaded || import.meta.env.VITE_CATALOG_MODE === "true"}
                  className="w-full py-4 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Initiating Payment...
                    </>
                  ) : import.meta.env.VITE_CATALOG_MODE === "true" ? (
                    "Checkout Disabled"
                  ) : (
                    "Pay Securely via Razorpay"
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-4 bg-background border border-border/80 text-[10px] text-muted-foreground rounded-sm shadow-sm">
              <ShieldCheck className="text-primary shrink-0" size={16} />
              <p>Payments are processed securely via Razorpay. Your order is initialized only upon successful signature verification.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
