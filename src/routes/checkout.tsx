import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, cartLineProduct } from "@/lib/store";
import { formatPrice } from "@/data/products";
import { CreditCard, ShoppingBag, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const { products, cart, cartSubtotal } = useStore();
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  const [shippingForm, setShippingForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const [billingForm, setBillingForm] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const total = cartSubtotal > 0 ? cartSubtotal + 99 : 0; // Fixed shipping rate of 99

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

        {/* Milestone 10 Notice Banner */}
        <div className="flex items-start gap-3 p-4 mb-6 rounded-sm border border-amber-200/60 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold uppercase tracking-wider">Checkout Placeholder</p>
            <p className="mt-1">Checkout Foundation will be implemented in Milestone 10. Actual payment processing and database checkout flows are currently disabled.</p>
          </div>
        </div>

        <h1 className="display-serif text-3xl text-foreground border-b border-border pb-4 mb-8">
          Checkout Information
        </h1>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Checkout Info Forms */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping Card */}
            <div className="bg-background border border-border p-6 rounded-sm space-y-4">
              <h2 className="font-serif text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
                <CreditCard className="text-primary" size={18} />
                Shipping Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Full Name *</label>
                    <Input
                      disabled
                      placeholder="e.g. Divyansh Gupta"
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                      className="mt-1 border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Phone Number</label>
                    <Input
                      disabled
                      placeholder="e.g. +91 98765 43210"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      className="mt-1 border-border"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Email Address *</label>
                  <Input
                    disabled
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                    className="mt-1 border-border"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Street Address *</label>
                  <Input
                    disabled
                    placeholder="e.g. Apartment, suite, unit, building, street"
                    value={shippingForm.street}
                    onChange={(e) => setShippingForm({ ...shippingForm, street: e.target.value })}
                    className="mt-1 border-border"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">City *</label>
                    <Input
                      disabled
                      placeholder="City"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      className="mt-1 border-border"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">State *</label>
                    <Input
                      disabled
                      placeholder="State"
                      value={shippingForm.state}
                      onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                      className="mt-1 border-border"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">ZIP Code *</label>
                    <Input
                      disabled
                      placeholder="ZIP Code"
                      value={shippingForm.zip}
                      onChange={(e) => setShippingForm({ ...shippingForm, zip: e.target.value })}
                      className="mt-1 border-border"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Card */}
            <div className="bg-background border border-border p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                  Billing Details
                </h2>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  Same as shipping details
                </label>
              </div>

              {!billingSameAsShipping && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Street Address *</label>
                    <Input
                      disabled
                      placeholder="e.g. Street, suite, unit"
                      value={billingForm.street}
                      onChange={(e) => setBillingForm({ ...billingForm, street: e.target.value })}
                      className="mt-1 border-border"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">City *</label>
                      <Input
                        disabled
                        placeholder="City"
                        value={billingForm.city}
                        onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                        className="mt-1 border-border"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">State *</label>
                      <Input
                        disabled
                        placeholder="State"
                        value={billingForm.state}
                        onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                        className="mt-1 border-border"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase">ZIP Code *</label>
                      <Input
                        disabled
                        placeholder="ZIP Code"
                        value={billingForm.zip}
                        onChange={(e) => setBillingForm({ ...billingForm, zip: e.target.value })}
                        className="mt-1 border-border"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background border border-border p-6 rounded-sm space-y-6">
              <h2 className="font-serif text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
                Order Items
              </h2>

              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-2">
                {cart.map((line) => {
                  const p = cartLineProduct(line, products);
                  if (!p) return null;
                  return (
                    <div key={line.id} className="flex gap-3 py-3 text-xs">
                      <img src={p.image} alt={p.name} className="h-14 w-12 object-cover rounded-sm" />
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

              <div className="pt-2">
                <Button disabled className="w-full py-4 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                  Checkout Coming Soon
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-4 bg-background border border-border/80 text-[10px] text-muted-foreground rounded-sm">
              <ShieldCheck className="text-primary shrink-0" size={16} />
              <p>Your connection is secure. All order details are previewed in temporary client session memory.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
