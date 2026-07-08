import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, Tag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { useStore, cartLineProduct } from "@/lib/store";
import { formatPrice } from "@/data/products";
import { QuantityStepper } from "@/components/ui-custom/QuantityStepper";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Aryansh Gold" },
      { name: "description", content: "Review your Aryansh Gold shopping bag and checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

const FREE_SHIPPING_THRESHOLD = 2999;
const COUPONS: Record<string, number> = { ARYANSH10: 0.1, LUXE15: 0.15 };

function CartPage() {
  const { products, cart, cartSubtotal, setQuantity, removeFromCart } = useStore();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; rate: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (COUPONS[code]) {
      setApplied({ code, rate: COUPONS[code] });
      setCouponError("");
    } else {
      setApplied(null);
      setCouponError("This code isn't valid.");
    }
  };

  const discount = applied ? Math.round(cartSubtotal * applied.rate) : 0;
  const shipping =
    cartSubtotal === 0 || cartSubtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  const total = cartSubtotal - discount + shipping;

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-28 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full border border-border">
          <ShoppingBag size={30} strokeWidth={1.1} className="text-primary" />
        </span>
        <p className="eyebrow mt-8 text-primary">Your Bag</p>
        <h1 className="display-serif mt-4 text-3xl text-foreground sm:text-4xl">
          Your bag is empty
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Beautiful things are waiting. Discover pieces made to be treasured.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center bg-foreground px-9 py-3.5 eyebrow text-background transition-colors hover:bg-primary"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <p className="eyebrow text-primary">Checkout</p>
        <h1 className="display-serif mt-3 text-3xl text-foreground sm:text-4xl">
          Your Shopping Bag
        </h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* Line items */}
          <div>
            <div className="hidden border-b border-border pb-3 md:grid md:grid-cols-[1fr_auto_auto] md:gap-8">
              <span className="eyebrow text-[0.6rem] text-muted-foreground">Product</span>
              <span className="eyebrow text-[0.6rem] text-muted-foreground">Quantity</span>
              <span className="eyebrow text-[0.6rem] text-muted-foreground text-right">Total</span>
            </div>

            {cart.map((line) => {
              const p = cartLineProduct(line, products);
              if (!p) return null;
              return (
                <div
                  key={line.id}
                  className="grid grid-cols-[auto_1fr] gap-4 border-b border-border/60 py-6 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-8"
                >
                  <div className="flex gap-4 md:col-span-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="shrink-0 overflow-hidden rounded-sm bg-cream"
                    >
                      <img src={p.image} alt={p.name} className="h-28 w-24 object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-col">
                      <p className="eyebrow text-[0.55rem] text-muted-foreground">
                        {p.category}
                      </p>
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="mt-1 font-serif text-base text-foreground transition-colors hover:text-primary"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(p.price)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.id)}
                        className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted-foreground transition-colors hover:text-destructive md:hidden"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between md:col-span-1 md:justify-center">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(q) => setQuantity(line.id, q)}
                      size="sm"
                    />
                    <p className="font-serif text-base text-foreground md:hidden">
                      {formatPrice(p.price * line.quantity)}
                    </p>
                  </div>

                  <div className="hidden items-center gap-4 md:flex md:justify-end">
                    <p className="font-serif text-base text-foreground">
                      {formatPrice(p.price * line.quantity)}
                    </p>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => removeFromCart(line.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}

            <Link
              to="/shop"
              className="mt-8 inline-block text-sm text-muted-foreground link-underline"
            >
              ← Continue shopping
            </Link>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="border border-border bg-card p-7">
              <h2 className="font-serif text-xl text-foreground">Order Summary</h2>

              {/* Coupon */}
              <div className="mt-6">
                <label className="eyebrow text-[0.6rem] text-muted-foreground">
                  Promo Code
                </label>
                <div className="mt-2.5 flex gap-2">
                  <div className="relative flex-1">
                    <Tag
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Enter code"
                      className="w-full border border-border bg-background py-3 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="shrink-0 border border-foreground px-4 eyebrow text-[0.6rem] text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 text-xs text-destructive">{couponError}</p>
                )}
                {applied && (
                  <p className="mt-2 text-xs text-primary">
                    Code {applied.code} applied — {Math.round(applied.rate * 100)}% off
                  </p>
                )}
                <p className="mt-2 text-[0.68rem] text-muted-foreground">
                  Try ARYANSH10 or LUXE15
                </p>
              </div>

              <div className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
                <Row label="Subtotal" value={formatPrice(cartSubtotal)} />
                {discount > 0 && (
                  <Row label="Discount" value={`−${formatPrice(discount)}`} accent />
                )}
                <Row
                  label="Estimated Shipping"
                  value={shipping === 0 ? "Free" : formatPrice(shipping)}
                />
                {shipping > 0 && (
                  <p className="text-[0.68rem] text-muted-foreground">
                    Add {formatPrice(FREE_SHIPPING_THRESHOLD - (cartSubtotal - discount))} more
                    for complimentary shipping.
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
                <span className="font-serif text-lg text-foreground">Total</span>
                <span className="font-serif text-xl text-foreground">
                  {formatPrice(total)}
                </span>
              </div>

              <Link to="/checkout" className="block mt-6 w-full text-center">
                <button
                  type="button"
                  className="w-full bg-foreground py-4 eyebrow text-background transition-colors hover:bg-primary cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </Link>

              <div className="mt-6 grid gap-3 border-t border-border pt-6">
                <Perk icon={ShieldCheck} text="Secure, encrypted checkout" />
                <Perk icon={Truck} text="Fast dispatch in 24–48 hours" />
                <Perk icon={RotateCcw} text="Easy 7-day returns" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}

function Perk({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <Icon size={16} strokeWidth={1.5} className="text-primary" />
      {text}
    </div>
  );
}
