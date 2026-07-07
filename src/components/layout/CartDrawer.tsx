import { Link } from "@tanstack/react-router";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, cartLineProduct } from "@/lib/store";
import { formatPrice } from "@/data/products";
import { QuantityStepper } from "@/components/ui-custom/QuantityStepper";

const FREE_SHIPPING_THRESHOLD = 2999;

export function CartDrawer() {
  const {
    products,
    cart,
    cartOpen,
    setCartOpen,
    cartSubtotal,
    setQuantity,
    removeFromCart,
  } = useStore();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const progress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60]",
        cartOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!cartOpen}
    >
      {/* Overlay */}
      <div
        onClick={() => setCartOpen(false)}
        className={cn(
          "absolute inset-0 bg-charcoal/45 backdrop-blur-[2px] transition-opacity duration-500",
          cartOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          cartOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <h2 className="font-serif text-lg text-foreground">Your Bag</h2>
            <span className="text-sm text-muted-foreground">
              ({cart.length})
            </span>
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="text-foreground transition-colors hover:text-primary"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-border">
              <ShoppingBag size={24} strokeWidth={1.25} className="text-primary" />
            </span>
            <p className="mt-6 font-serif text-xl text-foreground">
              Your bag is empty
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover pieces made to be treasured.
            </p>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="mt-8"
            >
              <Link
                to="/shop"
                className="inline-flex items-center bg-foreground px-8 py-3 eyebrow text-background transition-colors hover:bg-primary"
              >
                Explore Collection
              </Link>
            </button>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="border-b border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">
                {remaining > 0 ? (
                  <>
                    You're{" "}
                    <span className="text-foreground">{formatPrice(remaining)}</span>{" "}
                    away from complimentary shipping.
                  </>
                ) : (
                  <span className="text-primary">
                    You've unlocked complimentary shipping.
                  </span>
                )}
              </p>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2">
              {cart.map((line) => {
                const p = cartLineProduct(line, products);
                if (!p) return null;
                return (
                  <div
                    key={line.id}
                    className="flex gap-4 border-b border-border/60 py-5 last:border-0"
                  >
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      onClick={() => setCartOpen(false)}
                      className="shrink-0 overflow-hidden rounded-sm bg-cream"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-24 w-20 object-cover"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="eyebrow text-[0.55rem] text-muted-foreground">
                            {p.category}
                          </p>
                          <h3 className="mt-1 truncate font-serif text-[0.95rem] text-foreground">
                            {p.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => removeFromCart(line.id)}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(q) => setQuantity(line.id, q)}
                          size="sm"
                        />
                        <p className="font-serif text-sm text-foreground">
                          {formatPrice(p.price * line.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-muted-foreground">Subtotal</span>
                <span className="font-serif text-lg text-foreground">
                  {formatPrice(cartSubtotal)}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Shipping & taxes calculated at checkout.
              </p>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="mt-5 block w-full"
              >
                <Link
                  to="/cart"
                  className="block w-full bg-foreground py-4 text-center eyebrow text-background transition-colors hover:bg-primary"
                >
                  View Bag & Checkout
                </Link>
              </button>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="mt-3 w-full text-center text-xs text-muted-foreground link-underline"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
